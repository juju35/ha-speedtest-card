// ---------------------------------------------------------------------------
// Discovery
// ---------------------------------------------------------------------------
import { PLATFORMS } from "./core.js";
import { asList, byDevice, devName, keyText, num, parseTime, pick } from "./helpers.js";

// A data rate in Mbit/s from a sensor, whatever Home Assistant data-rate unit it has: bits (bit/s, kbit/s, Mbit/s, Gbit/s),
// bytes (B/s, kB/s, MB/s, GB/s) or binary bytes (KiB/s, MiB/s, GiB/s). Units are compared in lower case.
export const UNIT_MBPS = {
  "bit/s": 1e-6,
  "kbit/s": 1e-3,
  "mbit/s": 1,
  "gbit/s": 1e3,
  "b/s": 8e-6,
  "kb/s": 8e-3,
  "mb/s": 8,
  "gb/s": 8e3,
  "kib/s": (8 * 1024) / 1e6,
  "mib/s": (8 * 1024 ** 2) / 1e6,
  "gib/s": (8 * 1024 ** 3) / 1e6,
  mbps: 1,
  kbps: 1e-3,
  gbps: 1e3,
};
// The factor that turns a sensor's values into Mbit/s (1 for Mbit/s or an unknown unit).
export const mbpsFactor = (s) => UNIT_MBPS[String(s?.attributes?.unit_of_measurement || "Mbit/s").toLowerCase()] ?? 1;
export const toMbps = (s) => {
  const v = num(s);
  return v === null ? null : v * mbpsFactor(s);
};

// The sensors of a speed test among a list of registry entries: download, upload, ping, jitter, packet loss, server,
// ISP, time of the last test, and the button that runs a test.
export const NOT_MAIN = /latency|jitter|avg|average|min|max|elapsed|bytes|percent|pct|iqm|low|high|total|today|yesterday|week|month/;
// Buttons of a device that are not a speed test (a router's restart, a firmware update…).
export const NOT_RUN = /restart|reboot|firmware|update|reset|shutdown|power/;
export const findSensors = (hass, list) => {
  const sensor = (re, not) => pick(hass, list, "sensor", re, (e) => !not?.test(keyText(e, hass)));
  return {
    // A Netgear router's speed test: downlink_bandwidth, uplink_bandwidth and average_ping, beside its traffic counters.
    download: sensor(/downlink_bandwidth/) ?? sensor(/download/, NOT_MAIN),
    upload: sensor(/uplink_bandwidth/) ?? sensor(/upload/, NOT_MAIN),
    ping: sensor(/average_ping/) ?? sensor(/ping|latency/, /download|upload|low|high|avg|average|min|max|jitter|iqm/),
    jitter: sensor(/jitter/, /download|upload/),
    loss: sensor(/packet_loss|loss/),
    server: sensor(/server/, /id$|_id_|host/),
    isp: sensor(/(^|_)isp(_|$)/),
    last: sensor(/last_test|last_result|last_run|date_last/),
    button: pick(hass, list, "button", /run|test|start|speedtest/, (e) => !NOT_RUN.test(keyText(e, hass))),
  };
};

export const _cache = new WeakMap();

// The number of states, counted once per `hass.states` object (a new one comes with each state change): both the
// card's and the model's lookups ask for it on every push.
export const COUNTS = new WeakMap();
export const stateCount = (states) => {
  if (!states) return 0;
  let n = COUNTS.get(states);
  if (n === undefined) COUNTS.set(states, (n = Object.keys(states).length));
  return n;
};

// The speed test of the configuration, else of the first supported integration found (or the configured device).
// Returns { platform, name, download, upload, ping, jitter, loss, server, isp, last, button } (entity ids).
export const resolve = (hass, config) => {
  let per = _cache.get(hass.entities);
  if (!per) _cache.set(hass.entities, (per = new Map()));
  const sig = `${JSON.stringify([config.download, config.upload, config.ping, config.jitter, config.device, config.button])}|${stateCount(hass.states)}`;
  if (per.has(sig)) return per.get(sig);
  let out = null;
  if (config.download) {
    const e = hass.entities?.[config.download];
    const list = e?.device_id ? byDevice(hass).get(e.device_id) || [] : [];
    const found = findSensors(hass, list);
    out = {
      platform: e?.platform && PLATFORMS[e.platform] ? e.platform : null,
      download: config.download,
      upload: config.upload ?? found.upload ?? null,
      ping: config.ping ?? found.ping ?? null,
      jitter: config.jitter ?? found.jitter ?? null,
      loss: found.loss ?? null,
      server: found.server ?? null,
      isp: found.isp ?? null,
      last: found.last ?? null,
      button: config.button ?? found.button ?? null,
    };
  } else {
    const entries = Object.values(hass.entities || {});
    for (const platform of Object.keys(PLATFORMS)) {
      const mine = entries.filter((e) => e.platform === platform && hass.states[e.entity_id]);
      if (!mine.length) continue;
      // Grouped by device (iperf3 has none: its sensors, one host after the other).
      const groups = new Map();
      for (const e of mine) {
        const k = e.device_id || "none";
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k).push(e);
      }
      // The first device with a download sensor: a router (Netgear) also has a device for each client it tracks.
      const want = config.device;
      for (const key of [...groups.keys()].filter((k) => !want || k === want || devName(hass.devices?.[k]) === want)) {
        const list = key === "none" ? groups.get(key) : byDevice(hass).get(key) || groups.get(key);
        const found = findSensors(hass, list);
        if (!found.download) continue;
        // Sensors set in the configuration win over the ones found, as with a configured download sensor.
        out = { platform, ...found, upload: config.upload ?? found.upload, ping: config.ping ?? found.ping, jitter: config.jitter ?? found.jitter, button: config.button ?? found.button };
        break;
      }
      if (out) break;
    }
  }
  if (out) out.name = out.platform ? PLATFORMS[out.platform].name : null;
  per.set(sig, out);
  return out;
};

// Points [{ t, v }] of an entity from a history/history_during_period answer (minimal or full response).
// Values are multiplied by `factor` (the sensor's unit in Mbit/s: the history has no attributes).
export const historyPoints = (res, id, factor = 1) =>
  asList(res?.[id])
    .map((p) => ({ t: p.lu !== undefined ? p.lu * 1000 : parseTime(p.last_updated ?? p.last_changed), v: parseFloat(p.s ?? p.state) * factor }))
    .filter((p) => p.t !== null && Number.isFinite(p.v));

export const median = (list) => {
  if (!list.length) return null;
  const s = [...list].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

// A round top for a scale: 100, 200, 250, 500, 1000, 2500…
export const niceMax = (v) => {
  if (!(v > 0)) return 100;
  const p = 10 ** Math.floor(Math.log10(v));
  return [1, 2, 2.5, 5, 10].map((k) => k * p).find((x) => x >= v);
};
