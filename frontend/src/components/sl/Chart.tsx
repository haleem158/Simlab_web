"use client";

import { useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/lib/useIsMobile";
import { registerChart } from "@/lib/shareCharts";

export type Layer =
  | {
      type: "line";
      name?: string;
      values: number[];
      color: string;
      fill?: number;
      dash?: boolean;
      w?: number;
    }
  | { type: "band"; name?: string; lo: number[]; hi: number[]; color: string }
  | {
      type: "stack";
      layers: { name: string; values: number[]; color: string }[];
    }
  | { type: "bars"; name?: string; values: number[]; color: string };

type Props = {
  layers: Layer[];
  y: { min: number; max: number; ticks: number[]; fmt: (v: number) => string };
  xLabels: { f: number; text: string }[];
  xName: (i: number) => string;
  valueFmt: (v: number) => string;
  defaultWidth: number;
  height?: number;
  label: string;
  plain?: boolean;
  /** Makes this chart available in the Share dialog. */
  share?: { title: string; sub?: string };
};

type Pt = [number, number];

function smooth(pts: Pt[]): string {
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}
const tail = (d: string) => d.slice(d.indexOf(" C"));

export function Chart({
  layers,
  y,
  xLabels,
  xName,
  valueFmt,
  defaultWidth,
  height = 250,
  label,
  plain,
  share,
}: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(defaultWidth);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const w = Math.round(entries[0].contentRect.width);
      if (w > 120) setW(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!share) return;
    return registerChart({
      title: share.title,
      sub: share.sub,
      layers,
      y,
      xLabels,
    });
  });

  const mobile = useIsMobile();
  const H = mobile ? height - 40 : height;
  const X0 = 54;
  const X1 = W - 8;
  const Y0 = 10;
  const Y1 = H - 28;
  const sx = (i: number, n: number) =>
    X0 + ((X1 - X0) * i) / Math.max(n - 1, 1);
  const sy = (v: number) =>
    Y1 - ((Y1 - Y0) * (v - y.min)) / (y.max - y.min || 1);

  const shownLabels = (() => {
    const gap = 64;
    const px = (f: number) => X0 + (X1 - X0) * f;
    const out: typeof xLabels = [];
    xLabels.forEach((l, i) => {
      if (i === 0 || i === xLabels.length - 1) return void out.push(l);
      const prev = px(out[out.length - 1].f);
      if (px(l.f) - prev >= gap && X1 - px(l.f) >= gap) out.push(l);
    });
    if (out.length > 1 && xLabels.length > 2) {
      const last = out.pop()!;
      const prev = out[out.length - 1];
      if (px(last.f) - px(prev.f) < gap && out.length > 1) out.pop();
      out.push(last);
    }
    return out;
  })();
  const first = layers.find((l) => l.type !== "stack")
    ? (layers.find((l) => l.type !== "stack") as Exclude<
        Layer,
        { type: "stack" }
      >)
    : undefined;
  const n =
    layers[0].type === "stack"
      ? layers[0].layers[0].values.length
      : layers[0].type === "band"
        ? layers[0].lo.length
        : layers[0].values.length;
  const isBars = layers.some((l) => l.type === "bars");

  const line = (l: Extract<Layer, { type: "line" }>, k: number) => {
    const pts: Pt[] = l.values.map((v, i) => [sx(i, n), sy(v)]);
    const d = smooth(pts);
    return (
      <g key={k}>
        {l.fill ? (
          <path
            d={`${d} L${pts[pts.length - 1][0].toFixed(1)} ${Y1} L${pts[0][0].toFixed(1)} ${Y1} Z`}
            fill={l.color}
            fillOpacity={l.fill}
          />
        ) : null}
        <path
          d={d}
          fill="none"
          stroke={l.color}
          strokeWidth={l.w ?? 2.2}
          strokeDasharray={l.dash ? "4 4" : undefined}
        />
      </g>
    );
  };

  const shape = (
    top: number[],
    base: number[],
    color: string,
    opacity: number,
    k: number,
  ) => {
    const up: Pt[] = top.map((v, i) => [sx(i, n), sy(v)]);
    const dn: Pt[] = base.map((v, i) => [sx(i, n), sy(v)] as Pt).reverse();
    return (
      <path
        key={k}
        d={`${smooth(up)} L${dn[0][0].toFixed(1)} ${dn[0][1].toFixed(1)} ${tail(smooth(dn))} Z`}
        fill={color}
        fillOpacity={opacity}
      />
    );
  };

  const body = layers.map((l, k) => {
    if (l.type === "line") return line(l, k);
    if (l.type === "band") return shape(l.hi, l.lo, l.color, 0.14, k);
    if (l.type === "stack") {
      let base = new Array(n).fill(0) as number[];
      return (
        <g key={k}>
          {l.layers.map((s, j) => {
            const top = base.map((b, i) => b + s.values[i]);
            const el = shape(top, base, s.color, 0.85, j);
            base = top;
            return el;
          })}
        </g>
      );
    }
    const bw = ((X1 - X0) / n) * 0.62;
    return (
      <g key={k}>
        {l.values.map((v, i) => {
          const x = X0 + ((X1 - X0) * (i + 0.5)) / n - bw / 2;
          const yy = sy(v);
          return (
            <rect
              key={i}
              x={x.toFixed(1)}
              y={yy.toFixed(1)}
              width={bw.toFixed(1)}
              height={Math.max(Y1 - yy, 0).toFixed(1)}
              rx="1.5"
              fill={l.color}
            />
          );
        })}
      </g>
    );
  });

  // Hover tooltip rows (named series only)
  const rows: { name: string; color: string; v: number }[] = [];
  if (hover !== null) {
    layers.forEach((l) => {
      if (l.type === "line" && l.name)
        rows.push({ name: l.name, color: l.color, v: l.values[hover] });
      if (l.type === "bars" && l.name)
        rows.push({ name: l.name, color: l.color, v: l.values[hover] });
      if (l.type === "stack")
        l.layers.forEach((s) =>
          rows.push({ name: s.name, color: s.color, v: s.values[hover] }),
        );
    });
  }
  const onMove = (e: React.MouseEvent<SVGRectElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const f = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1);
    setHover(
      isBars ? Math.min(n - 1, Math.floor(f * n)) : Math.round(f * (n - 1)),
    );
  };
  const hx =
    hover === null
      ? 0
      : isBars
        ? X0 + ((X1 - X0) * (hover + 0.5)) / n
        : sx(hover, n);
  const tw = 172;
  const th = 26 + rows.length * 16;
  const tx = hx + 14 + tw > W ? hx - 14 - tw : hx + 14;

  return (
    <div ref={wrap}>
      <svg
        className={plain ? undefined : "cs"}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={label}
        onMouseLeave={() => setHover(null)}
      >
        {y.ticks.map((t, k) => {
          const yy = Y1 - ((Y1 - Y0) * k) / (y.ticks.length - 1);
          return (
            <g key={k}>
              <line
                x1={X0}
                x2={X1}
                y1={yy.toFixed(1)}
                y2={yy.toFixed(1)}
                stroke="#1a1a1e"
                strokeWidth="1"
              />
              <text
                x={X0 - 10}
                y={(yy + 4).toFixed(1)}
                textAnchor="end"
                fontSize="11"
                fill="#71717a"
              >
                {y.fmt(t)}
              </text>
            </g>
          );
        })}
        {shownLabels.map((l, i) => (
          <text
            key={i}
            x={(X0 + (X1 - X0) * l.f).toFixed(1)}
            y={H - 6}
            textAnchor={
              i === 0
                ? "start"
                : i === shownLabels.length - 1
                  ? "end"
                  : "middle"
            }
            fontSize="11"
            fill="#71717a"
          >
            {l.text}
          </text>
        ))}
        {body}
        <rect
          x={X0}
          y={Y0}
          width={X1 - X0}
          height={Y1 - Y0}
          fill="transparent"
          onMouseMove={onMove}
        />
        {(hover !== null && first !== undefined) || hover !== null ? (
          <g pointerEvents="none">
            <line
              x1={hx}
              x2={hx}
              y1={Y0}
              y2={Y1}
              stroke="#3f3f46"
              strokeWidth="1"
            />
            <rect
              x={tx}
              y={Y0 + 4}
              width={tw}
              height={th}
              rx="10"
              fill="#0a0a0c"
              stroke="#2a2a2e"
            />
            <text x={tx + 12} y={Y0 + 22} fontSize="11" fill="#a1a1aa">
              {xName(hover as number)}
            </text>
            {rows.map((r, i) => (
              <g key={i}>
                <circle
                  cx={tx + 16}
                  cy={Y0 + 37 + i * 16}
                  r="3.5"
                  fill={r.color}
                />
                <text
                  x={tx + 26}
                  y={Y0 + 41 + i * 16}
                  fontSize="11"
                  fill="#e4e4e7"
                >
                  {r.name}: {valueFmt(r.v)}
                </text>
              </g>
            ))}
          </g>
        ) : null}
      </svg>
    </div>
  );
}
