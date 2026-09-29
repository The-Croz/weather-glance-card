# Weather Glance Card

A native-looking Home Assistant weather card: clock, current conditions, air quality, severe alerts, rain nowcast, hourly and daily forecast. Built for Pirate Weather; works with any weather entity that supports hourly/daily forecasts.

Three layouts — **Full stack**, **Wide panel**, **Compact** — or **Auto** (switches to Wide at ≥720px). Follows your HA theme (light/dark) or can be forced.

## Install

**HACS (custom repository)**
1. Push this folder to a GitHub repo.
2. HACS → ⋮ → Custom repositories → add the repo URL, type **Dashboard**.
3. Download **Weather Glance Card**, then refresh the browser.

**Manual**
1. Copy `weather-glance-card.js` to `/config/www/`.
2. Settings → Dashboards → ⋮ → Resources → Add resource: `/local/weather-glance-card.js`, type **JavaScript module**.
3. Refresh the browser.

## Add the card
Edit dashboard → Add card → search **Weather Glance Card**. Everything is configured in the visual editor.

## Data sources
| Setting | Source |
|---|---|
| Weather entity | Pirate Weather (`weather.home`) |
| Air quality sensor | Any AQI sensor (e.g. WAQI) — US EPA color bands |
| NWS Alerts sensor | [NWS Alerts](https://github.com/finity69x2/nws_alerts) integration (`sensor.nws_alerts`) |
| Minutely summary | Pirate Weather → Configure → enable minutely summary sensor (optional) |
| Nearest storm distance / bearing | Pirate Weather sensors (optional, shown with alerts) |

## Interactions
- Tap current conditions → more-info
- Tap an alert → full alert text (details, instructions, link)
- Tap a day → that day's hourly forecast (hourly data covers ~48 h)

## Options
| Option | Default |
|---|---|
| `layout` | `auto` · `full` · `wide` · `compact` |
| `theme` | `auto` · `dark` · `light` |
| `show_clock` / `show_alerts` / `show_nowcast` / `show_stats` / `show_hourly` / `show_daily` | `true` |
| `hourly_count` | `12` |
| `daily_count` | `7` |
| `stats` | `humidity, aqi, wind, uv, pressure, sun` (also `precip_today`, `dew_point`, `visibility`, `cloud_coverage`, `ozone`) |
