type Pt = [number, number];

function smooth(pts: Pt[]): string {
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

/** Small trend line for the dashboard cards. `values` may be empty (no run yet). */
export function Spark({ values, color }: { values: number[]; color: string }) {
  let body = null;
  if (values.length > 1) {
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    const span = hi - lo || 1;
    const pts: Pt[] = values.map((v, i) => [
      (258 * i) / (values.length - 1),
      88 - ((v - lo) / span) * 66,
    ]);
    const end = pts[pts.length - 1];
    body = (
      <>
        <path
          className="ln"
          pathLength="1"
          d={smooth(pts)}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
        />
        <circle
          cx={end[0]}
          cy={end[1]}
          r="5"
          fill="#0a0a0a"
          stroke={color}
          strokeWidth="2"
        />
      </>
    );
  }
  return (
    <svg
      className="ch"
      viewBox="0 0 300 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line
        x1="0"
        x2="300"
        y1="72"
        y2="72"
        stroke="#2a2a2e"
        strokeDasharray="2 4"
      />
      {body}
    </svg>
  );
}
