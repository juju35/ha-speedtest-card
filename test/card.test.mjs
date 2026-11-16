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
  assert.match(h, /chip ok[^>]*>.*Normal/s);
  assert.match(h, /Speedtest.net · 14 min. ago/);
  assert.match(h, /<b class="num">942<\/b>/);
  assert.match(h, /Upload<\/span><b class="num">612<\/b>/);
  assert.match(h, /Ping<\/span><b class="num">8<\/b>/);
  assert.match(h, /Plan 1,000 Mbit\/s/);
  assert.match(h, /Slowest 312 Mbit\/s Fri 9:00 PM/);
  assert.match(h, /Paris, France/);
  assert.match(h, /data-action="run"/);
});

test("slow: under half of the plan, else of the median of the week", async () => {
  assert.match((await mount({ plan_download: 1000 }, "slow")).html(), /chip warn[^>]*>.*Slow/s);
  // No plan: the median of the history (around 930 Mbit/s) is the reference.
  assert.match((await mount({}, "slow")).html(), /chip warn[^>]*>.*Slow/s);
  assert.match((await mount({ plan_download: 400 }, "slow")).html(), /chip ok[^>]*>.*Normal/s);
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

test("mini card: the download in large, upload and ping, the sparkline and the run button; the detail button shows the full card", async () => {
  const { card, html } = await mount({}, "default", SpeedtestMiniCard);
  assert.match(html(), /content mini/);
  assert.match(html(), /class="spark"/);
  assert.match(html(), /612 Mbit\/s · 8 ms/);
  click(card, { action: "zoom" });
  assert.match(html(), /gauge/);
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
