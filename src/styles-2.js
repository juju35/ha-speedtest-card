// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

export const SPEED_STYLE = `
  .hero-art.gauge { width: 120px; }
  .gauge .track { stroke: color-mix(in srgb, var(--primary-text-color) 12%, transparent); }
  .gauge .arc { stroke: var(--c, var(--st-accent)); transition: stroke-dashoffset .6s ease; }
  .gauge .mark { stroke: var(--secondary-text-color); }
  .gauge .needle { transform-box: view-box; transform-origin: 60px 70px; transition: transform .6s ease; }
  .gauge .needle line { stroke: var(--primary-text-color); opacity: .75; }
  .gauge .hub { fill: var(--primary-text-color); opacity: .75; }
  .gauge .box { fill: color-mix(in srgb, var(--primary-text-color) 7%, transparent); stroke: color-mix(in srgb, var(--primary-text-color) 22%, transparent); }
  .gauge .led { fill: var(--st-ok); } .gauge.testing .led.blink { fill: var(--st-warn); }
  .gauge.testing .arc { opacity: .35; }
  .gauge.testing .needle { animation: st-sweep 1.6s ease-in-out infinite alternate; }
  .gauge.testing .led.blink { animation: st-blink .8s steps(2, jump-none) infinite; }
  @keyframes st-sweep { from { transform: rotate(0deg); } to { transform: rotate(180deg); } }
  @keyframes st-blink { from { opacity: 1; } to { opacity: .2; } }
  .big.accent .icon { color: var(--st-accent); }
  .big.warn b, .big.crit b { color: color-mix(in srgb, var(--c) 60%, var(--primary-text-color)); }
  .chart svg { display: block; width: 100%; height: auto; overflow: visible; }
  .chart .dl { stroke: var(--st-accent); } .chart .area { fill: var(--st-accent); fill-opacity: .12; }
  .chart .ul { stroke: var(--st-active); }
  .chart .grid { stroke: var(--divider-color, rgba(127,127,127,.25)); }
  .chart .plan { stroke: var(--secondary-text-color); stroke-dasharray: 4 4; }
  .chart .dip { fill: var(--st-warn); }
  .chart text { fill: var(--secondary-text-color); font-size: 11px; font-family: inherit; }
  .xaxis { display: flex; justify-content: space-between; font-size: 11px; color: var(--secondary-text-color); margin-top: 4px; }
  .legend { display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: 12px; color: var(--secondary-text-color); margin-top: 6px; align-items: center; }
  .legend .k { display: inline-flex; align-items: center; gap: 6px; }
  .legend .sw { width: 14px; height: 3px; border-radius: 2px; background: var(--c); }
  .legend .dipnote { margin-left: auto; color: color-mix(in srgb, var(--st-warn) 60%, var(--primary-text-color)); display: inline-flex; gap: 4px; align-items: center; }
  .legend .dipnote .icon { width: 14px; height: 14px; color: var(--st-warn); }
  .tile .row-name small { font-size: 11px; font-weight: 400; color: var(--secondary-text-color); margin-left: 3px; }
  .foot { display: flex; align-items: center; gap: 10px; min-width: 0; }
  .foot .note { font-size: 12px; color: var(--secondary-text-color); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .spin .icon { animation: st-spin 1s linear infinite; }
  @keyframes st-spin { to { transform: rotate(360deg); } }
  .mini .hero-art.gauge { width: 76px; }
  .mini .big b { font-size: 26px; }
  .banner.mini-banner { --st-scene-w: min(210px, 50cqw); }
  @container (max-width: 300px) {
    .hero { flex-direction: column; align-items: stretch; gap: 8px; }
    .hero-art.gauge { align-self: center; }
    .tiles { --cols: 1 !important; }
    .foot .note { display: none; }
    .legend .dipnote { margin-left: 0; }
  }
  @container (max-width: 200px) {
    .mini .hero-art.gauge { display: none; }
  }
`;
