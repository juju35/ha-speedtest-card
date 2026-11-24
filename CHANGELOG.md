# Changelog

## 1.3.3 - 2026-11-24

### Maintenance
- The card source is split into ES modules: `src/` (entry `src/index.js`), cut at its sections, with the translations in one file per language (`i18n/<lang>.js`). `scripts/bundle.mjs` concatenates them back, in their original order, into the same single file and per-language files as before; the tests evaluate that bundle.

## 1.3.2 - 2026-11-22

### Performance
- Card picker: the previews are back (`preview: true`), and light. Each card's preview is drawn only once it scrolls into view of Home Assistant's card picker, which otherwise builds the preview of every card at once: until then it holds Home Assistant's state (no render, no history request, no animation). On a dashboard or in the card editor the card is drawn as before.

## 1.3.1 - 2026-11-22

### Performance
- Card picker: the cards no longer ask Home Assistant for a live preview (`preview: false` in `window.customCards`). The picker drew every card at once (history requests, animations), which made the list slow to open; it now shows each card's description instead.

## 1.3.0 - 2026-11-20

### Features
- Visual editor: the jitter sensor and the device of the speed test (when you have several), translated in every language.

### Fixes
- The history is converted to Mbit/s with the sensor's unit, as the current value: a sensor in kbit/s, MB/s or MiB/s no longer skews the chart, the average, the slowest test and the median that *Slow* is measured against.
- `upload`, `ping` and `jitter` set in the configuration are used without a `download` sensor too (they were ignored).
- `plan_upload` is used: the upload line turns amber under `alert_ratio` of it.
- The mini card's description in the card picker no longer mentions a sparkline it does not have.
- A card that leaves the page clears its pending timers (the end of a speed test it started, the pill measurement); back on the page, the end of a test still running is drawn on time.

### Performance
- The states are counted once per update instead of twice (the card's and the model's lookups).

### Maintenance
- CI: the validation job caches the npm downloads.

## 1.2.1 - 2026-11-18

### Fixes
- Illustrated header: `auto` now follows the Home Assistant theme alone — a light theme keeps the day picture after sunset, a dark theme still shows the night one.

## 1.2.0 - 2026-11-17

### Features
- Illustrated header, 90 px on the full and the mini card: the title, subtitle and status chip on the sky, the card's gauge standing on a lawn strip with a fibre line on poles running to a house. Light pulses run along the line: fast while a test runs, sparse and amber when the line is slow, none without a result. The round Wi-Fi icon takes the colour of the status (accent, blue while testing, amber when slow, red without a result).
- The status pill is in the icon's colour (frosted on the sky), on the title row right after the title only when the whole title and its whole label fit there (measured, in every language); otherwise on its own line under the subtitle (then kept to one line), and only its dot when even that does not fit in the banner above the lawn or beside the scene, or on a card 200 px wide or less. The same rule on the classic header. The mini card's expand / collapse button sits in the banner's top right corner (24 px, frosted), like the other cards; the scene leaves the title a little more room.
- Night picture (moon, stars, lit window) when `sun.sun` is below the horizon or with the dark theme; `illustration_theme: day | night` forces one, `illustration: false` brings back the classic header. Both options are in the visual editors, translated in every language.
- Night picture with the dark theme even while the sun is up (a day picture would glare on a dark dashboard); `illustration_theme: day | night` still forces one.

## 1.1.0 - 2026-11-16

### Features
- New look, as the other cards: the gauge drawn as an illustration next to the download speed in large and colored lines (upload, ping, share of the plan); average, slowest and server as tiles, the slowest tinted when it is slow; the history's download filled; a *Run a test* button with the time of the last test. The mini card gets a small gauge.
- Netgear routers: their speed test (downlink and uplink bandwidth, average ping) is found on its own, and run again from the card.

### Fixes
- Speeds in KiB/s, MiB/s or GiB/s (Home Assistant's binary data-rate units) are converted to Mbit/s.
- Ookla Speedtest: *Run a test* runs the test of the card's download sensor only.
- A router's restart or firmware button is no longer taken for the speed test button.
- Netgear: the router is found even when a device of a client it tracks comes first.
- The share of the plan is coloured by the download speed alone: a high ping no longer turns it orange.

## 1.0.0 - 2026-11-16

First release.

### Features
- **Speedtest Card** (`custom:speedtest-card`): download gauge against your plan, upload, ping, jitter and packet loss, a history of the last days from the recorder with the plan's line and the slowest test, average, slowest and server, and a button that runs a test.
- **Speedtest Mini Card** (`custom:speedtest-mini-card`): compact view with the download in large, upload and ping, the week's sparkline and a run button; the detail button switches to the full card.
- Speedtest.net, Fast.com, iperf3, Ookla Speedtest and Speedtest Tracker found through the entity and device registries, each test run its own way; any sensors in the configuration.
- Status chip: normal, slow (under a share of the plan or the median), high latency, testing.
- Animation while a test runs (a dot sweeping the gauge).
- Visual editor for both cards; light and dark themes; 22 languages, English in the bundle and every other language in its own file loaded on demand.
