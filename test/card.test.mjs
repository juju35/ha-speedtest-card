import assert from "node:assert/strict";
import { test } from "node:test";
import { HISTORY, mockData } from "../scripts/mock-states.mjs";
import { load } from "./load.mjs";

const st = load({ names: ["toMbps", "resolve", "historyPoints", "niceMax", "median", "STRINGS", "LANGUAGES"] });
const SpeedtestCard = st.element("speedtest-card");
const SpeedtestMiniCard = st.element("speedtest-mini-card");
// Objects from the sandbox have the sandbox's prototypes: compared as plain JSON.
const same = (a, b, msg) => assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)), msg);

const makeHass = (variant = "default", { language = "en", data } = {}) => {
  const d = data ?? mockData(variant);
  const calls = [];
  return {
    calls,
    ...d,
    language,
    locale: { language },
    callService: (...a) => calls.push(a),
    callWS: async (msg) => {
      calls.push(["ws", msg.type, msg]);
      return structuredClone(d.ws[msg.type]);
    },
  };
};

const mount = async (config = {}, variant = "default", Card = SpeedtestCard, opts = {}) => {
  const card = new Card();
  card._connected = true;
  card.setConfig(config);
  const hass = makeHass(variant, opts);
  card.hass = hass;
  card.connectedCallback();
  await new Promise((r) => setTimeout(r, 0));
  await new Promise((r) => setTimeout(r, 0));
  // Intl puts narrow no-break spaces in times ("9:00 PM"): plain spaces for the assertions.
  return { card, hass, html: () => card.shadowRoot.innerHTML.replace(/[   ]/g, " ") };
};

const click = (card, dataset) => card._onClick({ composedPath: () => [{ dataset }], stopPropagation() {}, detail: 1 });

test("speeds in Mbit/s whatever the sensor's unit", () => {
  assert.equal(st.toMbps({ state: "942", attributes: { unit_of_measurement: "Mbit/s" } }), 942);
  assert.equal(st.toMbps({ state: "1.2", attributes: { unit_of_measurement: "Gbit/s" } }), 1200);
  assert.equal(st.toMbps({ state: "500", attributes: { unit_of_measurement: "kbit/s" } }), 0.5);
  assert.equal(st.toMbps({ state: "10", attributes: { unit_of_measurement: "MB/s" } }), 80);
  assert.equal(st.toMbps({ state: "unavailable", attributes: {} }), null);
  // Binary bytes per second, as Home Assistant's data-rate units name them.
  assert.equal(st.toMbps({ state: "1", attributes: { unit_of_measurement: "KiB/s" } }), 0.008192);
  assert.equal(st.toMbps({ state: "1", attributes: { unit_of_measurement: "MiB/s" } }), 8.388608);
  assert.equal(st.toMbps({ state: "1", attributes: { unit_of_measurement: "GiB/s" } }), 8589.934592);
  assert.equal(st.niceMax(940), 1000);
  assert.equal(st.median([3, 1, 2]), 2);
});

test("Speedtest.net is found with its download, upload and ping sensors", () => {
  const m = st.resolve(makeHass(), {});
  same(
    [m.platform, m.download, m.upload, m.ping, m.button],
    ["speedtestdotnet", "sensor.speedtest_reception", "sensor.speedtest_envoi", "sensor.speedtest_ping", null],
  );
});

test("Speedtest Tracker: its sensors and its run button, by their names", () => {
  const ids = ["download", "upload", "ping", "ping_jitter", "download_jitter", "download_avg", "packet_loss", "server"];
  const states = {};
  const entities = {};
  for (const k of ids) {
    const id = `sensor.tracker_${k}`;
    entities[id] = { entity_id: id, device_id: "t", platform: "speedtest_tracker", translation_key: null };
    states[id] = { entity_id: id, state: "1", attributes: { friendly_name: `Speedtest Tracker ${k.replace(/_/g, " ")}` } };
  }
  entities["button.tracker_run_test"] = { entity_id: "button.tracker_run_test", device_id: "t", platform: "speedtest_tracker" };
  states["button.tracker_run_test"] = { entity_id: "button.tracker_run_test", state: "unknown", attributes: { friendly_name: "Speedtest Tracker Run test" } };
  const m = st.resolve({ states, entities, devices: { t: { id: "t", name: "Speedtest Tracker" } } }, {});
  same(
    [m.download, m.upload, m.ping, m.jitter, m.loss, m.server, m.button],
    ["sensor.tracker_download", "sensor.tracker_upload", "sensor.tracker_ping", "sensor.tracker_ping_jitter", "sensor.tracker_packet_loss", "sensor.tracker_server", "button.tracker_run_test"],
  );
});

test("a Netgear router: its speed test sensors, not its traffic counters nor its restart button; a test refreshes them", async () => {
  const router = [
    ["sensor", "download_today", "MB"],
    ["sensor", "downlink_bandwidth", "Mbit/s"],
    ["sensor", "upload_today", "MB"],
    ["sensor", "uplink_bandwidth", "Mbit/s"],
    ["sensor", "average_ping", "ms"],
    ["button", "reboot", null],
  ];
  const data = { states: {}, entities: {}, devices: { phone: { id: "phone", name: "Phone" }, r: { id: "r", name: "Router" } }, ws: {} };
  // A client the router tracks comes first, with its own device: the card goes on to the router.
  for (const [id, key] of [
    ["device_tracker.phone", null],
    ["sensor.phone_link_rate", "link_rate"],
  ]) {
    data.entities[id] = { entity_id: id, device_id: "phone", platform: "netgear", translation_key: key };
    data.states[id] = { entity_id: id, state: "866", attributes: { unit_of_measurement: key ? "Mbit/s" : undefined, friendly_name: `Phone ${key}` } };
  }
  for (const [domain, key, unit] of router) {
    const id = `${domain}.router_${key}`;
    data.entities[id] = { entity_id: id, device_id: "r", platform: "netgear", translation_key: key };
    data.states[id] = { entity_id: id, state: "12", attributes: { unit_of_measurement: unit, friendly_name: `Router ${key}` } };
  }
  const hass = makeHass("default", { data });
  const m = st.resolve(hass, {});
  same([m.platform, m.download, m.upload, m.ping, m.button], ["netgear", "sensor.router_downlink_bandwidth", "sensor.router_uplink_bandwidth", "sensor.router_average_ping", null]);
  const card = new SpeedtestCard();
  card.setConfig({});
  card.hass = hass;
  click(card, { action: "run" });
  same(hass.calls.at(-1), ["homeassistant", "update_entity", { entity_id: "sensor.router_downlink_bandwidth" }]);
});

test("Ookla Speedtest: a test runs for the card's download sensor only", async () => {
  const data = mockData();
  for (const id of Object.keys(data.entities)) if (data.entities[id].platform === "speedtestdotnet") data.entities[id].platform = "ookla_speedtest";
  const hass = makeHass("default", { data });
  const card = new SpeedtestCard();
  card.setConfig({});
  card.hass = hass;
  click(card, { action: "run" });
  same(hass.calls.at(-1), ["ookla_speedtest", "run_speedtest", { entity_id: "sensor.speedtest_reception" }]);
});

test("the history is read from the recorder: the download and upload sensors over 7 days", async () => {
  const { hass, card } = await mount({ plan_download: 1000 });
  const ws = hass.calls.find((c) => c[0] === "ws");
  assert.equal(ws[1], "history/history_during_period");
  same(ws[2].entity_ids, ["sensor.speedtest_reception", "sensor.speedtest_envoi"]);
  assert.equal(ws[2].minimal_response, true);
  assert.equal(card._history.dl.length, HISTORY["sensor.speedtest_reception"].length);
  assert.equal(st.historyPoints({ x: [{ state: "3", last_updated: "2026-11-16T10:00:00Z" }] }, "x")[0].v, 3);
});

test("gauge, stats, chart with the plan and the slowest test, tiles", async () => {
  const { html } = await mount({ plan_download: 1000 });
  const h = html();
  // The pill takes the icon's colour (the accent when all is well), right after the title.
  assert.match(h, /<div class="name">Internet speed<\/div>\s*<span class="chip accent[^>]*>.*Normal/s);
  assert.match(h, /Speedtest.net · 14 min. ago/);
  assert.match(h, /<b>942<\/b><span>Mbit\/s<\/span>/);
  assert.match(h, /612 Mbit\/s · Upload/);
  assert.match(h, /8 ms Ping/);
  assert.match(h, /94% of your plan/);
  // The plan is the end of the dial: no mark on it.
  assert.doesNotMatch(h, /class="mark"/);
  assert.match(h, /class="area"/);
  assert.match(h, /Last test 14 min. ago/);
  assert.match(h, /Plan 1,000 Mbit\/s/);
  assert.match(h, /Slowest 312 Mbit\/s Fri 9:00 PM/);
  assert.match(h, /Paris, France/);
  assert.match(h, /data-action="run"/);
});

test("slow: under half of the plan, else of the median of the week", async () => {
  assert.match((await mount({ plan_download: 1000 }, "slow")).html(), /chip warn[^>]*>.*Slow/s);
  // No plan: the median of the history (around 930 Mbit/s) is the reference.
  assert.match((await mount({}, "slow")).html(), /chip warn[^>]*>.*Slow/s);
  assert.match((await mount({ plan_download: 400 }, "slow")).html(), /chip accent[^>]*>.*Normal/s);
});

test("run a test: Speedtest.net refreshes its download sensor; the card says it is testing until a new result", async () => {
  const { card, hass, html } = await mount();
  click(card, { action: "run" });
  same(hass.calls.at(-1), ["homeassistant", "update_entity", { entity_id: "sensor.speedtest_reception" }]);
  assert.match(html(), /Testing…/);
  assert.match(html(), /gauge accent testing/);
  const states = { ...hass.states, "sensor.speedtest_reception": { ...hass.states["sensor.speedtest_reception"], state: "950", last_updated: "2026-11-16T12:31:00Z" } };
  card.hass = { ...hass, states };
  assert.doesNotMatch(html(), /Testing…/);
});

test("run a test with a configured button", async () => {
  const { card, hass } = await mount({ download: "sensor.speedtest_reception", button: "button.run_test" });
  click(card, { action: "run" });
  same(hass.calls.at(-1), ["button", "press", { entity_id: "button.run_test" }]);
});

test("options: sections hidden and folded", async () => {
  const { card, html } = await mount({ show_stats: false, show_run: false, collapsed: ["history"] });
  assert.doesNotMatch(html(), /Average/);
  assert.doesNotMatch(html(), /data-action="run"/);
  assert.doesNotMatch(html(), /<polyline/);
  click(card, { action: "toggle_section", section: "history" });
  assert.match(html(), /<polyline/);
  card._outside.tap({ composedPath: () => [] });
  assert.doesNotMatch(html(), /<polyline/);
});

test("mini card: the gauge, the download in large, upload and ping and the run button; the detail button shows the full card", async () => {
  const { card, html } = await mount({}, "default", SpeedtestMiniCard);
  assert.match(html(), /content mini/);
  assert.match(html(), /hero-art gauge/);
  assert.match(html(), /612 Mbit\/s · 8 ms/);
  click(card, { action: "zoom" });
  assert.match(html(), /class="tiles"/);
  card._unzoom.tap({ composedPath: () => [] });
  assert.match(html(), /content mini/);
});

test("nothing found: a clear message instead of an empty card", () => {
  const card = new SpeedtestCard();
  card.setConfig({});
  card.hass = { states: {}, entities: {}, devices: {}, language: "en" };
  assert.match(card.shadowRoot.innerHTML, /No speed test found/);
});

test("French: texts and numbers in the card's language", async () => {
  const { html } = await mount({ language: "fr", plan_download: 1000 });
  assert.match(html(), /Réception/);
  assert.match(html(), /Abonnement 1 000 Mbit\/s/);
});

test("every language has every text, with the same placeholders as English", () => {
  const en = st.STRINGS.en;
  const ph = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  for (const [l, table] of Object.entries(st.STRINGS)) {
    assert.deepEqual(Object.keys(table).sort(), Object.keys(en).sort(), l);
    for (const k of Object.keys(en)) assert.deepEqual(ph(table[k]), ph(en[k]), `${l}.${k}`);
  }
  assert.equal(st.LANGUAGES.length, Object.keys(st.STRINGS).length);
});

test("visual editor: defaults left out of the YAML; the mini editor adds the detail button", () => {
  const Editor = st.element("speedtest-card-editor");
  const MiniEditor = st.element("speedtest-mini-card-editor");
  const doc = st.window.document;
  const create = doc.createElement;
  let form;
  doc.createElement = (tag) => (form = { tag, listeners: {}, addEventListener(type, fn) { this.listeners[type] = fn; } });
  try {
    const ed = new Editor();
    let out;
    ed.dispatchEvent = (ev) => {
      out = ev.detail.config;
    };
    ed.setConfig({ type: "custom:speedtest-card" });
    ed.hass = makeHass();
    assert.match(form.computeLabel({ name: "download" }), /Download sensor/);
    form.listeners["value-changed"]({ stopPropagation() {}, detail: { value: { type: "custom:speedtest-card", history_days: 7, plan_download: 1000, show_run: true } } });
    same(out, { type: "custom:speedtest-card", plan_download: 1000 });
  } finally {
    doc.createElement = create;
  }
  assert.ok(MiniEditor.toggles.some(([n]) => n === "zoom"));
});

test("every clickable element can be reached and used from the keyboard", async () => {
  const { html } = await mount({ plan_download: 1000 });
  for (const m of html().matchAll(/<(div|span)[^>]*data-(entity|action)=[^>]*>/g)) {
    assert.match(m[0], /role="button"/, m[0]);
    assert.match(m[0], /tabindex="0"/, m[0]);
  }
});

test("a high ping does not colour the share of the plan: the speed is fine", async () => {
  const data = mockData();
  data.states["sensor.speedtest_ping"].state = "250";
  const card = new SpeedtestCard();
  card.setConfig({ plan_download: 1000 });
  card.hass = makeHass("default", { data });
  await new Promise((r) => setTimeout(r, 0));
  const h = card.shadowRoot.innerHTML;
  assert.match(h, /class="chip warn/);
  assert.match(h, /class="line ok"[^>]*>.{0,400}94% of your plan/s);
});

test("illustrated header: the gauge on the banner, night from sun.sun or the theme, unique ids, classic header on request", async () => {
  const { html } = await mount({ plan_download: 1000 });
  assert.match(html(), /class="banner st-ok"/);
  assert.match(html(), /class="st-gauge gauge accent"/);
  assert.match(html(), /class="st-ground"/);
  const ids = [html().match(/id="(st-glow-\d+)"/)[1], (await mount()).html().match(/id="(st-glow-\d+)"/)[1]];
  assert.notEqual(ids[0], ids[1]);
  const data = mockData();
  data.states["sun.sun"] = { entity_id: "sun.sun", state: "below_horizon", attributes: {} };
  assert.match((await mount({}, "default", SpeedtestCard, { data })).html(), /class="banner st-ok night"/);
  assert.doesNotMatch((await mount({ illustration_theme: "day" }, "default", SpeedtestCard, { data })).html(), / night"/);
  assert.match((await mount({ illustration_theme: "night" })).html(), / night"/);
  assert.match((await mount({ plan_download: 1000 }, "slow")).html(), /class="banner st-warn"/);
  const classic = (await mount({ illustration: false })).html();
  assert.doesNotMatch(classic, /class="banner/);
  assert.match(classic, /class="header"/);
  assert.match((await mount({}, "default", SpeedtestMiniCard)).html(), /class="banner mini-banner st-ok"/);
});

test("illustrated header: the dark theme shows the night picture even while the sun is up; forced day/night win", async () => {
  const sunUp = (darkMode) => {
    const data = mockData();
    data.states["sun.sun"] = { entity_id: "sun.sun", state: "above_horizon", attributes: {} };
    data.themes = { darkMode };
    return { data };
  };
  for (const Card of [SpeedtestCard, SpeedtestMiniCard]) {
    assert.match((await mount({}, "default", Card, sunUp(true))).html(), /class="banner[^"]* night"/);
    assert.doesNotMatch((await mount({}, "default", Card, sunUp(false))).html(), /class="banner[^"]* night"/);
    assert.doesNotMatch((await mount({ illustration_theme: "day" }, "default", Card, sunUp(true))).html(), /class="banner[^"]* night"/);
    assert.match((await mount({ illustration_theme: "night" }, "default", Card, sunUp(false))).html(), /class="banner[^"]* night"/);
  }
});

test("status pill: on the title row or under the subtitle, measured (no fixed width), its dot at 200 px; the zoom button in the corner", async () => {
  const { readFileSync } = await import("node:fs");
  const src = readFileSync(new URL("../src/speedtest-card.js", import.meta.url), "utf8");
  assert.match(src, /<div class="trow"><div class="name">\$\{esc\(title\)\}<\/div><span class="chip /);
  assert.match(src, /\.titles\.pill-below \.trow \{ display: contents; \}/);
  assert.doesNotMatch(src, /st-titles|max-width: 50%/);
  assert.match(src, /@container st-card \(max-width: 200px\) \{\s*\.chip \{ padding: 4px; \}\s*\.chip-text \{[^}]*clip-path: inset\(50%\)/);
  const zoom = src.match(/\n {2}\.banner \.zoom \{([^}]*)\}/)[1];
  for (const d of [/position: absolute/, /top: 5px/, /right: 5px/, /width: 24px/, /height: 24px/]) assert.match(zoom, d);
});
