// The README screenshots (PNG) and animations (GIF) rendered by scripts/screenshots.mjs.
// Every capture has a twin in the other theme ("-dark" for a light capture) that shows exactly the same state: only
// the theme differs (checked by test/screenshots.test.mjs). `variant` picks the mock data (scripts/mock-states.mjs).
const twins = (list) => list.flatMap((s) => [{ ...s, theme: "light" }, { ...s, file: `${s.file}-dark`, theme: "dark" }]);
const plan = { plan_download: 1000, plan_upload: 700 };

export const shots = twins([
  { file: "card", type: "speedtest-card", width: 460, config: plan },
  { file: "card-slow", type: "speedtest-card", width: 460, config: { ...plan, show_stats: false }, variant: "slow" },
  { file: "mini-card", type: "speedtest-mini-card", width: 380, config: plan },
  { file: "mini-card-slow", type: "speedtest-mini-card", width: 380, config: plan, variant: "slow" },
  { file: "mini-card-zoom", type: "speedtest-mini-card", width: 460, config: plan, clicks: [".zoom"] },
  // Narrow cards: the full card at 6 columns of a phone's Sections view and the mini card at its minimum width.
  { file: "card-narrow", type: "speedtest-card", width: 238, config: plan },
  { file: "mini-card-narrow", type: "speedtest-mini-card", width: 170, config: plan },
]);

// One looping GIF per distinct animated state:
//   testing — a test runs: a needle sweeps the gauge, the button's icon turns
export const gifs = twins([{ file: "testing", type: "speedtest-card", width: 460, config: { ...plan, show_history: false, show_stats: false }, clicks: ['[data-action="run"]'] }]);
