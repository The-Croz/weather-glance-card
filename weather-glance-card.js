/*! Weather Glance Card v1.1.0 — Home Assistant custom card */
const WGC_VERSION = '1.1.0';

const DEFAULTS = {
  layout: 'auto', theme: 'auto',
  show_clock: true, show_alerts: true, show_nowcast: true, show_stats: true, show_hourly: true, show_daily: true,
  hourly_count: 12, daily_count: 7,
  stats: ['humidity', 'aqi', 'wind', 'uv', 'pressure', 'sun'],
};

const COND = {
  'clear-night': ['mdi:weather-night', 'Clear', 'night'],
  cloudy: ['mdi:weather-cloudy', 'Cloudy', 'cloud'],
  exceptional: ['mdi:alert-circle-outline', 'Exceptional', 'storm'],
  fog: ['mdi:weather-fog', 'Fog', 'cloud'],
  hail: ['mdi:weather-hail', 'Hail', 'rain'],
  lightning: ['mdi:weather-lightning', 'Lightning', 'storm'],
  'lightning-rainy': ['mdi:weather-lightning-rainy', 'Thunderstorms', 'storm'],
  partlycloudy: ['mdi:weather-partly-cloudy', 'Partly Cloudy', 'sun'],
  pouring: ['mdi:weather-pouring', 'Heavy Rain', 'rain'],
  rainy: ['mdi:weather-rainy', 'Rain', 'rain'],
  snowy: ['mdi:weather-snowy', 'Snow', 'snow'],
  'snowy-rainy': ['mdi:weather-snowy-rainy', 'Sleet', 'snow'],
  sunny: ['mdi:weather-sunny', 'Sunny', 'sun'],
  windy: ['mdi:weather-windy', 'Windy', 'cloud'],
  'windy-variant': ['mdi:weather-windy-variant', 'Windy', 'cloud'],
};
const NIGHT = { sunny: 'mdi:weather-night', partlycloudy: 'mdi:weather-night-partly-cloudy' };

// [upper bound, label, dark color, light color]
const AQI = [[50, 'Good', '#66bb6a', '#2e7d32'], [100, 'Moderate', '#fdd835', '#8a6d00'], [150, 'Sensitive groups', '#ffa726', '#e65100'], [200, 'Unhealthy', '#ef5350', '#c62828'], [300, 'Very unhealthy', '#ba68c8', '#7b1fa2'], [1e9, 'Hazardous', '#a1887f', '#6d1b1b']];
const UV = [[2, 'Low', '#66bb6a', '#2e7d32'], [5, 'Moderate', '#fdd835', '#8a6d00'], [7, 'High', '#ffa726', '#e65100'], [10, 'Very high', '#ef5350', '#c62828'], [1e9, 'Extreme', '#ba68c8', '#7b1fa2']];
const LVL = { 3: { bg: '#c62828', fg: '#ffffff' }, 2: { bg: '#bf360c', fg: '#ffffff' }, 1: { bg: '#f9a825', fg: '#212121' } };
const DIRS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = v => { const n = parseFloat(v); return Number.isFinite(n) ? n : null; };
const r = v => (v == null ? '–' : Math.round(v));
const band = (tbl, v) => tbl.find(b => v <= b[0]);
const cardinal = b => { const n = num(b); return n == null ? (b ? String(b) : '') : DIRS[Math.round(n / 22.5) % 16]; };
const BAD = ['unknown', 'unavailable', '', undefined, null];

const STYLE = `
:host{display:block}
:host([data-theme=dark]){--ha-card-background:#1c1c1c;--card-background-color:#1c1c1c;--primary-text-color:#e1e1e1;--secondary-text-color:#9e9e9e;--divider-color:rgba(255,255,255,.08)}
:host([data-theme=light]){--ha-card-background:#ffffff;--card-background-color:#ffffff;--primary-text-color:#212121;--secondary-text-color:#6b6b6b;--divider-color:rgba(0,0,0,.1)}
ha-card{overflow:hidden;height:100%;box-sizing:border-box}
.wx{--tile:color-mix(in srgb,var(--primary-text-color) 6%,transparent);--track:color-mix(in srgb,var(--primary-text-color) 11%,transparent);--div:var(--divider-color,rgba(127,127,127,.2));color:var(--primary-text-color);font-variant-numeric:tabular-nums}
.dark{--rain:#4fc3f7;--cloud:#b0bec5;--snow:#bbdefb;--warm:#ffb74d;--night:#9fa8da}
.light{--rain:#0288d1;--cloud:#78909c;--snow:#64b5f6;--warm:#ef6c00;--night:#5c6bc0}
.t-sun{color:#ffc107}.t-night{color:var(--night)}.t-rain{color:var(--rain)}.t-cloud{color:var(--cloud)}.t-storm{color:var(--warm)}.t-snow{color:var(--snow)}
.tap{cursor:pointer;-webkit-tap-highlight-color:transparent}
.tap:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}
.warn{padding:16px;color:var(--error-color,#db4437)}
.top{display:flex;justify-content:space-between;align-items:flex-start;padding:16px 16px 0;gap:12px}
.time{display:flex;align-items:baseline;gap:4px}.hm{font-size:28px;font-weight:600;letter-spacing:-.5px}.ap{font-size:13px;font-weight:500;color:var(--secondary-text-color)}
.date{font-size:13px;color:var(--secondary-text-color);margin-top:2px}
.loc{display:flex;align-items:center;gap:4px;font-size:12px;color:var(--secondary-text-color);padding-top:6px;--mdc-icon-size:15px;white-space:nowrap}
.hero{display:flex;align-items:center;gap:14px;padding:14px 16px 4px;border-radius:12px}
.hero-icon{--mdc-icon-size:72px;flex:none}
.temp{display:flex;align-items:flex-start;font-size:60px;font-weight:300;line-height:1;letter-spacing:-2px}
.temp small{font-size:22px;letter-spacing:0;color:var(--secondary-text-color);margin-top:6px}
.cond{font-size:15px;font-weight:500;margin-top:4px}
.sub{font-size:13px;color:var(--secondary-text-color);margin-top:2px}
.banner{margin:12px 16px 0;padding:10px 12px;border-radius:10px;background:color-mix(in srgb,var(--rain) 12%,transparent);display:flex;align-items:center;gap:10px;--mdc-icon-size:20px}
.banner ha-icon{color:var(--rain);flex:none}.banner b{font-size:13px;font-weight:500;display:block}.banner span{font-size:12px;color:var(--secondary-text-color)}
.stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;padding:12px 16px 0}
.stat{background:var(--tile);border-radius:10px;padding:9px 10px;display:flex;flex-direction:column;gap:3px;min-width:0}
.stat .lb{display:flex;align-items:center;gap:4px;font-size:11px;color:var(--secondary-text-color);text-transform:uppercase;letter-spacing:.4px;--mdc-icon-size:14px;white-space:nowrap;overflow:hidden}
.stat .v{font-size:17px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.stat .s{font-size:11px;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-height:13px}
.h{padding:16px 16px 6px;font-size:12px;font-weight:500;color:var(--secondary-text-color);text-transform:uppercase;letter-spacing:.5px;display:flex;justify-content:space-between;align-items:center;gap:8px}
.strip{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(44px,1fr);overflow-x:auto;padding:0 10px;scrollbar-width:none}
.strip::-webkit-scrollbar,.chart::-webkit-scrollbar{display:none}
.hr{display:flex;flex-direction:column;align-items:center;gap:5px;--mdc-icon-size:22px}
.hr .t{font-size:11px;color:var(--secondary-text-color);white-space:nowrap}.hr .tp{font-size:14px;font-weight:500}
.bar{width:6px;height:28px;border-radius:3px;background:var(--track);display:flex;align-items:flex-end;overflow:hidden}.bar i{display:block;width:100%;background:var(--rain);border-radius:3px}
.pop{font-size:10px;color:var(--rain);min-height:12px;white-space:nowrap}
.divider{height:1px;background:var(--div);margin:12px 16px 0}
.days{padding:8px 16px 14px}
.day{display:grid;grid-template-columns:52px 64px 36px minmax(0,1fr) 36px 16px;align-items:center;gap:8px;height:38px;--mdc-icon-size:20px;border-radius:8px}
.dn{font-size:14px;font-weight:500}.ic{display:flex;align-items:center;gap:3px}
.lo{font-size:14px;color:var(--secondary-text-color);text-align:right}.hi{font-size:14px;font-weight:500}
.range{height:5px;border-radius:3px;background:var(--track);position:relative}.range i{position:absolute;top:0;bottom:0;border-radius:3px;background:linear-gradient(90deg,var(--rain),var(--warm))}
.chev{--mdc-icon-size:16px;color:var(--secondary-text-color);transition:transform .2s}.day.open .chev{transform:rotate(180deg)}
.dayx{padding:2px 0 10px}.dayx .strip{padding:0}
.note{font-size:12px;color:var(--secondary-text-color);padding:6px 0 10px}
.alert{margin:12px 16px 0;border-radius:10px;overflow:hidden;background:color-mix(in srgb,var(--lvl) 12%,transparent)}
.ah{display:flex;align-items:center;gap:10px;padding:10px 12px;--mdc-icon-size:22px}
.ah div{flex:1;min-width:0}.ah b{display:block;font-size:14px;font-weight:700}.ah span{font-size:12px;opacity:.92}
.ab{padding:10px 12px;font-size:13px;display:flex;flex-direction:column;gap:6px;line-height:1.4}
.meta{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--secondary-text-color);--mdc-icon-size:15px}.meta span{display:flex;align-items:center;gap:4px}
.abar{display:flex;align-items:center;gap:8px;min-height:40px;padding:0 10px;border-radius:10px;--mdc-icon-size:18px}.abar b{flex:1;min-width:0;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wide{display:grid;grid-template-columns:280px minmax(0,1fr)}
.whead{grid-column:1/-1;display:flex;align-items:center;gap:20px;padding:18px 20px 16px;border-bottom:1px solid var(--div);min-width:0}
.whead .hm{font-size:48px;font-weight:700;letter-spacing:-1.5px;line-height:1}.whead .ap{font-size:16px;font-weight:600}.whead .date{font-size:14px;margin-top:4px;white-space:nowrap}
.vr{width:1px;align-self:stretch;background:var(--div);flex:none}
.cur{display:flex;align-items:center;gap:12px;min-width:0;border-radius:12px}.cur .hero-icon{--mdc-icon-size:52px}
.cur .temp{font-size:48px;font-weight:400;letter-spacing:-1.5px}.cur .txt{min-width:0}.cur .cond{margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cur .sub{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.whead .loc{margin-left:auto;align-self:flex-start;padding-top:2px;overflow:hidden;text-overflow:ellipsis;min-width:0}
.wide .left{padding:12px 20px 16px;border-right:1px solid var(--div);display:flex;flex-direction:column;gap:18px}
.row{display:flex;align-items:center;gap:10px;height:34px;border-bottom:1px solid var(--div);--mdc-icon-size:18px}.row ha-icon{color:var(--secondary-text-color)}
.row .l{flex:1;font-size:13px;color:var(--secondary-text-color)}.row .v{font-size:14px;font-weight:500}.row .s{font-size:12px;min-width:64px;text-align:right;color:var(--secondary-text-color)}
.wide .right{padding:16px 20px 20px;display:flex;flex-direction:column;gap:16px;min-width:0}
.wide .alert,.wide .banner{margin:0}.wide .h{padding:0 0 8px}
.chart{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(46px,1fr);overflow-x:auto;background:var(--tile);border-radius:10px;padding:10px 4px;scrollbar-width:none}
.col{display:flex;flex-direction:column;align-items:center;--mdc-icon-size:22px}.col .t{font-size:11px;color:var(--secondary-text-color);white-space:nowrap}.col ha-icon{margin-top:4px}
.curve{height:52px;width:100%;position:relative}.curve div{position:absolute;left:0;right:0;display:flex;flex-direction:column;align-items:center;gap:2px;font-size:13px;font-weight:500}
.dot{width:6px;height:6px;border-radius:50%;background:var(--warm)}
.pb{height:44px;width:60%;display:flex;align-items:flex-end}.pb i{display:block;width:100%;background:color-mix(in srgb,var(--rain) 75%,transparent);border-radius:3px 3px 0 0}
.col .pop{margin-top:3px}
.dgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(64px,1fr));gap:6px}
.dt{background:var(--tile);border-radius:10px;padding:10px 4px;display:flex;flex-direction:column;align-items:center;gap:4px;--mdc-icon-size:26px;border:1px solid transparent}
.dt.sel{border-color:var(--primary-color)}.dt .dn{font-size:12px;color:var(--secondary-text-color)}.dt .hi{font-size:15px}.dt .lo{font-size:13px;text-align:center}
.clear{display:inline-flex;align-items:center;gap:4px;text-transform:none;letter-spacing:0;font-weight:500;color:var(--primary-color);--mdc-icon-size:14px}
.compact{padding:14px;display:flex;flex-direction:column;gap:12px}
.chead{display:flex;align-items:center;gap:12px;border-radius:12px}
.bubble{width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;--mdc-icon-size:30px;background:color-mix(in srgb,currentColor 14%,transparent);flex:none}
.chead .grow{flex:1;min-width:0}.ct{font-size:15px;font-weight:500}.chead .sub{margin:0}
.cclock{display:flex;flex-direction:column;align-items:flex-end}.cclock .hm{font-size:22px}.cclock .date{font-size:12px;margin:0}
.chips{display:flex;flex-wrap:wrap;gap:6px}.chip{display:flex;align-items:center;gap:5px;height:30px;padding:0 10px;border-radius:15px;background:var(--tile);font-size:12px;font-weight:500;--mdc-icon-size:15px}
.cnow{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--rain);--mdc-icon-size:17px}
.tabs{display:flex;background:var(--tile);border-radius:10px;padding:3px}
.tab{flex:1;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:500;color:var(--secondary-text-color)}
.dark .tab.on{background:color-mix(in srgb,var(--primary-text-color) 12%,transparent);color:var(--primary-text-color)}
.light .tab.on{background:var(--ha-card-background,var(--card-background-color,#fff));color:var(--primary-text-color);box-shadow:0 1px 2px rgba(0,0,0,.15)}
.compact .strip{padding:0;gap:6px;grid-auto-columns:52px}.compact .hr{padding:8px 0;border-radius:10px}.compact .hr.now{background:var(--tile)}
.compact .days{padding:0}.compact .day{grid-template-columns:48px 28px 40px 32px minmax(0,1fr) 32px;height:36px}
.compact .h{padding:0}
.condensed{padding:16px;display:flex;flex-direction:column;gap:12px}
.condensed .whead{padding:0;border:none}
.condensed .strip{padding:0;gap:4px;grid-auto-columns:minmax(50px,1fr)}.condensed .hr{padding:6px 0;border-radius:10px}.condensed .hr.now{background:var(--tile)}
.condensed .h{padding:0}
.drow{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(58px,1fr);gap:6px;overflow-x:auto;scrollbar-width:none}.drow::-webkit-scrollbar{display:none}
.drow .dt{padding:8px 4px;gap:3px;--mdc-icon-size:24px}.drow .hl{font-size:13px;white-space:nowrap}.drow .hl b{font-size:15px;font-weight:500}.drow .hl span{color:var(--secondary-text-color)}
dialog{border:none;border-radius:16px;padding:0;width:min(560px,calc(100vw - 32px));max-height:80vh;background:var(--ha-card-background,var(--card-background-color,#fff));color:var(--primary-text-color);box-shadow:0 8px 32px rgba(0,0,0,.4)}
dialog::backdrop{background:rgba(0,0,0,.55)}
.dh{display:flex;align-items:center;justify-content:space-between;padding:14px 12px 8px 16px;font-size:18px;font-weight:500}
.dbody{padding:0 16px 16px;overflow:auto;max-height:calc(80vh - 64px);display:flex;flex-direction:column;gap:14px}
.ai{border-radius:12px;overflow:hidden;border:1px solid var(--divider-color,rgba(127,127,127,.2))}
.ai h4{margin:12px 12px 4px;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:var(--secondary-text-color);font-weight:500}
.ai p{margin:0;padding:0 12px 8px;font-size:14px;line-height:1.5;white-space:pre-wrap}
.ai a{display:block;padding:4px 12px 12px;font-size:13px;color:var(--primary-color)}
.x{background:none;border:none;color:inherit;cursor:pointer;--mdc-icon-size:22px;padding:6px;border-radius:50%;display:flex}
`;

class WeatherGlanceCard extends HTMLElement {
  static getConfigElement() { return document.createElement('weather-glance-card-editor'); }
  static getStubConfig(hass) {
    const ids = Object.keys(hass.states);
    const cfg = { entity: ids.find(e => e.startsWith('weather.')) || 'weather.home' };
    const aqi = ids.find(e => e.startsWith('sensor.') && hass.states[e].attributes.device_class === 'aqi');
    if (aqi) cfg.aqi_entity = aqi;
    const nws = ids.find(e => /^sensor\.nws_alerts/.test(e));
    if (nws) cfg.alerts_entity = nws;
    const mins = ids.find(e => /^sensor\..*minutely_summary$/.test(e));
    if (mins) cfg.nowcast_entity = mins;
    const uv = ids.find(e => /^sensor\..*uv_index$/.test(e));
    if (uv) cfg.uv_entity = uv;
    return cfg;
  }

  setConfig(config) {
    if (!config || !config.entity) throw new Error('Choose a weather entity');
    const prev = this._config?.entity;
    this._config = { ...DEFAULTS, ...config };
    if (!this.shadowRoot) this._build();
    if (prev && prev !== config.entity) { this._hourly = null; this._daily = null; this._subscribe(); }
    this._render();
  }

  set hass(h) {
    const old = this._hass; this._hass = h;
    if (!this._config) return;
    if (!this._subs?.length) this._subscribe();
    const c = this._config, keys = [c.entity, c.aqi_entity, c.alerts_entity, c.nowcast_entity, c.storm_distance_entity, c.storm_bearing_entity, c.uv_entity, 'sun.sun'];
    if (!old || old.themes?.darkMode !== h.themes?.darkMode || keys.some(k => k && old.states[k] !== h.states[k])) this._render();
  }

  getCardSize() { return { compact: 5, condensed: 6 }[this._layout()] || 9; }
  getGridOptions() {
    return this._config?.layout === 'wide' ? { columns: 'full', min_columns: 12, rows: 'auto' } : { columns: 12, min_columns: 6, rows: 'auto' };
  }

  connectedCallback() {
    if (this._hass && this._config && !this._subs?.length) this._subscribe();
    this._tick = setInterval(() => { const m = new Date().getMinutes(); if (m !== this._min) { this._min = m; this._render(); } }, 5000);
    this._ro = new ResizeObserver(([e]) => { const w = e.contentRect.width; if (Math.abs(w - (this._w || 0)) > 8) { this._w = w; if (this._config?.layout === 'auto') this._render(); } });
    this._ro.observe(this);
  }
  disconnectedCallback() { this._unsubscribe(); clearInterval(this._tick); this._ro?.disconnect(); }

  _build() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `<style>${STYLE}</style><ha-card><div id="c"></div></ha-card><dialog id="dlg"></dialog>`;
    this._c = this.shadowRoot.getElementById('c');
    this._dlg = this.shadowRoot.getElementById('dlg');
    this.shadowRoot.addEventListener('click', e => this._onClick(e));
    this.shadowRoot.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('[data-action]')) { e.preventDefault(); this._onClick(e); } });
    this._dlg.addEventListener('click', e => { if (e.target === this._dlg) this._dlg.close(); });
  }

  _subscribe() {
    this._unsubscribe();
    const conn = this._hass?.connection, id = this._config?.entity;
    if (!conn || !id || !this.isConnected) return;
    const sub = type => conn.subscribeMessage(ev => { if (this._config?.entity !== id) return; this['_' + type] = ev.forecast || []; this._render(); }, { type: 'weather/subscribe_forecast', forecast_type: type, entity_id: id }).catch(() => null);
    this._subs = [sub('hourly'), sub('daily')];
  }
  _unsubscribe() { (this._subs || []).forEach(p => p.then(u => { try { u && u(); } catch (e) { } })); this._subs = []; }

  // ---------- formatting ----------
  get _lang() { return this._hass?.locale?.language || this._hass?.language || navigator.language; }
  _fmtOpts(o) {
    const l = this._hass?.locale || {}, out = { ...o };
    if (l.time_format === '12') out.hour12 = true; else if (l.time_format === '24') out.hour12 = false;
    if (l.time_zone === 'server' && this._hass?.config?.time_zone) out.timeZone = this._hass.config.time_zone;
    return out;
  }
  _fmt(d, o) { try { return new Intl.DateTimeFormat(this._lang, this._fmtOpts(o)).format(d); } catch (e) { return ''; } }
  _time(d) { return this._fmt(d, { hour: 'numeric', minute: '2-digit' }); }
  _hourLabel(d) { return this._fmt(d, { hour: 'numeric' }).replace(/\s/g, ''); }
  _dayKey(d) { try { return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: this._fmtOpts({}).timeZone }).format(d); } catch (e) { return d.toDateString(); } }
  _clock() {
    const now = new Date();
    let parts = [];
    try { parts = new Intl.DateTimeFormat(this._lang, this._fmtOpts({ hour: 'numeric', minute: '2-digit' })).formatToParts(now); } catch (e) { }
    return {
      hm: parts.filter(p => p.type !== 'dayPeriod').map(p => p.value).join('').trim(),
      ap: parts.find(p => p.type === 'dayPeriod')?.value || '',
      date: this._fmt(now, { weekday: 'long', month: 'long', day: 'numeric' }),
      short: this._fmt(now, { weekday: 'short', month: 'short', day: 'numeric' }),
    };
  }

  _dark() {
    const t = this._config.theme;
    if (t === 'dark' || t === 'light') { this.setAttribute('data-theme', t); return t === 'dark'; }
    this.removeAttribute('data-theme');
    return this._hass?.themes?.darkMode ?? true;
  }
  _layout() {
    const l = this._config?.layout;
    if (l === 'full' || l === 'wide' || l === 'compact' || l === 'condensed') return l;
    return (this._w || this.offsetWidth || 400) >= 720 ? 'wide' : 'full';
  }

  _sunTimes() {
    const s = this._hass.states['sun.sun'];
    if (!s) return null;
    const rise = new Date(s.attributes.next_rising), set = new Date(s.attributes.next_setting);
    if (isNaN(rise) || isNaN(set)) return null;
    return { up: s.state === 'above_horizon', rise, set };
  }
  _isNight(d, sun) {
    if (!sun) return false;
    const mins = x => x.getHours() * 60 + x.getMinutes(), m = mins(d);
    return m < mins(sun.rise) || m >= mins(sun.set);
  }
  _cond(c, night) {
    const e = COND[c] || ['mdi:weather-cloudy', c || '', 'cloud'];
    const loc = this._hass.localize?.(`component.weather.entity_component._.state.${c}`);
    if (night && NIGHT[c]) return { icon: NIGHT[c], tone: 'night', label: loc || e[1] };
    return { icon: e[0], tone: e[2], label: loc || e[1] };
  }

  // ---------- data model ----------
  _alerts() {
    const c = this._config;
    if (!c.show_alerts || !c.alerts_entity) return [];
    const e = this._hass.states[c.alerts_entity];
    if (!e) return [];
    let list = e.attributes.Alerts || e.attributes.alerts || [];
    if (!Array.isArray(list)) list = [];
    return list.map(x => {
      const ev = x.Event || x.event || x.Title || x.title || 'Weather alert';
      const sev = x.Severity || x.severity || '';
      const level = /warning/i.test(ev) ? 3 : /watch/i.test(ev) ? 2 : /extreme|severe/i.test(sev) ? 3 : /moderate/i.test(sev) ? 2 : 1;
      const desc = x.Description || x.description || '';
      const instr = x.Instruction || x.instruction || '';
      const hz = desc.match(/HAZARD\.\.\.([\s\S]*?)(\n\n|SOURCE\.\.\.|IMPACT\.\.\.|$)/i);
      const summary = (hz ? hz[1] : (desc.match(/^[\s\S]*?\.(?=\s|$)/)?.[0] || desc)).replace(/\s+/g, ' ').trim().slice(0, 160);
      const ex = new Date(x.Ends || x.Expires || x.ends || x.expires || '');
      let until = '';
      if (!isNaN(ex)) until = 'Until ' + (this._dayKey(ex) === this._dayKey(new Date()) ? this._time(ex) : this._fmt(ex, { weekday: 'short', hour: 'numeric', minute: '2-digit' }));
      return { event: ev, sev, level, desc, instr, summary, until, headline: x.Headline || x.headline || '', url: x.URL || x.url || '', areas: x.AreasAffected || x.areas || '' };
    }).sort((a, b) => b.level - a.level);
  }
  _storm() {
    const c = this._config, d = c.storm_distance_entity && this._hass.states[c.storm_distance_entity];
    if (!d || num(d.state) == null) return '';
    const b = c.storm_bearing_entity && this._hass.states[c.storm_bearing_entity];
    return `Nearest storm ${r(num(d.state))} ${d.attributes.unit_of_measurement || ''} ${b ? cardinal(b.state) : ''}`.replace(/\s+/g, ' ').trim();
  }
  _nowcast(hours) {
    const c = this._config;
    if (!c.show_nowcast) return null;
    const s = c.nowcast_entity && this._hass.states[c.nowcast_entity];
    if (s && !BAD.includes(s.state)) {
      return /rain|snow|sleet|drizzle|precip|storm|shower|hail/i.test(s.state) ? { title: s.state.replace(/\.$/, ''), sub: '' } : null;
    }
    if (!hours.length) return null;
    const wet = x => (x.precipitation_probability ?? 0) >= 50;
    const word = x => /snow/.test(x.condition || '') ? 'Snow' : 'Rain';
    if (wet(hours[0])) {
      const end = hours.findIndex((x, i) => i > 0 && !wet(x));
      return { title: `${word(hours[0])} likely now`, sub: end > 0 ? `Easing around ${this._hourLabel(new Date(hours[end].datetime))}` : 'Continuing for the next several hours' };
    }
    const i = hours.slice(0, 6).findIndex(wet);
    if (i > 0) { const h = hours[i]; return { title: `${word(h)} likely around ${this._hourLabel(new Date(h.datetime))}`, sub: `${r(h.precipitation_probability)}% chance${h.precipitation ? ` · ${h.precipitation} ${this._unitP || ''}` : ''}` }; }
    return null;
  }
  _stats(a, dark, sun, today, hour) {
    const k = dark ? 2 : 3, sec = 'var(--secondary-text-color)', out = [];
    const ws = a.wind_speed_unit || '';
    const aqiE = this._config.aqi_entity && this._hass.states[this._config.aqi_entity];
    // Pirate Weather has no current UV on the weather entity, only in forecasts
    const uvE = this._config.uv_entity && this._hass.states[this._config.uv_entity];
    const uv = num(uvE?.state) ?? num(a.uv_index) ?? num(hour?.uv_index);
    for (const key of this._config.stats || []) {
      let s = null;
      if (key === 'humidity' && a.humidity != null) s = { icon: 'mdi:water-percent', label: 'Humidity', value: `${r(a.humidity)}%`, sub: a.dew_point != null ? `Dew point ${r(a.dew_point)}°` : '', chip: `${r(a.humidity)}%`, chipColor: 'var(--rain)' };
      if (key === 'aqi' && aqiE && num(aqiE.state) != null) { const v = num(aqiE.state), b = band(AQI, v); s = { icon: 'mdi:leaf', label: 'Air quality', value: `${r(v)}`, sub: b[1], subColor: b[k], chip: `AQI ${r(v)}`, chipColor: b[k] }; }
      if (key === 'wind' && a.wind_speed != null) { const v = `${r(a.wind_speed)} ${ws} ${cardinal(a.wind_bearing)}`.trim(); s = { icon: 'mdi:weather-windy', label: 'Wind', value: v, sub: a.wind_gust_speed != null ? `Gusts ${r(a.wind_gust_speed)} ${ws}` : '', chip: v, chipColor: 'var(--cloud)' }; }
      if (key === 'uv' && uv != null) { const b = band(UV, uv); s = { icon: 'mdi:white-balance-sunny', label: 'UV index', value: `${r(uv)}`, sub: b[1], subColor: b[k], chip: `UV ${r(uv)}`, chipColor: b[k] }; }
      if (key === 'pressure' && a.pressure != null) { const u = a.pressure_unit || '', v = /inhg/i.test(u) ? Number(a.pressure).toFixed(2) : r(a.pressure); s = { icon: 'mdi:gauge', label: 'Pressure', value: `${v} ${u}`, sub: '', chip: `${v} ${u}`, chipColor: 'var(--cloud)' }; }
      if (key === 'sun' && sun) { const first = sun.up ? ['Sunset', sun.set, 'Sunrise', sun.rise] : ['Sunrise', sun.rise, 'Sunset', sun.set]; s = { icon: sun.up ? 'mdi:weather-sunset-down' : 'mdi:weather-sunset-up', label: first[0], value: this._time(first[1]), sub: `${first[2]} ${this._time(first[3])}`, chip: this._time(first[1]), chipColor: '#ff8a65' }; }
      if (key === 'dew_point' && a.dew_point != null) s = { icon: 'mdi:thermometer-water', label: 'Dew point', value: `${r(a.dew_point)}°`, sub: '', chip: `Dew ${r(a.dew_point)}°`, chipColor: 'var(--rain)' };
      if (key === 'visibility' && a.visibility != null) s = { icon: 'mdi:eye-outline', label: 'Visibility', value: `${r(a.visibility)} ${a.visibility_unit || ''}`, sub: '', chip: `${r(a.visibility)} ${a.visibility_unit || ''}`, chipColor: 'var(--cloud)' };
      if (key === 'cloud_coverage' && a.cloud_coverage != null) s = { icon: 'mdi:weather-cloudy', label: 'Cloud cover', value: `${r(a.cloud_coverage)}%`, sub: '', chip: `${r(a.cloud_coverage)}% cloud`, chipColor: 'var(--cloud)' };
      if (key === 'ozone' && a.ozone != null) s = { icon: 'mdi:earth', label: 'Ozone', value: `${r(a.ozone)} DU`, sub: '', chip: `O₃ ${r(a.ozone)}`, chipColor: 'var(--cloud)' };
      if (key === 'precip_today' && today && today.precipitation != null) s = { icon: 'mdi:water', label: 'Precip today', value: `${today.precipitation} ${a.precipitation_unit || ''}`, sub: today.precipitation_probability != null ? `${r(today.precipitation_probability)}% chance` : '', chip: `${today.precipitation} ${a.precipitation_unit || ''}`, chipColor: 'var(--rain)' };
      if (s) out.push({ subColor: sec, ...s });
    }
    return out;
  }
  _model(st) {
    const a = st.attributes, dark = this._dark(), sun = this._sunTimes(), c = this._config;
    this._unitP = a.precipitation_unit;
    const now = Date.now(), todayKey = this._dayKey(new Date());
    const hourlyAll = (this._hourly || []).filter(h => new Date(h.datetime).getTime() >= now - 45 * 60e3);
    const dailySrc = this._daily || a.forecast || [];
    const daily = dailySrc.filter(d => this._dayKey(new Date(d.datetime)) >= todayKey).slice(0, c.daily_count);
    const lows = daily.map(d => d.templow ?? d.temperature), highs = daily.map(d => d.temperature);
    const wMin = Math.min(...lows), wMax = Math.max(...highs), span = wMax - wMin || 1;
    const mkHour = (h, i, first) => { const d = new Date(h.datetime), cd = this._cond(h.condition, this._isNight(d, sun)); const pop = num(h.precipitation_probability) ?? 0; return { t: first && i === 0 ? 'Now' : this._hourLabel(d), ...cd, temp: h.temperature, pop, now: first && i === 0 }; };
    const days = daily.map((d, i) => { const key = this._dayKey(new Date(d.datetime)); const lo = d.templow ?? d.temperature; return { i, key, dn: key === todayKey ? 'Today' : this._fmt(new Date(d.datetime), { weekday: 'short' }), ...this._cond(d.condition, false), hi: d.temperature, lo: d.templow, pop: num(d.precipitation_probability) ?? 0, left: Math.min(96, (lo - wMin) / span * 100).toFixed(1), width: Math.max(4, (d.temperature - lo) / span * 100).toFixed(1), raw: d }; });
    const hoursForDay = i => { const d = days[i]; if (!d) return []; const list = hourlyAll.filter(h => this._dayKey(new Date(h.datetime)) === d.key); return list.map((h, j) => mkHour(h, j, i === 0)); };
    const hours = hourlyAll.slice(0, c.hourly_count).map((h, i) => mkHour(h, i, true));
    const today = daily[0];
    const nightNow = sun ? !sun.up : false;
    const updatedMin = Math.round((now - new Date(st.last_updated).getTime()) / 60e3);
    return {
      dark, clock: this._clock(),
      name: c.name ?? this._hass.config?.location_name ?? '',
      updated: isNaN(updatedMin) ? '' : updatedMin < 1 ? 'just now' : updatedMin < 60 ? `${updatedMin} min ago` : `${Math.round(updatedMin / 60)} h ago`,
      cur: { ...this._cond(st.state, nightNow), temp: a.temperature, unit: a.temperature_unit || '°', feels: a.apparent_temperature, hi: today?.temperature, lo: today?.templow },
      alerts: this._alerts(), storm: this._storm(), nowcast: this._nowcast(hourlyAll),
      stats: c.show_stats ? this._stats(a, dark, sun, today, hourlyAll[0]) : [],
      hours, days, hoursForDay, hasHourlyData: hourlyAll.length > 0,
    };
  }

  // ---------- rendering ----------
  _render() {
    if (!this._config || !this._hass || !this._c) return;
    const st = this._hass.states[this._config.entity];
    if (!st) { this._c.innerHTML = `<div class="warn">Entity not found: ${esc(this._config.entity)}</div>`; return; }
    let m;
    try { m = this._model(st); } catch (e) { this._c.innerHTML = `<div class="warn">${esc(e.message)}</div>`; return; }
    const layout = this._layout();
    const scroll = [...this._c.querySelectorAll('.strip,.chart')].map(e => e.scrollLeft);
    this._c.innerHTML = `<div class="wx ${layout} ${m.dark ? 'dark' : 'light'}">${this['_' + layout](m)}</div>`;
    [...this._c.querySelectorAll('.strip,.chart')].forEach((e, i) => { if (scroll[i]) e.scrollLeft = scroll[i]; });
  }

  _icon(icon, cls = '') { return `<ha-icon class="${cls}" icon="${icon}"></ha-icon>`; }
  _btn(action, extra = '') { return `data-action="${action}" role="button" tabindex="0" ${extra}`; }
  _popTxt(p) { return p >= 10 ? `${r(p)}%` : ''; }
  _tempLine(m) { return `Feels like ${r(m.cur.feels ?? m.cur.temp)}°${m.cur.hi != null ? ` · H ${r(m.cur.hi)}° L ${r(m.cur.lo)}°` : ''}`; }

  _head(m, loc) {
    const c = this._config;
    const clock = c.show_clock ? `<div><div class="time"><span class="hm">${esc(m.clock.hm)}</span><span class="ap">${esc(m.clock.ap)}</span></div><div class="date">${esc(m.clock.date)}</div></div><div class="vr"></div>` : '';
    const hl = m.cur.hi != null ? ` · H ${r(m.cur.hi)}° L ${r(m.cur.lo)}°` : '';
    const where = loc && (m.name || m.updated) ? `<div class="loc">${m.name ? this._icon('mdi:home-outline') + esc(m.name) + (m.updated ? ' · ' : '') : ''}${esc(m.updated)}</div>` : '';
    return `<div class="whead">${clock}<div class="cur tap" ${this._btn('more-info')}>${this._icon(m.cur.icon, 'hero-icon t-' + m.cur.tone)}<div class="temp">${r(m.cur.temp)}°</div><div class="txt"><div class="cond">${esc(m.cur.label)}</div><div class="sub">Feels ${r(m.cur.feels ?? m.cur.temp)}°${hl}</div></div></div>${where}</div>`;
  }

  _alertBlock(m) {
    if (!m.alerts.length) return '';
    const a = m.alerts[0], L = LVL[a.level], more = m.alerts.length - 1;
    const meta = [m.storm && `<span>${this._icon('mdi:weather-lightning', 't-storm')}${esc(m.storm)}</span>`, more > 0 && `<span>${this._icon('mdi:alert-circle-outline')}+${more} more alert${more > 1 ? 's' : ''}</span>`].filter(Boolean).join('');
    const body = a.summary || meta ? `<div class="ab">${a.summary ? `<span>${esc(a.summary)}</span>` : ''}${meta ? `<div class="meta">${meta}</div>` : ''}</div>` : '';
    return `<div class="alert tap" ${this._btn('alert')} style="--lvl:${L.bg}"><div class="ah" style="background:${L.bg};color:${L.fg}">${this._icon('mdi:alert')}<div><b>${esc(a.event)}</b><span>${esc(a.until || a.sev)}</span></div>${this._icon('mdi:chevron-right')}</div>${body}</div>`;
  }
  _alertBar(m) {
    if (!m.alerts.length) return '';
    const a = m.alerts[0], L = LVL[a.level], more = m.alerts.length - 1;
    return `<div class="abar tap" ${this._btn('alert')} style="background:${L.bg};color:${L.fg}">${this._icon('mdi:alert')}<b>${esc(a.event)}${a.until ? ' · ' + esc(a.until.replace('Until', 'until')) : ''}${more > 0 ? ` (+${more})` : ''}</b>${this._icon('mdi:chevron-right')}</div>${m.storm ? `<div class="cnow" style="color:var(--secondary-text-color)">${this._icon('mdi:weather-lightning', 't-storm')}${esc(m.storm)}</div>` : ''}`;
  }
  _banner(m) {
    if (m.alerts.length || !m.nowcast) return '';
    return `<div class="banner">${this._icon('mdi:umbrella-outline')}<div><b>${esc(m.nowcast.title)}</b>${m.nowcast.sub ? `<span>${esc(m.nowcast.sub)}</span>` : ''}</div></div>`;
  }
  _strip(hours, bars) {
    if (!hours.length) return `<div class="note" style="padding:6px 16px">Hourly forecast unavailable</div>`;
    return `<div class="strip">${hours.map(h => `<div class="hr${h.now ? ' now' : ''}"><span class="t">${esc(h.t)}</span>${this._icon(h.icon, 't-' + h.tone)}<span class="tp">${r(h.temp)}°</span>${bars ? `<div class="bar"><i style="height:${h.pop}%"></i></div>` : ''}<span class="pop">${this._popTxt(h.pop)}</span></div>`).join('')}</div>`;
  }
  _dayRows(m, cols6) {
    return m.days.map(d => {
      const open = this._openDay === d.i;
      const row = cols6
        ? `<div class="day tap${open ? ' open' : ''}" ${this._btn('day', `data-i="${d.i}"`)}><span class="dn">${esc(d.dn)}</span><div class="ic">${this._icon(d.icon, 't-' + d.tone)}<span class="pop">${this._popTxt(d.pop)}</span></div><span class="lo">${r(d.lo)}°</span><div class="range"><i style="left:${d.left}%;width:${d.width}%"></i></div><span class="hi">${r(d.hi)}°</span>${this._icon('mdi:chevron-down', 'chev')}</div>`
        : `<div class="day tap" ${this._btn('day', `data-i="${d.i}"`)}><span class="dn">${esc(d.dn)}</span>${this._icon(d.icon, 't-' + d.tone)}<span class="pop">${this._popTxt(d.pop)}</span><span class="lo">${r(d.lo)}°</span><div class="range"><i style="left:${d.left}%;width:${d.width}%"></i></div><span class="hi">${r(d.hi)}°</span></div>`;
      if (!cols6 || !open) return row;
      const hrs = m.hoursForDay(d.i);
      return row + `<div class="dayx">${hrs.length ? this._strip(hrs, false) : `<div class="note">Hourly detail covers the next 48 hours.</div>`}</div>`;
    }).join('');
  }
  _clearChip(m) {
    const d = m.days[this._dayFilter];
    return d ? `<span class="clear tap" ${this._btn('clear-day')}>${esc(d.dn)} ${this._icon('mdi:close')}</span>` : '';
  }
  _filteredHours(m) {
    if (this._dayFilter == null || !m.days[this._dayFilter]) return { hours: m.hours, note: '' };
    const hrs = m.hoursForDay(this._dayFilter);
    return { hours: hrs, note: hrs.length ? '' : 'Hourly detail covers the next 48 hours.' };
  }

  _full(m) {
    const c = this._config;
    return `
      <div class="top">
        ${c.show_clock ? `<div><div class="time"><span class="hm">${esc(m.clock.hm)}</span><span class="ap">${esc(m.clock.ap)}</span></div><div class="date">${esc(m.clock.date)}</div></div>` : '<div></div>'}
        <div class="loc">${m.name ? this._icon('mdi:home-outline') + esc(m.name) + (m.updated ? ' · ' : '') : ''}${esc(m.updated)}</div>
      </div>
      <div class="hero tap" ${this._btn('more-info')}>
        ${this._icon(m.cur.icon, 'hero-icon t-' + m.cur.tone)}
        <div><div class="temp">${r(m.cur.temp)}<small>${esc(m.cur.unit)}</small></div><div class="cond">${esc(m.cur.label)}</div><div class="sub">${this._tempLine(m)}</div></div>
      </div>
      ${this._alertBlock(m)}${this._banner(m)}
      ${m.stats.length ? `<div class="stats">${m.stats.map(s => `<div class="stat"><div class="lb">${this._icon(s.icon)}${esc(s.label)}</div><span class="v">${esc(s.value)}</span><span class="s" style="color:${s.subColor}">${esc(s.sub)}</span></div>`).join('')}</div>` : ''}
      ${c.show_hourly ? `<div class="h"><span>Hourly</span></div>${this._strip(m.hours, true)}` : ''}
      ${c.show_daily && m.days.length ? `<div class="divider"></div><div class="days">${this._dayRows(m, true)}</div>` : '<div style="height:14px"></div>'}`;
  }

  _wide(m) {
    const c = this._config, fh = this._filteredHours(m), hs = fh.hours;
    const temps = hs.map(h => h.temp), tMax = Math.max(...temps), tMin = Math.min(...temps), rng = tMax - tMin || 1;
    const wet = hs.some(h => h.pop >= 10);
    const chart = hs.length ? `<div class="chart">${hs.map(h => `<div class="col"><span class="t">${esc(h.t)}</span>${this._icon(h.icon, 't-' + h.tone)}<div class="curve"><div style="top:${((tMax - h.temp) / rng * 26).toFixed(1)}px"><span>${r(h.temp)}°</span><span class="dot"></span></div></div>${wet ? `<div class="pb"><i style="height:${h.pop}%"></i></div><span class="pop">${this._popTxt(h.pop)}</span>` : ''}</div>`).join('')}</div>` : `<div class="note">${fh.note || 'Hourly forecast unavailable'}</div>`;
    return `
      ${this._head(m, true)}
      <div class="left">
        ${m.stats.length ? `<div class="rows">${m.stats.map(s => `<div class="row">${this._icon(s.icon)}<span class="l">${esc(s.label)}</span><span class="v">${esc(s.value)}</span><span class="s" style="color:${s.subColor}">${esc(s.sub)}</span></div>`).join('')}</div>` : ''}
      </div>
      <div class="right">
        ${this._alertBlock(m)}${this._banner(m)}
        ${c.show_hourly ? `<div><div class="h"><span>Hourly</span>${this._clearChip(m)}</div>${chart}</div>` : ''}
        ${c.show_daily && m.days.length ? `<div><div class="h"><span>Daily</span></div><div class="dgrid">${m.days.map(d => `<div class="dt tap${this._dayFilter === d.i ? ' sel' : ''}" ${this._btn('day', `data-i="${d.i}"`)}><span class="dn">${esc(d.dn)}</span>${this._icon(d.icon, 't-' + d.tone)}<span class="hi">${r(d.hi)}°</span><span class="lo">${r(d.lo)}°</span><span class="pop">${this._popTxt(d.pop)}</span></div>`).join('')}</div></div>` : ''}
      </div>`;
  }

  _compact(m) {
    const c = this._config, both = c.show_hourly && c.show_daily;
    const tab = !both ? (c.show_hourly ? 'hourly' : 'daily') : (this._tab || 'hourly');
    const fh = this._filteredHours(m);
    const hourly = `${this._dayFilter != null ? `<div class="h"><span>Hourly</span>${this._clearChip(m)}</div>` : ''}${fh.note ? `<div class="note">${fh.note}</div>` : this._strip(fh.hours, false)}`;
    return `
      <div class="chead tap" ${this._btn('more-info')}>
        <div class="bubble t-${m.cur.tone}">${this._icon(m.cur.icon)}</div>
        <div class="grow"><div class="ct">${r(m.cur.temp)}° ${esc(m.cur.label)}</div><div class="sub">Feels ${r(m.cur.feels ?? m.cur.temp)}°${m.cur.hi != null ? ` · ${r(m.cur.hi)}° / ${r(m.cur.lo)}°` : ''}</div></div>
        ${c.show_clock ? `<div class="cclock"><div class="time"><span class="hm">${esc(m.clock.hm)}</span><span class="ap">${esc(m.clock.ap)}</span></div><div class="date">${esc(m.clock.short)}</div></div>` : ''}
      </div>
      ${m.stats.length ? `<div class="chips">${m.stats.map(s => `<div class="chip">${this._icon(s.icon).replace('<ha-icon', `<ha-icon style="color:${s.chipColor}"`)}${esc(s.chip)}</div>`).join('')}</div>` : ''}
      ${this._alertBar(m)}
      ${!m.alerts.length && m.nowcast ? `<div class="cnow">${this._icon('mdi:umbrella-outline')}${esc(m.nowcast.title)}${m.nowcast.sub ? ' · ' + esc(m.nowcast.sub) : ''}</div>` : ''}
      ${both ? `<div class="tabs"><div class="tab tap${tab === 'hourly' ? ' on' : ''}" ${this._btn('tab', 'data-tab="hourly"')}>Hourly</div><div class="tab tap${tab === 'daily' ? ' on' : ''}" ${this._btn('tab', 'data-tab="daily"')}>Daily</div></div>` : ''}
      ${tab === 'hourly' && c.show_hourly ? hourly : ''}
      ${tab === 'daily' && c.show_daily ? `<div class="days">${this._dayRows(m, false)}</div>` : ''}`;
  }

  _condensed(m) {
    const c = this._config, fh = this._filteredHours(m);
    const hourly = c.show_hourly ? `${this._dayFilter != null ? `<div class="h"><span>Hourly</span>${this._clearChip(m)}</div>` : ''}${fh.note ? `<div class="note">${fh.note}</div>` : this._strip(fh.hours, false)}` : '';
    const daily = c.show_daily && m.days.length ? `<div class="drow">${m.days.map(d => `<div class="dt tap${this._dayFilter === d.i ? ' sel' : ''}" ${this._btn('day', `data-i="${d.i}"`)}><span class="dn">${esc(d.dn)}</span>${this._icon(d.icon, 't-' + d.tone)}<span class="hl"><b>${r(d.hi)}°</b> <span>${r(d.lo)}°</span></span><span class="pop">${this._popTxt(d.pop)}</span></div>`).join('')}</div>` : '';
    return `
      ${this._head(m, false)}
      ${m.stats.length ? `<div class="chips">${m.stats.map(s => `<div class="chip">${this._icon(s.icon).replace('<ha-icon', `<ha-icon style="color:${s.chipColor}"`)}${esc(s.chip)}</div>`).join('')}</div>` : ''}
      ${this._alertBar(m)}
      ${!m.alerts.length && m.nowcast ? `<div class="cnow">${this._icon('mdi:umbrella-outline')}${esc(m.nowcast.title)}${m.nowcast.sub ? ' · ' + esc(m.nowcast.sub) : ''}</div>` : ''}
      ${hourly}${daily}`;
  }

  // ---------- interaction ----------
  _onClick(e) {
    const t = e.target.closest?.('[data-action]');
    if (!t) return;
    const act = t.dataset.action, layout = this._layout();
    if (act === 'more-info') this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: this._config.entity }, bubbles: true, composed: true }));
    else if (act === 'alert') this._openAlerts();
    else if (act === 'close') this._dlg.close();
    else if (act === 'tab') { this._tab = t.dataset.tab; if (this._tab === 'hourly') this._dayFilter = null; this._render(); }
    else if (act === 'clear-day') { this._dayFilter = null; this._render(); }
    else if (act === 'day') {
      const i = +t.dataset.i;
      if (layout === 'full') this._openDay = this._openDay === i ? null : i;
      else { this._dayFilter = this._dayFilter === i ? null : i; if (layout === 'compact') this._tab = 'hourly'; }
      this._render();
    }
  }
  _openAlerts() {
    const list = this._alerts();
    if (!list.length) return;
    this._dlg.innerHTML = `<div class="dh"><span>Weather alerts</span><button class="x" data-action="close" aria-label="Close">${this._icon('mdi:close')}</button></div>
      <div class="dbody">${list.map(a => { const L = LVL[a.level]; return `<div class="ai"><div class="ah" style="background:${L.bg};color:${L.fg}">${this._icon('mdi:alert')}<div><b>${esc(a.event)}</b><span>${esc([a.until, a.sev].filter(Boolean).join(' · '))}</span></div></div>
        ${a.areas ? `<h4>Areas</h4><p>${esc(a.areas)}</p>` : ''}${a.desc ? `<h4>Details</h4><p>${esc(a.desc.trim())}</p>` : ''}${a.instr ? `<h4>What to do</h4><p>${esc(a.instr.trim())}</p>` : ''}${/^https?:\/\//i.test(a.url) ? `<a href="${esc(a.url)}" target="_blank" rel="noopener">Open full alert</a>` : ''}</div>`; }).join('')}</div>`;
    if (!this._dlg.open) this._dlg.showModal();
  }
}

// ---------- visual editor ----------
const STAT_OPTIONS = [
  { value: 'humidity', label: 'Humidity + dew point' }, { value: 'aqi', label: 'Air quality' }, { value: 'wind', label: 'Wind + gusts' },
  { value: 'uv', label: 'UV index' }, { value: 'pressure', label: 'Pressure' }, { value: 'sun', label: 'Sunrise / sunset' },
  { value: 'precip_today', label: 'Precipitation today' }, { value: 'dew_point', label: 'Dew point' }, { value: 'visibility', label: 'Visibility' },
  { value: 'cloud_coverage', label: 'Cloud cover' }, { value: 'ozone', label: 'Ozone' },
];
const SCHEMA = [
  { name: 'entity', required: true, selector: { entity: { domain: 'weather' } } },
  { type: 'grid', name: '', schema: [
    { name: 'layout', selector: { select: { mode: 'dropdown', options: [{ value: 'auto', label: 'Auto (fit to width)' }, { value: 'full', label: 'Full stack' }, { value: 'wide', label: 'Wide panel' }, { value: 'condensed', label: 'Condensed (wide, short)' }, { value: 'compact', label: 'Compact' }] } } },
    { name: 'theme', selector: { select: { mode: 'dropdown', options: [{ value: 'auto', label: 'Follow HA theme' }, { value: 'dark', label: 'Always dark' }, { value: 'light', label: 'Always light' }] } } },
  ] },
  { name: 'name', selector: { text: {} } },
  { type: 'expandable', name: '', flatten: true, title: 'Data sources', icon: 'mdi:database-outline', schema: [
    { name: 'aqi_entity', selector: { entity: { domain: 'sensor' } } },
    { name: 'alerts_entity', selector: { entity: { domain: 'sensor' } } },
    { name: 'nowcast_entity', selector: { entity: { domain: 'sensor' } } },
    { name: 'uv_entity', selector: { entity: { domain: 'sensor' } } },
    { type: 'grid', name: '', schema: [
      { name: 'storm_distance_entity', selector: { entity: { domain: 'sensor' } } },
      { name: 'storm_bearing_entity', selector: { entity: { domain: 'sensor' } } },
    ] },
  ] },
  { type: 'expandable', name: '', flatten: true, title: 'Sections', icon: 'mdi:view-agenda-outline', schema: [
    { type: 'grid', name: '', schema: [
      { name: 'show_clock', selector: { boolean: {} } }, { name: 'show_alerts', selector: { boolean: {} } },
      { name: 'show_nowcast', selector: { boolean: {} } }, { name: 'show_stats', selector: { boolean: {} } },
      { name: 'show_hourly', selector: { boolean: {} } }, { name: 'show_daily', selector: { boolean: {} } },
    ] },
    { name: 'hourly_count', selector: { number: { min: 4, max: 48, step: 1, mode: 'slider' } } },
    { name: 'daily_count', selector: { number: { min: 3, max: 8, step: 1, mode: 'slider' } } },
  ] },
  { type: 'expandable', name: '', flatten: true, title: 'Stats', icon: 'mdi:view-grid-outline', schema: [
    { name: 'stats', selector: { select: { multiple: true, mode: 'list', reorder: true, options: STAT_OPTIONS } } },
  ] },
];
const LABELS = {
  entity: 'Weather entity', layout: 'Layout', theme: 'Theme', name: 'Location label',
  aqi_entity: 'Air quality sensor', alerts_entity: 'NWS Alerts sensor', nowcast_entity: 'Minutely summary sensor (Pirate Weather)', uv_entity: 'UV index sensor',
  storm_distance_entity: 'Nearest storm distance', storm_bearing_entity: 'Nearest storm bearing',
  show_clock: 'Clock', show_alerts: 'Alerts', show_nowcast: 'Rain nowcast', show_stats: 'Stat tiles', show_hourly: 'Hourly', show_daily: 'Daily',
  hourly_count: 'Hours to show', daily_count: 'Days to show', stats: 'Stats to show (in order)',
};
const HELPERS = {
  name: 'Leave empty to use your Home Assistant location name',
  nowcast_entity: 'Optional. Enable "minutely summary" in Pirate Weather options; otherwise the card estimates from the hourly forecast',
  layout: 'Auto uses Wide when the card is at least 720px wide. Condensed fits short spaces',
  uv_entity: 'Optional. Pirate Weather has no current UV on the weather entity, so without this the card uses the current hour of the forecast',
};

class WeatherGlanceCardEditor extends HTMLElement {
  setConfig(config) { this._config = config; this._update(); }
  set hass(h) { this._hass = h; this._update(); }
  async _ensureForm() {
    if (customElements.get('ha-form')) return;
    try { const helpers = await window.loadCardHelpers?.(); const card = await helpers?.createCardElement({ type: 'entities', entities: [] }); await card?.constructor?.getConfigElement?.(); } catch (e) { }
  }
  async _update() {
    if (!this._hass || !this._config) return;
    await this._ensureForm();
    if (!this._form) {
      this._form = document.createElement('ha-form');
      this._form.computeLabel = s => LABELS[s.name] ?? s.name;
      this._form.computeHelper = s => HELPERS[s.name];
      this._form.addEventListener('value-changed', e => {
        const v = { ...e.detail.value };
        for (const k of Object.keys(DEFAULTS)) if (JSON.stringify(v[k]) === JSON.stringify(DEFAULTS[k])) delete v[k];
        for (const k of Object.keys(v)) if (v[k] === '' || v[k] == null) delete v[k];
        this._config = v;
        this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: v }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    this._form.schema = SCHEMA;
    this._form.data = { ...DEFAULTS, ...this._config };
  }
}

if (!customElements.get('weather-glance-card')) customElements.define('weather-glance-card', WeatherGlanceCard);
if (!customElements.get('weather-glance-card-editor')) customElements.define('weather-glance-card-editor', WeatherGlanceCardEditor);
window.customCards = window.customCards || [];
if (!window.customCards.some(c => c.type === 'weather-glance-card')) window.customCards.push({ type: 'weather-glance-card', name: 'Weather Glance Card', description: 'Clock, conditions, air quality, alerts, hourly and daily forecast at a glance.', preview: true, documentationURL: 'https://github.com/The-Croz/weather-glance-card' });
console.info(`%c WEATHER-GLANCE-CARD %c v${WGC_VERSION} `, 'background:#03a9f4;color:#fff;font-weight:700', 'background:#1c1c1c;color:#fff');
