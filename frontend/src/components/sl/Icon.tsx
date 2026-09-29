import type { CSSProperties } from "react";

export function Icon({ n, style }: { n: string; style?: CSSProperties }) {
  return (
    <svg className="i" style={style} aria-hidden="true">
      <use href={`#i-${n}`} />
    </svg>
  );
}
