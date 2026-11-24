// ---------------------------------------------------------------------------
// Illustrated header
// ---------------------------------------------------------------------------

// The banner's picture, 240 × 80 at the right of the banner, standing on its 10 px lawn strip: the card's own gauge
// on the ground at the left (its box is the modem), a fibre line on poles over the hills down to a house, light
// pulses running along it (fast while a test runs, amber and sparse when the line is slow, none without a result).
// The left of the banner is sky: the title sits there. `uid` keeps each card's ids apart on a page.
export const ST_STARS = [
  [12, 8],
  [44, 18],
  [96, 6],
  [132, 24],
  [178, 10],
  [222, 30],
  [70, 30],
  [204, 4],
];
export const ST_LINE = "M56 74 Q70 66 92 36 Q117 46 142 36 Q167 46 192 36 Q204 44 212 58";
export const stSceneSvg = (uid, gauge) => {
  const stars = ST_STARS.map(([x, y], i) => `<circle class="st-star${i % 3 ? "" : " tw"}" cx="${x}" cy="${y}" r=".7"/>`).join("");
  const poles = [92, 142, 192].map((x) => `<line x1="${x}" y1="78" x2="${x}" y2="34"/><line x1="${x - 4}" y1="36" x2="${x + 4}" y2="36"/>`).join("");
  return `<svg class="st-scene" viewBox="0 0 240 80" preserveAspectRatio="xMaxYMax meet" aria-hidden="true" focusable="false">
    <defs><radialGradient id="st-glow-${uid}"><stop offset="0" stop-color="#ffd27a" stop-opacity=".75"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient></defs>
    <g class="st-day"><circle class="st-sun halo" cx="160" cy="14" r="9"/><circle class="st-sun" cx="160" cy="14" r="6"/></g>
    <g class="st-night">${stars}<circle class="st-moon" cx="160" cy="14" r="5.5"/><circle class="st-moon-cut" cx="162.5" cy="12" r="4.5"/></g>
    <path class="st-hill far" d="M0 80C30 70 60 64 100 66C140 68 170 60 240 61V80Z"/>
    <path class="st-hill" d="M0 80C40 74 90 75 240 71V80Z"/>
    <g class="st-poles">${poles}</g>
    <path class="st-cable" d="${ST_LINE}"/>
    <path class="st-pulse" d="${ST_LINE}"/>
    <g class="st-house" transform="translate(208 52)">
      <circle class="st-glow" cx="8" cy="10" r="10" fill="url(#st-glow-${uid})"/>
      <rect class="st-wall" width="26" height="28"/><path class="st-roof" d="M-3 1L13-10L29 1Z"/>
      <rect class="st-win" x="4" y="7" width="7" height="6" rx=".6"/><rect class="st-door" x="15" y="15" width="7" height="13"/>
    </g>
    <svg class="st-gauge ${gauge.cls}" x="2" y="27.5" width="70" height="52.5" viewBox="8 18 104 78" overflow="visible">
      <path class="face" d="M8 70A52 52 0 0 1 112 70Z"/>${gauge.art}
    </svg>
  </svg>`;
};

// Night picture: forced by illustration_theme, else Home Assistant's dark theme alone (a light theme keeps the day
// picture after sunset).
export const stIsNight = (hass, config) => {
  const theme = config?.illustration_theme;
  if (theme === "night") return true;
  if (theme === "day") return false;
  return !!hass?.themes?.darkMode;
};

// The banner's ground strip (the lawn), that the title block keeps clear of, and the gap between the title and the
// status pill on its row (.trow).
export const PILL_GROUND_PX = 10;
export const PILL_GAP_PX = 8;

export const ST_BANNER_STYLE = `
  .banner { position: relative; overflow: hidden; height: 90px; color: #0d2a45; --st-scene-w: min(224px, 46cqw);
            background: linear-gradient(90deg, #f1f8ff 0%, #e2f1fd 34%, #b9def8 70%, #9fd0f3 100%); }
  .banner.night { color: #fff; background: linear-gradient(90deg, #1b2f52 0%, #15284a 36%, #0f1f3d 72%, #0a1830 100%); }
  /* The ground: a 10 px lawn strip under the whole banner, edge to edge. */
  .st-ground { position: absolute; left: 0; right: 0; bottom: 0; height: 10px; background: repeating-linear-gradient(90deg, #5aa83d 0 22px, #6cbb4c 22px 44px); }
  .night .st-ground { background: repeating-linear-gradient(90deg, #1f4a2a 0 22px, #245433 22px 44px); }
  .st-scene { position: absolute; right: 0; bottom: 10px; width: var(--st-scene-w); height: 80px; overflow: visible; }
  .htext { position: absolute; left: 12px; top: 0; bottom: 10px; right: calc(var(--st-scene-w) + 4px); display: flex; align-items: center; gap: 10px; min-width: 0; }
  /* Title row: the title, then the status pill 8 px after it (in the icon's colour, see .trow); the subtitle under. */
  .htext .titles { flex: 1 1 auto; min-width: 0; justify-content: center; gap: 1px; }
  .banner .name { font-weight: 600; }
  .banner .sub { color: #3b5b78; }
  .banner.night .sub { color: rgba(255,255,255,.78); }
  /* The round icon on the sky, tinted by the status: accent when all is well, blue while testing, amber when slow, red without a result. */
  .banner .type-icon { background: rgba(255,255,255,.62); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--st-tint) 25%, transparent); }
  .banner .type-icon .icon { fill: color-mix(in srgb, var(--st-tint) 82%, #0d2a45); }
  .banner.night .type-icon { background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.14); }
  .banner.night .type-icon .icon { fill: color-mix(in srgb, var(--st-tint) 62%, #fff); }
  .banner .chip { line-height: 16px;
                  background: color-mix(in srgb, var(--c) 18%, rgba(255,255,255,.78)); color: color-mix(in srgb, var(--c) 45%, #0d2a45); }
  .banner.night .chip { background: color-mix(in srgb, var(--c) 30%, rgba(8,18,38,.55)); color: color-mix(in srgb, var(--c) 35%, #ffffff); }
  .banner .chip .dot { width: 7px; height: 7px; }
  /* The expand / collapse button: 24 px, round, frosted, in the banner's top right corner. */
  .banner .zoom { position: absolute; z-index: 2; top: 5px; right: 5px; width: 24px; height: 24px; margin: 0; color: #33506b;
                  background: rgba(255,255,255,.55); box-shadow: inset 0 0 0 1px rgba(255,255,255,.7);
                  -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px); }
  .banner .zoom:hover { background: rgba(255,255,255,.75); color: #33506b; }
  .banner.night .zoom { color: #fff; background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); }
  .banner.night .zoom:hover { background: rgba(255,255,255,.22); color: #fff; }
  .st-night, .night .st-day { display: none; }
  .night .st-night { display: inline; }
  .st-sun { fill: #ffd65a; } .st-sun.halo { opacity: .28; }
  .st-star { fill: #fff; opacity: .8; } .st-star.tw { animation: st-twinkle 3.2s ease-in-out infinite alternate; }
  .st-moon { fill: #f3eed2; } .st-moon-cut { fill: #13254a; }
  .st-hill { fill: #86c27f; } .st-hill.far { fill: #a7d39f; }
  .night .st-hill { fill: #17303d; } .night .st-hill.far { fill: #1d3a4a; }
  .st-poles { stroke: #8a939c; stroke-width: 1.2; } .night .st-poles { stroke: #7d8793; }
  .st-cable { stroke: #5f6b7a; stroke-width: 1.6; fill: none; } .night .st-cable { stroke: #4a5568; }
  .st-pulse { stroke: #2fd0ff; stroke-width: 1.8; fill: none; stroke-linecap: round; stroke-dasharray: 4 26; animation: st-pulse 1.4s linear infinite; }
  .st-testing .st-pulse { stroke-dasharray: 6 12; animation-duration: .6s; }
  .st-warn .st-pulse { stroke: #ffb02e; stroke-dasharray: 3 45; animation-duration: 3.2s; }
  .st-crit .st-pulse { display: none; }
  .st-crit .st-cable { stroke-dasharray: 3 3; }
  .st-wall { fill: #f3e6d3; } .night .st-wall { fill: #2a3646; }
  .st-roof { fill: #c0603a; } .night .st-roof { fill: #3a2a2a; }
  .st-win { fill: #86b9de; } .night .st-win { fill: #ffcf6e; }
  .st-door { fill: #8a5a3a; }
  .st-glow { display: none; } .night .st-glow { display: inline; }
  /* The gauge on the ground keeps the card's drawing, inked for the sky behind it. */
  .st-gauge { --primary-text-color: #1d3550; --secondary-text-color: #4a6680; }
  .night .st-gauge { --primary-text-color: #e8eef6; --secondary-text-color: #a9b8c8; }
  .st-gauge .face { fill: rgba(255,255,255,.55); } .night .st-gauge .face { fill: rgba(255,255,255,.08); }
  .st-gauge .box { fill: #eef2f6; } .night .st-gauge .box { fill: #2c3a4e; }
  /* The gauge sits in the banner: the hero shows its text alone, unless the card is too narrow for the picture. */
  .banner ~ .content .hero-art.gauge { display: none; }
  @keyframes st-pulse { to { stroke-dashoffset: -30; } }
  @keyframes st-twinkle { from { opacity: .3; } to { opacity: .9; } }
  @container (max-width: 300px) {
    .st-scene { display: none; }
    .htext { right: 36px; }
    .banner ~ .content .hero-art.gauge { display: grid; }
  }
  @container (max-width: 200px) {
    .banner ~ .content.mini .hero-art.gauge { display: none; }
  }
`;
