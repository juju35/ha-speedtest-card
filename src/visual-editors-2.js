// ---------------------------------------------------------------------------
// Visual editors
// ---------------------------------------------------------------------------
import { PLATFORMS, VERSION } from "./core.js";
import { t } from "./helpers.js";
import { EditorBase } from "./visual-editors.js";
import { register } from "./register.js";
import { SpeedtestCard, SpeedtestMiniCard } from "./cards.js";

export class SpeedtestCardEditor extends EditorBase {
  static get toggles() {
    return [
      ["illustration", true],
      ["show_title", true],
      ["show_subtitle", true],
      ["show_history", true],
      ["show_stats", true],
      ["show_run", true],
    ];
  }

  static get defaults() {
    return { history_days: 7, alert_ratio: 0.5, ping_alert: 100, illustration_theme: "auto" };
  }

  static get sections() {
    return ["history"];
  }

  _fields() {
    return [
      { name: "download", selector: { entity: { domain: "sensor" } } },
      { name: "upload", selector: { entity: { domain: "sensor" } } },
      { name: "ping", selector: { entity: { domain: "sensor" } } },
      { name: "jitter", selector: { entity: { domain: "sensor" } } },
      { name: "button", selector: { entity: { domain: "button" } } },
      // Several speed tests (two Speedtest.net servers, a router and Speedtest Tracker): the one the card shows.
      { name: "device", selector: { device: { filter: Object.keys(PLATFORMS).map((integration) => ({ integration })) } } },
      {
        name: "illustration_theme",
        selector: { select: { mode: "dropdown", options: ["auto", "day", "night"].map((v) => ({ value: v, label: t(this._hass, this._config, `theme_${v}`) })) } },
      },
      {
        type: "grid",
        name: "",
        schema: [
          { name: "plan_download", selector: { number: { min: 0, max: 100000, step: 1, mode: "box", unit_of_measurement: "Mbit/s" } } },
          { name: "plan_upload", selector: { number: { min: 0, max: 100000, step: 1, mode: "box", unit_of_measurement: "Mbit/s" } } },
          { name: "history_days", selector: { number: { min: 1, max: 30, step: 1, mode: "box" } } },
          { name: "alert_ratio", selector: { number: { min: 0.1, max: 1, step: 0.05, mode: "box" } } },
          { name: "ping_alert", selector: { number: { min: 1, max: 2000, step: 1, mode: "box", unit_of_measurement: "ms" } } },
        ],
      },
    ];
  }
}

// The mini card's detail view is the full card: its editor offers the full card's options, plus the detail button.
export class SpeedtestMiniCardEditor extends SpeedtestCardEditor {
  static get toggles() {
    return [...SpeedtestCardEditor.toggles, ["zoom", true]];
  }
}

register(
  [
    ["speedtest-card", SpeedtestCard, { name: "Speedtest Card", description: "Internet speed: download gauge, upload, ping and jitter, 7-day history against your plan, and a button to run a test." }],
    ["speedtest-mini-card", SpeedtestMiniCard, { name: "Speedtest Mini Card", description: "Compact internet speed: a small gauge, download, upload and ping, a run button, and the full card behind its detail button." }],
    ["speedtest-card-editor", SpeedtestCardEditor],
    ["speedtest-mini-card-editor", SpeedtestMiniCardEditor],
  ],
  "https://github.com/juju35/ha-speedtest-card",
);

console.info(`%c SPEEDTEST-CARD %c v${VERSION} `, "color: white; background: #00897b; font-weight: 700;", "color: #00897b; background: white; font-weight: 700;");
