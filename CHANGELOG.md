# Changelog

## 1.1.0 - 2026-11-16

### Features
- New look, as the other cards: the gauge drawn as an illustration next to the download speed in large and colored lines (upload, ping, share of the plan); average, slowest and server as tiles, the slowest tinted when it is slow; the history's download filled; a *Run a test* button with the time of the last test. The mini card gets a small gauge.
- Netgear routers: their speed test (downlink and uplink bandwidth, average ping) is found on its own, and run again from the card.

### Fixes
- Speeds in KiB/s, MiB/s or GiB/s (Home Assistant's binary data-rate units) are converted to Mbit/s.
- Ookla Speedtest: *Run a test* runs the test of the card's download sensor only.
- A router's restart or firmware button is no longer taken for the speed test button.

## 1.0.0 - 2026-11-16

First release.

### Features
- **Speedtest Card** (`custom:speedtest-card`): download gauge against your plan, upload, ping, jitter and packet loss, a history of the last days from the recorder with the plan's line and the slowest test, average, slowest and server, and a button that runs a test.
- **Speedtest Mini Card** (`custom:speedtest-mini-card`): compact view with the download in large, upload and ping, the week's sparkline and a run button; the detail button switches to the full card.
- Speedtest.net, Fast.com, iperf3, Ookla Speedtest and Speedtest Tracker found through the entity and device registries, each test run its own way; any sensors in the configuration.
- Status chip: normal, slow (under a share of the plan or the median), high latency, testing.
- Animation while a test runs (a dot sweeping the gauge).
- Visual editor for both cards; light and dark themes; 22 languages, English in the bundle and every other language in its own file loaded on demand.
