# Changelog

## 1.0.0 - 2026-11-16

First release.

### Features
- **Speedtest Card** (`custom:speedtest-card`): download gauge against your plan, upload, ping, jitter and packet loss, a history of the last days from the recorder with the plan's line and the slowest test, average, slowest and server, and a button that runs a test.
- **Speedtest Mini Card** (`custom:speedtest-mini-card`): compact view with the download in large, upload and ping, the week's sparkline and a run button; the detail button switches to the full card.
- Speedtest.net, Fast.com, iperf3, Ookla Speedtest and Speedtest Tracker found through the entity and device registries, each test run its own way; any sensors in the configuration.
- Status chip: normal, slow (under a share of the plan or the median), high latency, testing.
- Animation while a test runs (a dot sweeping the gauge).
- Visual editor for both cards; light and dark themes; 22 languages, English in the bundle and every other language in its own file loaded on demand.
