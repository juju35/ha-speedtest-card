// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------
import { PLATFORMS, TEST_MS } from "./core.js";
import { DAY_MS, ICONS, clamp, esc, fmtRelative, fmtWhen, moreInfo, num, parseTime, svgIcon, valid } from "./helpers.js";
import { BASE_STYLE, MINI_STYLE } from "./styles.js";
import { CardBase, withMini } from "./card-base.js";
import { historyPoints, mbpsFactor, median, niceMax, resolve, toMbps } from "./discovery.js";
import { SPEED_STYLE } from "./styles-2.js";
import { ST_BANNER_STYLE, stIsNight, stSceneSvg } from "./illustrated-header.js";

export let _stUid = 0;

export class SpeedtestCard extends CardBase {
  static getConfigElement() {
    return document.createElement("speedtest-card-editor");
  }

  getCardSize() {
    return 7;
  }

  _build() {
    return resolve(this._hass, this._config);
  }

  _resolve() {
    const r = super._resolve();
    return r === null && this._hass?.entities ? false : r;
  }

  _ready() {
    const m = this._resolve();
    if (m === null) return { error: this._errorCard("no_registry") };
    if (!m) return { error: this._errorCard("no_data") };
    return { m };
  }

  _entityIds(m) {
    return m ? [m.download, m.upload, m.ping, m.jitter, m.loss, m.server, m.isp, m.last].filter(Boolean) : [];
  }

  _extraDeps() {
    return [this._history, this._testing];
  }

  _onConnect() {
    this._histKey = null;
  }

  _configChanged() {
    this._history = undefined;
    this._histKey = null;
  }

  _afterUpdate() {
    this._fetchHistory();
  }

  // The history of the download and upload sensors over `history_days` (7): fetched once, again after each new
  // result (and every hour).
  _fetchHistory() {
    const m = this._resolve();
    if (!m || (this._config.show_history === false && this._config.show_stats === false)) return;
    const days = Number(this._config.history_days) || 7;
    const st = this._s(m.download);
    const key = `${m.download}|${st?.last_updated}|${days}|${Math.floor(Date.now() / 3.6e6)}`;
    if (key === this._histKey) return;
    this._histKey = key;
    const end = Date.now();
    this._ws({
      type: "history/history_during_period",
      start_time: new Date(end - days * DAY_MS).toISOString(),
      end_time: new Date(end).toISOString(),
      entity_ids: [m.download, m.upload].filter(Boolean),
      minimal_response: true,
      no_attributes: true,
      significant_changes_only: false,
    }).then((res) => {
      if (!res) return;
      // In Mbit/s, as the current values (a sensor in kbit/s, MB/s or MiB/s would otherwise skew the chart and the median).
      const dl = historyPoints(res, m.download, mbpsFactor(this._s(m.download)));
      this._history = { dl, ul: m.upload ? historyPoints(res, m.upload, mbpsFactor(this._s(m.upload))) : [], days };
      this._lastDeps = null;
      this._update();
    });
  }

  // A speed shown: whole Mbit/s from 100, one decimal under.
  _speed(v) {
    if (v === null || v === undefined) return "—";
    return new Intl.NumberFormat(this._locale(), { maximumFractionDigits: v < 100 ? 1 : 0 }).format(v);
  }

  _ms(v) {
    return v === null || v === undefined ? "—" : new Intl.NumberFormat(this._locale(), { maximumFractionDigits: v < 10 ? 1 : 0 }).format(v);
  }

  _summary(m) {
    const c = this._config;
    const dl = toMbps(this._s(m.download));
    const ul = m.upload ? toMbps(this._s(m.upload)) : null;
    const ping = m.ping ? num(this._s(m.ping)) : null;
    const jitter = m.jitter ? num(this._s(m.jitter)) : null;
    const loss = m.loss ? num(this._s(m.loss)) : null;
    const pts = this._history?.dl || [];
    const plan = Number(c.plan_download) || null;
    const planUl = Number(c.plan_upload) || null;
    const reference = plan || median(pts.map((p) => p.v));
    const ratio = Number(c.alert_ratio) || 0.5;
    const testing = this._testing && Date.now() - this._testing < TEST_MS;
    const last = (m.last && parseTime(this._s(m.last)?.state)) || parseTime(this._s(m.download)?.last_updated);
    let status;
    if (testing) status = { cls: "active", text: this._t("testing") };
    else if (dl === null) status = { cls: "crit", text: this._t("no_result"), entity: m.download };
    else if (reference && dl < reference * ratio) status = { cls: "warn", text: this._t("slow"), entity: m.download };
    else if (ping !== null && ping > (Number(c.ping_alert) || 100)) status = { cls: "warn", text: this._t("high_ping"), entity: m.ping };
    else status = { cls: "ok", text: this._t("normal") };
    const max = plan || niceMax(Math.max(dl ?? 0, ...pts.map((p) => p.v)) * 1.05);
    return { dl, ul, ping, jitter, loss, plan, planUl, reference, ratio, status, testing, last, max };
  }

  _subtitle(m, sum) {
    const parts = [];
    if (m.name) parts.push(m.name);
    if (sum.last) parts.push(fmtRelative(this._hass, this._config, sum.last));
    return parts.join(" · ");
  }

  // The header: the illustrated banner (title, subtitle and status chip on its sky, the scene at its right), or
  // the classic header with `illustration: false`.
  _head(sum, sub) {
    const cls = sum.status.cls === "ok" ? "accent" : sum.status.cls;
    const title = this._config.title || this._t("internet");
    if (this._config.illustration === false) return this._header({ icon: ICONS.gauge, cls, title, sub, chip: sum.status });
    this._uid ??= ++_stUid;
    const chip = sum.status;
    const scene = stSceneSvg(this._uid, { cls: this._gaugeCls(sum), art: this._gaugeArt(sum) });
    return `<div class="banner${this._renderMini && !this._zoomed ? " mini-banner" : ""} st-${sum.testing ? "testing" : sum.status.cls}${stIsNight(this._hass, this._config) ? " night" : ""}">
        ${scene}<div class="st-ground" aria-hidden="true"></div>
        <div class="htext">
          <div class="type-icon ${cls}">${svgIcon(ICONS.wifi)}</div>
          <div class="titles">
            <div class="trow"><div class="name">${esc(title)}</div><span class="chip ${cls}${chip.entity ? " clickable" : ""}"${moreInfo(chip.entity)} title="${esc(chip.text)}" aria-label="${esc(chip.text)}"><span class="dot"></span><span class="chip-text">${esc(chip.text)}</span></span></div>
            ${sub ? `<div class="sub" title="${esc(sub)}">${esc(sub)}</div>` : ""}
          </div>
        </div>
        ${this._zoomButton()}
      </div>`;
  }

  _styles() {
    return this._config.illustration === false ? "" : ST_BANNER_STYLE;
  }

  // The gauge, a flat illustration: the download speed on a half dial with the plan's mark, a needle on it (it sweeps
  // the dial while a test runs) and a box whose light blinks during the test.
  _gaugeCls(sum) {
    const cls = sum.status.cls === "warn" || sum.status.cls === "crit" ? sum.status.cls : "accent";
    return `gauge ${cls}${sum.testing ? " testing" : ""}`;
  }

  // The dial's drawing, in a 120 × 100 box: in the hero, and on the banner's ground.
  _gaugeArt(sum) {
    const r = 44;
    const len = Math.PI * r;
    const p = sum.dl === null ? 0 : clamp(sum.dl / sum.max, 0, 1);
    const pt = (f, rr) => [60 - rr * Math.cos(Math.PI * f), 70 - rr * Math.sin(Math.PI * f)].map((v) => v.toFixed(1));
    const mark = sum.plan && sum.plan < sum.max ? (() => { const f = clamp(sum.plan / sum.max, 0, 1); const [x1, y1] = pt(f, r - 8); const [x2, y2] = pt(f, r + 8); return `<line class="mark" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-width="2"/>`; })() : "";
    const deg = sum.testing ? 0 : p * 180;
    return `<path class="track" d="M16 70 A${r} ${r} 0 0 1 104 70" fill="none" stroke-width="10" stroke-linecap="round"/>
        <path class="arc" d="M16 70 A${r} ${r} 0 0 1 104 70" fill="none" stroke-width="10" stroke-linecap="round" stroke-dasharray="${len.toFixed(1)}" style="stroke-dashoffset:${(len * (1 - p)).toFixed(1)}"/>
        ${mark}
        <g class="needle" style="transform: rotate(${deg.toFixed(1)}deg)"><line x1="60" y1="70" x2="26" y2="70" stroke-width="4" stroke-linecap="round"/></g>
        <circle class="hub" cx="60" cy="70" r="6"/>
        <rect class="box" x="36" y="84" width="48" height="12" rx="4"/>
        <circle class="led" cx="46" cy="90" r="2"/><circle class="led" cx="54" cy="90" r="2"/><circle class="led blink" cx="62" cy="90" r="2"/>`;
  }

  _gauge(m, sum) {
    return `<div class="hero-art ${this._gaugeCls(sum)} clickable"${moreInfo(m.download)} aria-label="${esc(`${this._t("download")} ${this._speed(sum.dl)} ${this._t("mbps")}`)}">
      <svg viewBox="0 0 120 100" aria-hidden="true">
        ${this._gaugeArt(sum)}
      </svg></div>`;
  }

  // The big download speed and the lines beside the gauge: upload, ping (and jitter, loss), share of the plan.
  _heroBody(m, sum) {
    const cls = sum.status.cls === "warn" || sum.status.cls === "crit" ? sum.status.cls : "accent";
    const lines = [`<div class="big ${cls}">${svgIcon(ICONS.download)}<b>${esc(this._speed(sum.dl))}</b><span>${esc(this._t("mbps"))}</span></div>`];
    const ln = (icon, text, entity, c = "") => `<div class="line ${c}${entity ? " clickable" : ""}"${moreInfo(entity)}>${svgIcon(icon)}<span>${esc(text)}</span></div>`;
    // Under its share of the plan's upload (plan_upload), the upload line turns amber as the download does.
    const ulSlow = sum.planUl && sum.ul !== null && !sum.testing && sum.ul < sum.planUl * sum.ratio;
    if (m.upload) lines.push(ln(ICONS.upload, `${this._speed(sum.ul)} ${this._t("mbps")} · ${this._t("upload")}`, m.upload, ulSlow ? "warn" : "active"));
    const pingBits = [];
    if (m.ping) pingBits.push(`${this._ms(sum.ping)} ${this._t("ms")} ${this._t("ping")}`);
    if (m.jitter) pingBits.push(`${this._ms(sum.jitter)} ${this._t("ms")} ${this._t("jitter")}`);
    if (m.loss) pingBits.push(`${this._ms(sum.loss)} % ${this._t("loss")}`);
    if (pingBits.length) lines.push(ln(ICONS.ping, pingBits.join(" · "), m.ping || m.jitter || m.loss, sum.status.entity === m.ping && m.ping ? "warn" : ""));
    // The share of the plan, coloured by the download speed alone: a high ping does not make the speed slow.
    if (sum.plan && sum.dl !== null) {
      const slow = sum.dl < sum.plan * sum.ratio;
      lines.push(ln(slow ? ICONS.alert : ICONS.check, this._t("of_plan", { p: Math.round((sum.dl / sum.plan) * 100) }), null, sum.testing ? "" : slow ? "warn" : "ok"));
    }
    else if (sum.status.cls !== "ok") lines.push(ln(ICONS.alert, sum.status.text, sum.status.entity, sum.status.cls));
    return `<div class="hero-body">${lines.join("")}</div>`;
  }

  // The lines of the download and upload speeds over the window, the plan's dashed line and the slowest test.
  _chart(sum) {
    const h = this._history;
    if (!h) return `<div class="empty">${esc(this._t("loading"))}</div>`;
    if (h.dl.length < 2) return `<div class="empty">${esc(this._t("no_history"))}</div>`;
    const W = 400;
    const H = 120;
    const end = Date.now();
    const start = end - h.days * DAY_MS;
    const top = Math.max(sum.plan || 0, ...h.dl.map((p) => p.v), ...h.ul.map((p) => p.v)) * 1.1;
    const x = (t) => ((t - start) / (end - start)) * W;
    const y = (v) => H - 4 - (clamp(v, 0, top) / top) * (H - 16);
    const xy = (pts) => pts.map((p) => `${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
    const line = (pts, cls) => `<polyline class="${cls}" points="${xy(pts)}" fill="none" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`;
    const area = `<polygon class="area" points="${x(h.dl[0].t).toFixed(1)},${H} ${xy(h.dl)} ${x(h.dl[h.dl.length - 1].t).toFixed(1)},${H}"/>`;
    const grid = [0.25, 0.5, 0.75].map((f) => `<line class="grid" x1="0" x2="${W}" y1="${y(top * f).toFixed(1)}" y2="${y(top * f).toFixed(1)}" stroke-width="1"/>`).join("");
    const plan = sum.plan ? `<line class="plan" x1="0" x2="${W}" y1="${y(sum.plan).toFixed(1)}" y2="${y(sum.plan).toFixed(1)}" stroke-width="1"/><text x="${W}" y="${(y(sum.plan) - 4).toFixed(1)}" text-anchor="end">${esc(this._t("plan", { speed: `${this._speed(sum.plan)} ${this._t("mbps")}` }))}</text>` : "";
    const low = h.dl.reduce((a, b) => (b.v < a.v ? b : a));
    const dipped = sum.reference && low.v < sum.reference * sum.ratio;
    const dip = dipped ? `<circle class="dip" cx="${x(low.t).toFixed(1)}" cy="${y(low.v).toFixed(1)}" r="4"/>` : "";
    const days = [];
    for (let i = h.days - 1; i >= 0; i--) days.push(new Intl.DateTimeFormat(this._locale(), { weekday: "short" }).format(new Date(end - i * DAY_MS)));
    const legend = `<div class="legend"><span class="k accent" style="--c: var(--st-accent)"><span class="sw"></span>${esc(this._t("download"))}</span>${h.ul.length ? `<span class="k" style="--c: var(--st-active)"><span class="sw"></span>${esc(this._t("upload"))}</span>` : ""}${
      dipped ? `<span class="dipnote">${svgIcon(ICONS.alert)}${esc(this._t("dip", { speed: `${this._speed(low.v)} ${this._t("mbps")}`, when: fmtWhen(this._hass, this._config, low.t) }))}</span>` : ""
    }</div>`;
    return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(this._t("history"))}">${grid}${area}${plan}${h.ul.length > 1 ? line(h.ul, "ul") : ""}${line(h.dl, "dl")}${dip}</svg>
      <div class="xaxis">${days.map((d) => `<span>${esc(d)}</span>`).join("")}</div>${legend}</div>`;
  }

  // Tiles as on the room overview: average and slowest download of the window (tinted when the slowest is slow), the
  // server and the provider.
  _tiles(m, sum) {
    const h = this._history;
    const tile = (icon, value, unit, label, entity, c = "") =>
      `<div class="tile${c ? ` tint ${c}` : ""}${entity ? " clickable" : ""}"${moreInfo(entity)}><div class="tile-head"><div class="row-icon${c ? "" : " idle"}">${svgIcon(icon)}</div><div class="row-text"><div class="row-name">${esc(value)}${unit ? `<small>${esc(unit)}</small>` : ""}</div><div class="row-state${c ? ` ${c}` : ""}">${esc(label)}</div></div></div></div>`;
    const out = [];
    if (h?.dl.length) {
      const vals = h.dl.map((p) => p.v);
      const low = Math.min(...vals);
      out.push(tile(ICONS.download, this._speed(vals.reduce((a, b) => a + b, 0) / vals.length), this._t("mbps"), this._t("average"), m.download));
      out.push(tile(ICONS.download, this._speed(low), this._t("mbps"), this._t("slowest"), m.download, sum.reference && low < sum.reference * sum.ratio ? "warn" : ""));
    }
    const srv = m.server ? this._s(m.server)?.state : this._s(m.ping || m.download)?.attributes?.server_name;
    const country = m.server ? null : this._s(m.ping || m.download)?.attributes?.server_country;
    const isp = m.isp ? this._s(m.isp)?.state : null;
    if (srv && valid({ state: srv })) out.push(tile(ICONS.server, [srv, country].filter(Boolean).join(", "), "", this._t("server"), m.server || m.ping));
    if (isp && valid({ state: isp })) out.push(tile(ICONS.server, isp, "", this._t("isp"), m.isp));
    return out.length ? `<div class="tiles" style="--cols: ${Math.min(out.length, 3)}">${out.join("")}</div>` : "";
  }

  // How a test is run here: the configured or found button, else the integration's own way; null when none.
  _runCall(m) {
    if (m.button) return ["button", "press", { entity_id: m.button }];
    const run = PLATFORMS[m.platform]?.run;
    // A service; "download" for its data targets the download sensor's speed test only (Ookla: one test per server).
    if (Array.isArray(run)) return [run[0], run[1], run[2] === "download" ? { entity_id: m.download } : run[2]];
    if (run === "update") return ["homeassistant", "update_entity", { entity_id: m.download }];
    return null;
  }

  _runButton(m, sum, round = false) {
    if (this._config.show_run === false || !this._runCall(m)) return "";
    const label = sum.testing ? this._t("testing") : this._t("run_test");
    const cls = `btn${round ? " round" : ""}${sum.testing ? " active spin" : ""}`;
    return `<button class="${cls}" data-action="run" title="${esc(label)}" aria-label="${esc(label)}"${sum.testing ? " disabled" : ""}>${svgIcon(sum.testing ? ICONS.refresh : ICONS.play)}${round ? "" : `<span>${esc(label)}</span>`}</button>`;
  }

  _action(action) {
    if (action !== "run") return false;
    const m = this._resolve();
    const call = m && this._runCall(m);
    if (!call) return true;
    this._call(...call);
    this._testing = Date.now();
    this._testedFrom = this._s(m.download)?.last_updated;
    this._armTest(TEST_MS);
    this._update();
    return true;
  }

  // The end of the speed test the card started, drawn when its time is up (cleared when the card leaves the page).
  _armTest(ms) {
    clearTimeout(this._testTimer);
    this._testTimer = setTimeout(
      () => {
        this._testTimer = null;
        this._testing = null;
        this._update();
      },
      Math.max(0, ms),
    );
  }

  // A new result ends the test the card started.
  set hass(hass) {
    const m = this._model;
    if (this._testing && m && hass?.states?.[m.download]?.last_updated !== this._testedFrom) this._testing = null;
    super.hass = hass;
  }

  get hass() {
    return super.hass;
  }

  _render() {
    const { m, error } = this._ready();
    if (error) return error;
    const c = this._config;
    const sum = this._summary(m);
    const parts = [`<div class="hero">${this._gauge(m, sum)}${this._heroBody(m, sum)}</div>`];
    if (c.show_history !== false) parts.push(this._section("history", ICONS.chart, this._t("last_days", { n: Number(c.history_days) || 7 }), "", this._chart(sum)));
    if (c.show_stats !== false) parts.push(this._tiles(m, sum));
    const run = this._runButton(m, sum);
    if (run) parts.push(`<div class="foot">${run}${sum.last ? `<span class="note">${esc(this._t("last_test", { when: fmtRelative(this._hass, this._config, sum.last) }))}</span>` : ""}</div>`);
    return `<style>${BASE_STYLE}${SPEED_STYLE}${this._styles()}</style>
      <ha-card>
        ${this._head(sum, this._subtitle(m, sum))}
        <div class="content">${parts.filter(Boolean).join("")}</div>
      </ha-card>`;
  }
}

export class SpeedtestMiniCard extends withMini(SpeedtestCard) {
  static getConfigElement() {
    return document.createElement("speedtest-mini-card-editor");
  }

  _renderMini() {
    const { m, error } = this._ready();
    if (error) return error;
    const sum = this._summary(m);
    const cls = sum.status.cls === "warn" || sum.status.cls === "crit" ? sum.status.cls : "accent";
    const second = [m.upload ? `${this._speed(sum.ul)} ${this._t("mbps")}` : null, m.ping ? `${this._ms(sum.ping)} ${this._t("ms")}` : null].filter(Boolean).join(" · ");
    const run = this._runButton(m, sum, true);
    return `<style>${BASE_STYLE}${SPEED_STYLE}${MINI_STYLE}${this._styles()}</style>
      <ha-card>
        ${this._head(sum, "")}
        <div class="content mini">
          ${this._gauge(m, sum)}
          <div class="info">
            <div class="big ${cls} clickable"${moreInfo(m.download)}>${svgIcon(ICONS.download)}<b>${esc(this._speed(sum.dl))}</b><span>${esc(this._t("mbps"))}</span></div>
            ${second ? `<div class="line active">${svgIcon(ICONS.upload)}<span>${esc(second)}</span></div>` : ""}
          </div>
          ${run ? `<div class="controls">${run}</div>` : ""}
        </div>
      </ha-card>`;
  }
}
