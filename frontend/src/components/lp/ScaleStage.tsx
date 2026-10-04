"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

const useIsoLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;
const DESIGN_WIDTH = 1440;

/**
 * Lays the page out at its 1440px design width and scales it to the window,
 * so the landing page always looks like the approved design.
 */
export function ScaleStage({ children }: { children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useIsoLayoutEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const fit = () => {
      const s = o.clientWidth / DESIGN_WIDTH;
      setScale(s);
      setHeight(i.offsetHeight * s);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(o);
    ro.observe(i);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={outer} className="stage" style={{ height }}>
      <div
        ref={inner}
        className="frame"
        style={{ transform: scale === 1 ? "none" : `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}
