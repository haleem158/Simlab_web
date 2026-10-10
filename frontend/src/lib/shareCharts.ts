import type { Layer } from "@/components/sl/Chart";

/* Charts on screen register themselves here so the Share dialog can draw the
   very same chart (same data, axes and colors) onto the downloadable image. */

export interface ChartSpec {
  title: string;
  sub?: string;
  layers: Layer[];
  y: { min: number; max: number; ticks: number[]; fmt: (v: number) => string };
  xLabels: { f: number; text: string }[];
}

const reg = new Map<string, ChartSpec>();
const order = new Map<string, number>();

export function registerChart(spec: ChartSpec): () => void {
  if (!order.has(spec.title)) order.set(spec.title, order.size);
  reg.set(spec.title, spec);
  return () => {
    if (reg.get(spec.title) === spec) reg.delete(spec.title);
  };
}

export function listCharts(): ChartSpec[] {
  return Array.from(reg.values()).sort(
    (a, b) => order.get(a.title)! - order.get(b.title)!,
  );
}
