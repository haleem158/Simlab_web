import { LOGO_PATH, LOGO_VIEWBOX } from "@/components/sl/logo-path";
import type { KpiParts } from "./charts";
import { RUN_META, type NewRun } from "./runs";
import type { ChartSpec } from "./shareCharts";
import type { Layer } from "@/components/sl/Chart";

export const SHARE_W = 1200;
export const SHARE_H = 900;
const FONT = 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif';

export function fmtParts(p: KpiParts): string {
  const n = p.dec > 0 ? p.to.toFixed(p.dec) : Math.round(p.to).toLocaleString("en-US");
  return `${p.pre}${n}${p.suf}`;
}

type Ctx = CanvasRenderingContext2D;
type Pt = [number, number];

function rr(c: Ctx, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function text(c: Ctx, s: string, x: number, y: number, size: number, weight: number, color: string, align: CanvasTextAlign = "left") {
  c.font = `${weight} ${size}px ${FONT}`;
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = "alphabetic";
  c.fillText(s, x, y);
}

function fit(c: Ctx, s: string, weight: number, size: number, maxW: number) {
  let f = size;
  c.font = `${weight} ${f}px ${FONT}`;
  while (c.measureText(s).width > maxW && f > 24) {
    f -= 2;
    c.font = `${weight} ${f}px ${FONT}`;
  }
  return f;
}

// Same Catmull-Rom smoothing the on-screen chart uses.
function curve(c: Ctx, pts: Pt[], move = true) {
  if (move) c.moveTo(pts[0][0], pts[0][1]);
  else c.lineTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    c.bezierCurveTo(
      p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6,
      p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6,
      p2[0], p2[1],
    );
  }
}

function legendOf(layers: Layer[]) {
  const out: { color: string; text: string }[] = [];
  layers.forEach((l) => {
    if (l.type === "stack") l.layers.forEach((s) => out.push({ color: s.color, text: s.name }));
    else if (l.name) out.push({ color: l.color, text: l.name });
  });
  return out;
}

function drawChart(c: Ctx, spec: ChartSpec, x: number, y: number, w: number, h: number) {
  rr(c, x, y, w, h, 24);
  c.fillStyle = "#0a0a0c";
  c.fill();
  c.strokeStyle = "#1f1f23";
  c.lineWidth = 2;
  c.stroke();

  text(c, spec.title, x + 32, y + 46, 24, 600, "#f5f5f7");
  if (spec.sub) text(c, spec.sub, x + 32, y + 74, 15, 400, "#8b8b95");

  // legend, right aligned
  const lg = legendOf(spec.layers);
  let lx = x + w - 32;
  c.font = `500 15px ${FONT}`;
  for (let i = lg.length - 1; i >= 0; i--) {
    const tw = c.measureText(lg[i].text).width;
    text(c, lg[i].text, lx, y + 46, 15, 500, "#c4c4cc", "right");
    lx -= tw + 14;
    c.fillStyle = lg[i].color;
    c.beginPath();
    c.arc(lx, y + 41, 5, 0, Math.PI * 2);
    c.fill();
    lx -= 26;
  }

  const X0 = x + 90;
  const X1 = x + w - 34;
  const Y0 = y + (spec.sub ? 106 : 90);
  const Y1 = y + h - 56;
  const { y: ax } = { y: spec.y };
  const sy = (v: number) => Y1 - ((Y1 - Y0) * (v - ax.min)) / (ax.max - ax.min || 1);

  ax.ticks.forEach((t, k) => {
    const yy = Y1 - ((Y1 - Y0) * k) / (ax.ticks.length - 1);
    c.strokeStyle = "#1a1a1e";
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(X0, yy);
    c.lineTo(X1, yy);
    c.stroke();
    text(c, ax.fmt(t), X0 - 14, yy + 5, 15, 400, "#71717a", "right");
  });

  // x labels (thinned like the on-screen chart)
  const px = (f: number) => X0 + (X1 - X0) * f;
  const shown: typeof spec.xLabels = [];
  spec.xLabels.forEach((l, i) => {
    if (i === 0 || i === spec.xLabels.length - 1) return void shown.push(l);
    if (px(l.f) - px(shown[shown.length - 1].f) >= 110 && X1 - px(l.f) >= 110) shown.push(l);
  });
  if (shown.length > 2 && spec.xLabels.length > 2) {
    const last = shown.pop()!;
    if (px(last.f) - px(shown[shown.length - 1].f) < 110) shown.pop();
    shown.push(last);
  }
  shown.forEach((l, i) =>
    text(c, l.text, px(l.f), Y1 + 34, 15, 400, "#71717a", i === 0 ? "left" : i === shown.length - 1 ? "right" : "center"),
  );

  const first = spec.layers[0];
  const n =
    first.type === "stack" ? first.layers[0].values.length : first.type === "band" ? first.lo.length : first.values.length;
  const sx = (i: number) => X0 + ((X1 - X0) * i) / Math.max(n - 1, 1);

  c.save();
  c.beginPath();
  c.rect(X0 - 2, Y0 - 6, X1 - X0 + 4, Y1 - Y0 + 12);
  c.clip();
  const shape = (top: number[], base: number[], color: string, alpha: number) => {
    const up: Pt[] = top.map((v, i) => [sx(i), sy(v)]);
    const dn: Pt[] = base.map((v, i) => [sx(i), sy(v)] as Pt).reverse();
    c.beginPath();
    curve(c, up);
    curve(c, dn, false);
    c.closePath();
    c.globalAlpha = alpha;
    c.fillStyle = color;
    c.fill();
    c.globalAlpha = 1;
  };
  spec.layers.forEach((l) => {
    if (l.type === "line") {
      const pts: Pt[] = l.values.map((v, i) => [sx(i), sy(v)]);
      if (l.fill) {
        c.beginPath();
        curve(c, pts);
        c.lineTo(pts[pts.length - 1][0], Y1);
        c.lineTo(pts[0][0], Y1);
        c.closePath();
        c.globalAlpha = l.fill;
        c.fillStyle = l.color;
        c.fill();
        c.globalAlpha = 1;
      }
      c.beginPath();
      curve(c, pts);
      c.strokeStyle = l.color;
      c.lineWidth = (l.w ?? 2.2) * 1.6;
      c.lineJoin = "round";
      c.setLineDash(l.dash ? [8, 8] : []);
      c.stroke();
      c.setLineDash([]);
    } else if (l.type === "band") {
      shape(l.hi, l.lo, l.color, 0.14);
    } else if (l.type === "stack") {
      let base = new Array(n).fill(0) as number[];
      l.layers.forEach((s) => {
        const top = base.map((b, i) => b + s.values[i]);
        shape(top, base, s.color, 0.85);
        base = top;
      });
    } else {
      const bw = ((X1 - X0) / n) * 0.62;
      c.fillStyle = l.color;
      l.values.forEach((v, i) => {
        const bx = X0 + ((X1 - X0) * (i + 0.5)) / n - bw / 2;
        const yy = sy(v);
        rr(c, bx, yy, bw, Math.max(Y1 - yy, 0), 2);
        c.fill();
      });
    }
  });
  c.restore();
}

export async function renderShareCard(run: NewRun, host: string, chart: ChartSpec | null): Promise<Blob> {
  try {
    await Promise.all([
      document.fonts.load(`400 16px Inter`),
      document.fonts.load(`500 16px Inter`),
      document.fonts.load(`600 16px Inter`),
      document.fonts.load(`700 16px Inter`),
    ]);
  } catch {}
  const S = 2;
  const cv = document.createElement("canvas");
  cv.width = SHARE_W * S;
  cv.height = SHARE_H * S;
  const c = cv.getContext("2d")!;
  c.scale(S, S);
  const meta = RUN_META[run.type];

  c.fillStyle = "#000";
  c.fillRect(0, 0, SHARE_W, SHARE_H);
  const glow = c.createRadialGradient(1000, 0, 0, 1000, 0, 700);
  glow.addColorStop(0, "rgba(167,139,250,0.20)");
  glow.addColorStop(1, "rgba(167,139,250,0)");
  c.fillStyle = glow;
  c.fillRect(0, 0, SHARE_W, SHARE_H);

  // brand row
  const [, , lw, lh] = LOGO_VIEWBOX.split(" ").map(Number);
  c.save();
  c.translate(56, 44);
  const k = 38 / lh;
  c.scale(k, k);
  c.fillStyle = "#fff";
  c.fill(new Path2D(LOGO_PATH), "evenodd");
  c.restore();
  text(c, "Simlab", 56 + (38 * lw) / lh + 14, 72, 26, 700, "#fff");
  c.font = `600 15px ${FONT}`;
  const pw = c.measureText(meta.name).width + 36;
  rr(c, SHARE_W - 56 - pw, 44, pw, 38, 19);
  c.fillStyle = "rgba(167,139,250,0.14)";
  c.fill();
  c.strokeStyle = "rgba(167,139,250,0.45)";
  c.lineWidth = 1.5;
  c.stroke();
  text(c, meta.name, SHARE_W - 56 - pw / 2, 69, 15, 600, "#c4b5fd", "center");

  // headline
  text(c, run.headline.label, 56, 140, 20, 500, "#8b8b95");
  const hv = fmtParts(run.headline.parts);
  const fs = fit(c, hv, 700, 76, 700);
  text(c, hv, 56, 140 + fs * 0.95, fs, 700, "#fff");
  const hw = c.measureText(hv).width;
  const good = run.delta.tone === "g";
  c.font = `600 18px ${FONT}`;
  const dw = c.measureText(run.delta.text).width + 32;
  rr(c, 56 + hw + 24, 140 + fs * 0.95 - 34, dw, 40, 20);
  c.fillStyle = good ? "rgba(52,211,153,0.14)" : "rgba(248,113,113,0.14)";
  c.fill();
  text(c, run.delta.text, 56 + hw + 24 + dw / 2, 140 + fs * 0.95 - 7, 18, 600, good ? "#34d399" : "#f87171", "center");

  // chart (falls back to the sparkline if the page has no registered chart)
  const CY = 262;
  const CH = 372;
  if (chart) {
    drawChart(c, chart, 56, CY, SHARE_W - 112, CH);
  } else {
    drawChart(
      c,
      {
        title: run.headline.label,
        layers: [{ type: "line", values: run.spark, color: "#a78bfa", fill: 0.16, w: 2.4 }],
        y: {
          min: Math.min(...run.spark),
          max: Math.max(...run.spark),
          ticks: [0, 1, 2, 3, 4].map((i) => Math.min(...run.spark) + ((Math.max(...run.spark) - Math.min(...run.spark)) * i) / 4),
          fmt: () => "",
        },
        xLabels: [],
      },
      56, CY, SHARE_W - 112, CH,
    );
  }

  // metric tiles
  const tiles = run.metrics.slice(0, 4);
  const TY = 662;
  const gap = 16;
  const tw = (SHARE_W - 112 - gap * (tiles.length - 1)) / Math.max(tiles.length, 1);
  tiles.forEach((m, i) => {
    const tx = 56 + i * (tw + gap);
    rr(c, tx, TY, tw, 108, 18);
    c.fillStyle = "#0a0a0c";
    c.fill();
    c.strokeStyle = "#1f1f23";
    c.lineWidth = 2;
    c.stroke();
    text(c, m.label, tx + 22, TY + 34, 15, 500, "#8b8b95");
    const v = fmtParts(m.parts);
    const f = fit(c, v, 700, 34, tw - 44);
    text(c, v, tx + 22, TY + 74, f, 700, "#fff");
    if (m.sub) {
      c.font = `500 14px ${FONT}`;
      let sub = m.sub;
      while (c.measureText(sub).width > tw - 44 && sub.length > 4) sub = sub.slice(0, -2);
      if (sub !== m.sub) sub = sub.trimEnd() + "…";
      text(c, sub, tx + 22, TY + 98, 14, 500, m.tone === "r" ? "#f87171" : m.tone === "g" ? "#34d399" : "#8b8b95");
    }
  });

  // settings + footer
  const line = run.details.slice(0, 5).map((d) => `${d.label} ${d.value}`).join("   ·   ");
  c.font = `400 15px ${FONT}`;
  let sl = line;
  while (c.measureText(sl).width > SHARE_W - 112 && sl.length > 10) sl = sl.slice(0, -2);
  if (sl !== line) sl += "…";
  text(c, sl, 56, 818, 15, 400, "#8b8b95");
  c.strokeStyle = "#1a1a1e";
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(56, 836);
  c.lineTo(SHARE_W - 56, 836);
  c.stroke();
  text(c, "Simulated with Simlab. Not financial advice.", 56, 870, 15, 400, "#71717a");
  text(c, host, SHARE_W - 56, 870, 17, 600, "#c4b5fd", "right");

  return new Promise((res, rej) => cv.toBlob((b) => (b ? res(b) : rej(new Error("png failed"))), "image/png"));
}
