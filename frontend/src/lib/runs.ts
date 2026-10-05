import { useSyncExternalStore } from "react";
import { moneyParts, pctDelta, priceParts, type KpiParts } from "./charts";

/* Runs are kept in this browser only (localStorage). Nothing is sent to a server. */

export type RunType = "supply" | "vesting" | "impact";
export type Tone = "g" | "r";

export interface RunMetric {
  label: string;
  parts: KpiParts;
  sub?: string;
  tone?: Tone;
}

export interface RunRecord {
  id: string;
  type: RunType;
  ts: number;
  headline: { label: string; parts: KpiParts };
  delta: { text: string; tone: Tone };
  spark: number[];
  metrics: RunMetric[];
  details: { label: string; value: string }[];
  params: Record<string, unknown>;
}
export type NewRun = Omit<RunRecord, "id" | "ts">;

export const RUN_META: Record<
  RunType,
  { name: string; model: string; href: string; icon: string; color: string }
> = {
  supply: {
    name: "Token Supply",
    model: "Supply model",
    href: "/token-supply",
    icon: "coins",
    color: "#3b2f7a",
  },
  vesting: {
    name: "Vesting",
    model: "Unlock model",
    href: "/vesting",
    icon: "cal",
    color: "#7c2d2d",
  },
  impact: {
    name: "Price Impact",
    model: "Market model",
    href: "/token-impact",
    icon: "down",
    color: "#5b35c9",
  },
};

const KEY = "simlab:runs:v1";
const MAX = 20;
const EMPTY: RunRecord[] = [];
const listeners = new Set<() => void>();
let cacheRaw: string | null = null;
let cacheVal: RunRecord[] = EMPTY;

function read(): RunRecord[] {
  if (typeof window === "undefined") return EMPTY;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cacheRaw) return cacheVal;
  cacheRaw = raw;
  try {
    cacheVal = raw ? (JSON.parse(raw) as RunRecord[]) : EMPTY;
  } catch {
    cacheVal = EMPTY;
  }
  return cacheVal;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => e.key === KEY && cb();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useRuns(): RunRecord[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function saveRun(run: NewRun): void {
  try {
    const rec: RunRecord = {
      ...run,
      id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      ts: Date.now(),
    };
    window.localStorage.setItem(
      KEY,
      JSON.stringify([rec, ...read()].slice(0, MAX)),
    );
    listeners.forEach((l) => l());
  } catch {
    /* storage full or blocked: the run simply isn't remembered */
  }
}

export function getRun(id: string | null): RunRecord | undefined {
  return id ? read().find((r) => r.id === id) : undefined;
}

export function clearRuns(): void {
  try {
    window.localStorage.removeItem(KEY);
    listeners.forEach((l) => l());
  } catch {
    /* ignore */
  }
}

export function timeAgo(ts: number, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.round(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

/* ---------- builders (shared by the simulator pages and the test fixtures) ---------- */

function downsample(a: number[], n = 60): number[] {
  if (a.length <= n) return a;
  return Array.from(
    { length: n },
    (_, i) => a[Math.round((i * (a.length - 1)) / (n - 1))],
  );
}
const num = (v: unknown) => Number(v);
const fmtInt = (v: number) => Math.round(v).toLocaleString("en-US");
const pct1 = (v: number) => `${(v * 100).toFixed(1)}%`;

export function supplyRecord(p: any, r: { mc?: any; det?: any }): NewRun {
  const mc = !!r.mc;
  const rows: any[] = mc ? r.mc.aggregated_data : r.det.data;
  const s = mc ? r.mc.summary : r.det.summary;
  const circ = rows.map(
    (x) => (mc ? x.circulating_mean : x.circulating) as number,
  );
  const fc = mc ? s.final_circulating_mean : s.final_circulating;
  const fb = mc ? s.final_burned_mean : s.final_burned;
  const fs = mc ? rows[rows.length - 1].staked_mean : s.final_staked;
  const fp = mc ? s.final_price_mean : s.final_price;
  const p0 = mc ? rows[0].price_mean : rows[0].price;
  const years = mc
    ? (r.mc.metadata?.total_months ?? rows.length - 1) / 12
    : (s.effective_years ?? (rows.length - 1) / 12);
  const d = (fc / circ[0] - 1) * 100;
  const yr = +years.toFixed(1);
  return {
    type: "supply",
    headline: { label: "Final circulating", parts: moneyParts(fc) },
    delta: { text: `${pctDelta(d)} vs. start`, tone: d >= 0 ? "g" : "r" },
    spark: downsample(circ),
    metrics: [
      {
        label: "Final burned",
        parts: moneyParts(fb),
        sub: `${((fb / num(p.total_supply)) * 100).toFixed(1)}% of supply`,
      },
      {
        label: "Final staked",
        parts: moneyParts(fs),
        sub: `${((fs / fc) * 100).toFixed(1)}% of circulating`,
      },
      {
        label: "Final price",
        parts: priceParts(fp),
        sub: `${pctDelta((fp / p0 - 1) * 100)} vs. start`,
        tone: fp >= p0 ? "g" : "r",
      },
      {
        label: "Horizon",
        parts: {
          to: yr,
          dec: Number.isInteger(yr) ? 0 : 1,
          pre: "",
          suf: " years",
        },
        sub: mc ? `Monte Carlo, ${s.total_runs} runs` : "Single run",
      },
    ],
    details: [
      { label: "Total supply", value: fmtInt(num(p.total_supply)) },
      { label: "Initial supply", value: fmtInt(num(p.initial_supply)) },
      { label: "Annual inflation", value: pct1(num(p.annual_inflation_rate)) },
      { label: "Staking rate", value: pct1(num(p.staking_rate)) },
      { label: "Annual burn", value: pct1(num(p.burn_rate)) },
      {
        label: "Mode",
        value: mc ? `Monte Carlo, ${s.total_runs} runs` : "Single run",
      },
    ],
    params: p,
  };
}

export function vestingRecord(p: any, r: any): NewRun {
  const d: any[] = r.data;
  const s = r.summary;
  const supply = num(p.total_supply) || 1;
  const roles: any[] = p.roles ?? [];
  return {
    type: "vesting",
    headline: {
      label: "Circulating at end",
      parts: moneyParts(s.final_effective_circulating),
    },
    delta: {
      text: `${((s.final_effective_circulating / supply) * 100).toFixed(1)}% of supply`,
      tone: "g",
    },
    spark: downsample(d.map((x) => x.effective_circulating as number)),
    metrics: [
      {
        label: "Total unlocked",
        parts: moneyParts(s.final_cumulative_unlocked),
        sub: `${((s.final_cumulative_unlocked / supply) * 100).toFixed(1)}% of supply`,
      },
      {
        label: "Gov locked",
        parts: moneyParts(s.final_governance_locked),
        sub: `${s.final_cumulative_unlocked ? ((s.final_governance_locked / s.final_cumulative_unlocked) * 100).toFixed(1) : "0.0"}% of unlocked`,
      },
      {
        label: "Present value",
        parts: moneyParts(s.pv_unlocked),
        sub: `At ${Math.round(num(p.annual_discount_rate ?? 0.1) * 100)}% discount rate`,
      },
      {
        label: "Roles",
        parts: { to: roles.length, dec: 0, pre: "", suf: "" },
        sub: roles
          .map((x) => x.name)
          .slice(0, 4)
          .join(", "),
      },
    ],
    details: [
      { label: "Total supply", value: fmtInt(supply) },
      { label: "Months simulated", value: String(d.length) },
      { label: "Roles", value: String(roles.length) },
      {
        label: "Allocated",
        value: `${+roles.reduce((a, x) => a + num(x.allocation_pct), 0).toFixed(1)}%`,
      },
      {
        label: "Discount rate",
        value: `${Math.round(num(p.annual_discount_rate ?? 0.1) * 100)}%`,
      },
      { label: "Random noise", value: p.stochastic ? "On" : "Off" },
    ],
    params: p,
  };
}

export function impactRecord(p: any, r: any): NewRun {
  const d: any[] = r.data;
  const s = r.summary;
  const anchor =
    p.calibrate && p.anchor_mode === "current_price" && p.anchor_price
      ? num(p.anchor_price)
      : null;
  const price = d.map((x) => x.indicative_price as number);
  const mc: any[] | null = r.mc && r.mc.length ? r.mc : null;
  const ref = anchor ?? price[0];
  const dp = (s.final_price / ref - 1) * 100;
  const supplyDelta =
    (d[d.length - 1].effective_supply / d[0].effective_supply - 1) * 100;
  const dem = d[d.length - 1].demand_index / d[0].demand_index - 1;
  return {
    type: "impact",
    headline: { label: "Final price", parts: priceParts(s.final_price) },
    delta: {
      text: `${pctDelta(dp)} ${anchor ? "vs. anchor" : "vs. start"}`,
      tone: dp >= 0 ? "g" : "r",
    },
    spark: downsample(mc ? mc.map((x) => x.price_median as number) : price),
    metrics: [
      {
        label: "Final supply",
        parts: moneyParts(s.final_effective_supply),
        sub: `${pctDelta(supplyDelta)} vs. start`,
        tone: supplyDelta >= 0 ? "g" : "r",
      },
      {
        label: "Demand index",
        parts: { to: s.final_demand_index, dec: 2, pre: "", suf: "" },
        sub: `${pctDelta(dem * 100)} vs. start`,
        tone: dem >= 0 ? "g" : "r",
      },
      {
        label: "Months of data",
        parts: { to: d.length, dec: 0, pre: "", suf: "" },
      },
      {
        label: "Uncertainty",
        parts: {
          to: mc ? num(p.mc_runs) : 0,
          dec: 0,
          pre: "",
          suf: mc ? " runs" : " (off)",
        },
        sub: mc ? "Median and P25 to P75 band" : "Single deterministic path",
      },
    ],
    details: [
      {
        label: "Initial circulating",
        value: fmtInt(num(p.initial_circ_supply)),
      },
      { label: "Transaction base", value: String(p.V0_tx) },
      { label: "Staking base", value: String(p.V0_stake) },
      { label: "Transaction weight (α)", value: num(p.alpha).toFixed(2) },
      { label: "Supply elasticity (ε)", value: num(p.epsilon).toFixed(2) },
      {
        label: "Calibration",
        value: p.calibrate
          ? anchor
            ? `Anchor $${anchor}`
            : p.anchor_mode === "current_market_cap"
              ? "Market cap"
              : "On"
          : "Off",
      },
    ],
    params: p,
  };
}
