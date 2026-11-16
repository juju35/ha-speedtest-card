// Mock Home Assistant registries and states for the screenshots and the tests: the Speedtest.net integration (its
// download, upload and ping sensors, the server in the ping sensor's attributes) and a week of hourly results in the
// recorder, with a slow evening on Friday. Entity ids are in French on purpose (the cards never rely on them). Every
// time is relative to NOW, a fixed instant, so that the captures never change. `mockData(variant)` returns everything
// a card needs for one capture.
export const NOW = Date.parse("2026-11-16T12:29:00Z");
const iso = (ms) => new Date(ms).toISOString();
const HOUR = 3.6e6;

// A week of hourly tests: around 930 / 610 Mbit/s, a little lower in the evenings, one slow test on Friday 21:00.
export const HISTORY = (() => {
  const dl = [];
  const ul = [];
  const start = Math.floor((NOW - 7 * 24 * HOUR) / HOUR) * HOUR + HOUR;
  for (let t = start; t <= NOW - 14 * 6e4; t += HOUR) {
    const h = new Date(t).getUTCHours();
    const evening = h >= 19 && h <= 23 ? 40 : 0;
    const wobble = Math.round(Math.sin(t / 7.1e6) * 12 + Math.cos(t / 3.3e6) * 8);
    let d = 935 - evening + wobble;
    let u = 610 - evening / 4 + Math.round(wobble / 2);
    if (t === Date.parse("2026-11-13T21:00:00Z")) {
      d = 312;
      u = 455;
    }
    dl.push({ s: String(d), lu: t / 1000 });
    ul.push({ s: String(u), lu: t / 1000 });
  }
  return { "sensor.speedtest_reception": dl, "sensor.speedtest_envoi": ul };
})();

const base = () => {
  const states = {};
  const entities = {};
  const devices = { st: { id: "st", name: "Speedtest.net", name_by_user: null } };
  const entity = (entity_id, state, attributes, translation_key, platform = "speedtestdotnet", device_id = "st") => {
    entities[entity_id] = { entity_id, device_id, platform, translation_key };
    states[entity_id] = { entity_id, state: String(state), attributes, last_changed: iso(NOW - 14 * 6e4), last_updated: iso(NOW - 14 * 6e4) };
  };
  const server = { server_name: "Paris", server_country: "France", server_id: "24215" };
  entity("sensor.speedtest_reception", "942.37", { friendly_name: "Speedtest Download", unit_of_measurement: "Mbit/s", device_class: "data_rate", ...server }, "download");
  entity("sensor.speedtest_envoi", "612.08", { friendly_name: "Speedtest Upload", unit_of_measurement: "Mbit/s", device_class: "data_rate", ...server }, "upload");
  entity("sensor.speedtest_ping", "8", { friendly_name: "Speedtest Ping", unit_of_measurement: "ms", device_class: "duration", ...server }, "ping");
  return { states, entities, devices, areas: {}, api: {}, ws: { "history/history_during_period": structuredClone(HISTORY) }, subs: {} };
};

// The variants of the captures:
//   default — the last test is normal
//   slow    — the last test is slow (well under the plan)
export const mockData = (variant = "default") => {
  const d = base();
  if (variant === "slow") {
    d.states["sensor.speedtest_reception"].state = "286.4";
    d.states["sensor.speedtest_ping"].state = "31";
  }
  return d;
};
