/*
 * Speedtest Card for Home Assistant
 * https://github.com/juju35/ha-speedtest-card
 *
 * Lovelace cards for internet speed tests: a gauge of the download speed against your plan, the upload speed, the
 * ping and the jitter, a 7-day history from the recorder with your plan's line, the slowest test, and a button that
 * runs a test. The sensors come from Speedtest.net, Fast.com, iperf3, Ookla Speedtest, Speedtest Tracker or a Netgear router, found
 * through the entity and device registries; any download / upload / ping sensors can also be set in the
 * configuration.
 */

export const VERSION = "__VERSION__";

export const CARD_ICONS = {
  gauge:
    "M12,16A3,3 0 0,1 9,13C9,11.88 9.61,10.9 10.5,10.39L20.21,4.77L14.68,14.35C14.18,15.33 13.17,16 12,16M12,3C13.81,3 15.5,3.5 16.97,4.32L14.87,5.53C14,5.19 13,5 12,5A8,8 0 0,0 4,13C4,15.21 4.89,17.21 6.34,18.65H6.35C6.74,19.04 6.74,19.67 6.35,20.06C5.96,20.45 5.32,20.45 4.93,20.07V20.07C3.12,18.26 2,15.76 2,13A10,10 0 0,1 12,3M22,13C22,15.76 20.88,18.26 19.07,20.07V20.07C18.68,20.45 18.05,20.45 17.66,20.06C17.27,19.67 17.27,19.04 17.66,18.65V18.65C19.11,17.2 20,15.21 20,13C20,12 19.81,11 19.46,10.1L20.67,8C21.5,9.5 22,11.18 22,13Z",
  wifi: "M12,21L15.6,16.2C14.6,15.45 13.35,15 12,15C10.65,15 9.4,15.45 8.4,16.2L12,21M12,3C7.95,3 4.21,4.34 1.2,6.6L3,9C5.5,7.12 8.62,6 12,6C15.38,6 18.5,7.12 21,9L22.8,6.6C19.79,4.34 16.05,3 12,3M12,9C9.3,9 6.81,9.89 4.8,11.4L6.6,13.8C8.1,12.67 9.97,12 12,12C14.03,12 15.9,12.67 17.4,13.8L19.2,11.4C17.19,9.89 14.7,9 12,9Z",
  download: "M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z",
  upload: "M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z",
  ping: "M3,13H7L10,5L14,19L17,11H21V13H18.4L14,24L10,10L8.4,15H3V13Z",
  jitter: "M2,12H4L6,7L9,17L12,4L15,20L18,9L20,12H22",
  loss: "M12,2C17.5,2 22,6.5 22,12C22,17.5 17.5,22 12,22C6.5,22 2,17.5 2,12C2,6.5 6.5,2 12,2M12,4C10.1,4 8.4,4.6 7.1,5.7L18.3,16.9C19.3,15.5 20,13.8 20,12C20,7.6 16.4,4 12,4M16.9,18.3L5.7,7.1C4.6,8.4 4,10.1 4,12C4,16.4 7.6,20 12,20C13.9,20 15.6,19.4 16.9,18.3Z",
  server:
    "M4,1H20A1,1 0 0,1 21,2V6A1,1 0 0,1 20,7H4A1,1 0 0,1 3,6V2A1,1 0 0,1 4,1M4,9H20A1,1 0 0,1 21,10V14A1,1 0 0,1 20,15H4A1,1 0 0,1 3,14V10A1,1 0 0,1 4,9M4,17H20A1,1 0 0,1 21,18V22A1,1 0 0,1 20,23H4A1,1 0 0,1 3,22V18A1,1 0 0,1 4,17M9,5H10V3H9V5M9,13H10V11H9V13M9,21H10V19H9V21M5,3V5H7V3H5M5,11V13H7V11H5M5,19V21H7V19H5Z",
  chart: "M16,11.78L20.24,4.45L21.97,5.45L16.74,14.5L10.23,10.75L5.46,19H22V21H2V3H4V17.54L9.5,8L16,11.78Z",
  refresh: "M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z",
};

// Integrations whose speed tests are found on their own, the order they are preferred in, and how a test is run:
// [domain, service, data] for a service (data "download": the download sensor as entity_id), "update" (refresh the download sensor), or "button" (press the device's
// "run test" button).
export const PLATFORMS = {
  speedtest_tracker: { name: "Speedtest Tracker", run: "button" },
  ookla_speedtest: { name: "Ookla Speedtest", run: ["ookla_speedtest", "run_speedtest", "download"] },
  speedtestdotnet: { name: "Speedtest.net", run: "update" },
  fastdotcom: { name: "Fast.com", run: "update" },
  iperf3: { name: "iperf3", run: ["iperf3", "speedtest", {}] },
  netgear: { name: "Netgear", run: "update" },
};
// How long the card says a test runs after it was started from the card, unless a new result comes earlier.
export const TEST_MS = 90e3;
