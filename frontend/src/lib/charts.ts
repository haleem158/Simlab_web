// Helpers shared by the simulator charts (ported from the approved mock).

const NICE = [1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10];

export function niceStep(raw: number): number {
  if (!(raw > 0)) return 1;
  const e = Math.pow(10, Math.floor(Math.log10(raw)));
  for (const m of NICE) if (m * e >= raw * 0.9999) return m * e;
  return 10 * e;
}

export type Axis = { min: number; max: number; ticks: number[] };

/** Five evenly spaced ticks from `min` up to a "nice" maximum that covers `maxValue`. */
export function axisFor(maxValue: number, min = 0): Axis {
  const step = niceStep((Math.max(maxValue, min + 1e-12) - min) / 4);
  return {
    min,
    max: min + 4 * step,
    ticks: [0, 1, 2, 3, 4].map((i) => min + i * step),
  };
}

const trim = (n: number, d = 2) => String(+n.toFixed(d));

/** 0, 0.4B, 250M, 12K ... */
export function compact(v: number): string {
  const a = Math.abs(v);
  if (a >= 1e9) return trim(v / 1e9) + "B";
  if (a >= 1e6) return trim(v / 1e6) + "M";
  if (a >= 1e3) return trim(v / 1e3) + "K";
  return trim(v);
}

export function priceLabel(v: number, step: number): string {
  if (v === 0) return "$0";
  return "$" + (step >= 0.01 ? v.toFixed(2) : v.toExponential(1));
}

export const percentLabel = (v: number) => trim(v) + "%";
export const indexLabel = (v: number) => v.toFixed(1);

export type KpiParts = { to: number; dec: number; pre: string; suf: string };

export function moneyParts(v: number): KpiParts {
  const a = Math.abs(v);
  if (a >= 1e9) return { to: v / 1e9, dec: 2, pre: "", suf: "B" };
  if (a >= 1e6)
    return { to: v / 1e6, dec: a >= 1e8 ? 0 : 1, pre: "", suf: "M" };
  if (a >= 1e3) return { to: v / 1e3, dec: 1, pre: "", suf: "K" };
  return { to: v, dec: 2, pre: "", suf: "" };
}

export function priceParts(v: number): KpiParts {
  const a = Math.abs(v);
  if (a > 0 && a < 1e-4) {
    // Very small prices read better in scientific form: $5.97e-8
    const exp = Math.floor(Math.log10(a));
    return { to: v / Math.pow(10, exp), dec: 2, pre: "$", suf: `e${exp}` };
  }
  const dec =
    a >= 0.01 || a === 0 ? 2 : Math.min(6, 2 - Math.floor(Math.log10(a)));
  return { to: v, dec, pre: "$", suf: "" };
}

export function pctDelta(x: number): string {
  return Math.abs(x) >= 100
    ? `${x >= 0 ? "+" : ""}${x.toFixed(0)}%`
    : `${x >= 0 ? "+" : ""}${x.toFixed(1)}%`;
}

/** Evenly chosen x labels: fractions of the chart width with their text. */
export function pickLabels(
  n: number,
  indices: number[],
  text: (i: number) => string,
) {
  return indices.map((i) => ({ f: n > 1 ? i / (n - 1) : 0, text: text(i) }));
}

export function csvDownload(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) return;
  const csv = [
    Object.keys(rows[0]).join(","),
    ...rows.map((r) => Object.values(r).join(",")),
  ].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function yearLabels(years: number) {
  const step = years <= 5 ? 1 : Math.ceil(years / 5);
  const out: { f: number; text: string }[] = [];
  for (let k = 0; k * step <= years + 1e-9; k++)
    out.push({
      f: years > 0 ? (k * step) / years : 0,
      text: `Year ${k * step}`,
    });
  return out;
}

export function monthLabels(n: number) {
  const step = 12 * Math.max(1, Math.ceil((n - 1) / 12 / 5));
  const idx: number[] = [];
  for (let i = 0; i < n - 1; i += step) idx.push(i);
  idx.push(n - 1);
  return idx.map((i) => ({ f: n > 1 ? i / (n - 1) : 0, text: `M${i}` }));
}

export function evenLabels(names: string[]) {
  const n = names.length;
  const idx: number[] = [];
  for (let k = 0; k < 5; k++) {
    const i = Math.floor((k * (n - 1)) / 4 + 0.5);
    if (!idx.includes(i)) idx.push(i);
  }
  return idx.map((i) => ({
    f: n > 1 ? i / (n - 1) : 0,
    text: names[i].slice(0, 7),
  }));
}

export const PALETTE = [
  "#6d4cf5",
  "#38bdf8",
  "#34d399",
  "#fbbf24",
  "#f87171",
  "#f472b6",
  "#22d3ee",
  "#a3e635",
  "#fb923c",
  "#c084fc",
];
