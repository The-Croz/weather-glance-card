# Weather Glance Card

[![HACS Custom](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://hacs.xyz/docs/faq/custom_repositories)
[![GitHub Release](https://img.shields.io/github/v/release/The-Croz/weather-glance-card)](https://github.com/The-Croz/weather-glance-card/releases)
[![Validate](https://github.com/The-Croz/weather-glance-card/actions/workflows/validate.yml/badge.svg)](https://github.com/The-Croz/weather-glance-card/actions/workflows/validate.yml)

A native-looking Home Assistant weather card: clock, current conditions, air quality, severe weather alerts, rain nowcast, hourly and daily forecast — all at a glance.

Built for [Pirate Weather](https://github.com/Pirate-Weather/pirate-weather-ha), but works with any `weather` entity that supports hourly and daily forecasts.

![Weather Glance Card — Wide layout, dark theme, with a severe weather alert](https://raw.githubusercontent.com/The-Croz/weather-glance-card/main/images/layout-wide-dark.png)

## Features

- **Four layouts** — **Full stack**, **Wide panel**, **Condensed** (wide but short — great for tablet dashboards), **Compact** — or **Auto**, which switches to Wide when the card is at least 720px wide
- **Follows your HA theme** (light/dark), or force either one
- **Severe weather alerts** from NWS Alerts, color-coded by level, with full alert text in a popup
- **Rain nowcast** — "Rain likely around 3PM" — from Pirate Weather's minutely summary, or estimated from the hourly forecast
- **Stat tiles** — humidity, air quality (US EPA color bands), wind, UV, pressure, sunrise/sunset and more; pick and reorder them
- **Tap a day** to see that day's hourly forecast
- Localized times, dates and condition names; respects your 12/24-hour and time zone settings
- Full visual editor — no YAML required

## Layouts

<table>
  <tr>
    <th width="50%">Full stack</th>
    <th width="50%">Compact</th>
  </tr>
  <tr>
    <td valign="top"><img src="https://raw.githubusercontent.com/The-Croz/weather-glance-card/main/images/layout-full-light.png" alt="Full stack layout, light theme, with rain nowcast"></td>
    <td valign="top"><img src="https://raw.githubusercontent.com/The-Croz/weather-glance-card/main/images/layout-compact-dark.png" alt="Compact layout, dark theme, with a severe weather alert"></td>
  </tr>
</table>

**Wide panel** — shown at the top of this page. Stat rows on the left; hourly temperature/precipitation chart and daily tiles on the right.

**Condensed** — wide but short: the header, stat chips, an hourly strip and a row of daily tiles. Built for tablet dashboards.

![Condensed layout, light theme, with rain nowcast](https://raw.githubusercontent.com/The-Croz/weather-glance-card/main/images/layout-condensed-light.png)

<sub>Screenshots use sample data.</sub>

## Requirements

- Home Assistant **2025.4** or newer
- A `weather` entity with hourly and/or daily forecasts

## Installation

### HACS (recommended)

[![Open your Home Assistant instance and open this repository in HACS.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=The-Croz&repository=weather-glance-card&category=plugin)

Or manually in HACS:

1. HACS → ⋮ (top right) → **Custom repositories**
2. Repository: `https://github.com/The-Croz/weather-glance-card`, type: **Dashboard**
3. Search for **Weather Glance Card** → **Download**
4. Refresh your browser (hard refresh / clear cache if the card doesn't appear)

### Manual

1. Download `weather-glance-card.js` from this repository (or the latest [release](https://github.com/The-Croz/weather-glance-card/releases)).
2. Copy it to `/config/www/weather-glance-card.js`.
3. Settings → Dashboards → ⋮ → **Resources** → **Add resource**
   - URL: `/local/weather-glance-card.js`
   - Type: **JavaScript module**
4. Refresh your browser.

## Adding the card

Edit dashboard → **Add card** → search **Weather Glance Card**. Everything can be configured in the visual editor. The card auto-detects your weather entity, an AQI sensor, NWS Alerts and the Pirate Weather minutely summary when it's first added.

### YAML example

```yaml
# Entity IDs are examples — use the ones from your own setup
type: custom:weather-glance-card
entity: weather.pirateweather
layout: auto
aqi_entity: sensor.waqi_aqi
alerts_entity: sensor.nws_alerts
nowcast_entity: sensor.pirateweather_minutely_summary
uv_entity: sensor.pirateweather_uv_index
stats:
  - humidity
  - aqi
  - wind
  - uv
  - pressure
  - sun
```

## Data sources

All sources except the weather entity are optional; sections without data simply don't appear.

| Setting | Source |
|---|---|
| Weather entity | [Pirate Weather](https://github.com/Pirate-Weather/pirate-weather-ha) or any weather integration with forecasts |
| Air quality sensor | Any AQI sensor (e.g. [WAQI](https://www.home-assistant.io/integrations/waqi/)) — shown with US EPA color bands |
| NWS Alerts sensor | The **[NWS Alerts](https://github.com/finity69x2/nws_alerts) custom integration** (install via HACS), e.g. `sensor.nws_alerts` — US only. The built-in [National Weather Service](https://www.home-assistant.io/integrations/nws) integration does **not** provide alerts |
| UV index sensor | Pirate Weather → Configure → enable the UV Index sensor. Pirate Weather's weather entity has no current UV, so without this sensor the card uses the current hour of the forecast |
| Minutely summary | Pirate Weather → Configure → enable the minutely summary sensor. Without it, the nowcast is estimated from the hourly forecast |
| Nearest storm distance / bearing | Pirate Weather sensors — shown alongside active alerts |

## Configuration options

| Option | Type | Default | Description |
|---|---|---|---|
| `entity` | string | **required** | Weather entity |
| `name` | string | HA location name | Location label shown next to the clock |
| `layout` | string | `auto` | `auto`, `full`, `wide`, `condensed` or `compact` |
| `theme` | string | `auto` | `auto` (follow HA), `dark` or `light` |
| `aqi_entity` | string | — | Air quality sensor |
| `alerts_entity` | string | — | NWS Alerts sensor |
| `nowcast_entity` | string | — | Pirate Weather minutely summary sensor |
| `uv_entity` | string | — | UV index sensor (falls back to the weather entity, then the hourly forecast) |
| `storm_distance_entity` | string | — | Nearest storm distance sensor |
| `storm_bearing_entity` | string | — | Nearest storm bearing sensor |
| `show_clock` | boolean | `true` | Show the clock and date |
| `show_alerts` | boolean | `true` | Show weather alerts |
| `show_nowcast` | boolean | `true` | Show the rain nowcast banner |
| `show_stats` | boolean | `true` | Show the stat tiles |
| `show_hourly` | boolean | `true` | Show the hourly forecast |
| `show_daily` | boolean | `true` | Show the daily forecast |
| `hourly_count` | number | `12` | Hours to show (4–48) |
| `daily_count` | number | `7` | Days to show (3–8) |
| `stats` | list | `humidity, aqi, wind, uv, pressure, sun` | Stat tiles, in order. Also available: `precip_today`, `dew_point`, `visibility`, `cloud_coverage`, `ozone` |

## Interactions

- **Tap current conditions** → more-info dialog for the weather entity
- **Tap an alert** → full alert text (areas, details, what to do, link to the full alert)
- **Tap a day** → that day's hourly forecast (hourly data typically covers ~48 hours)
- **Compact layout** → switch between Hourly and Daily with the tabs
- **Wide / Condensed** → tapping a day filters the hourly forecast to that day; tap ✕ to clear

## Troubleshooting

- **"Custom element doesn't exist: weather-glance-card"** — the resource isn't loaded. Check it's listed under Settings → Dashboards → Resources, then hard-refresh the browser. On the mobile app, reset the frontend cache from the Companion app's debugging/troubleshooting settings.
- **"Hourly forecast unavailable"** — your weather entity doesn't provide an hourly forecast. Check its forecast support, or hide the section with `show_hourly: false`.
- **UV index missing** — pick a UV sensor under Data sources, or make sure your weather entity provides an hourly forecast.
- **No alerts sensor to choose** — install the [NWS Alerts](https://github.com/finity69x2/nws_alerts) custom integration; the built-in NWS integration has no alerts.
- **Check the installed version** — open the browser console; the card logs `WEATHER-GLANCE-CARD vX.Y.Z` on load.

## License

[MIT](LICENSE)
