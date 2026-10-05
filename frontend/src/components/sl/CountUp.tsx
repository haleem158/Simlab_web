"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  to: number;
  dec: number;
  pre: string;
  suf: string;
  duration?: number;
};

export function CountUp({ to, dec, pre, suf, duration = 1600 }: Props) {
  const fmt = (v: number) =>
    pre +
    (dec > 0 ? v.toFixed(dec) : Math.round(v).toLocaleString("en-US")) +
    suf;
  const ref = useRef<HTMLSpanElement>(null);
  const [text, setText] = useState(fmt(to));

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    let raf = 0;
    const format = (v: number) =>
      pre +
      (dec > 0 ? v.toFixed(dec) : Math.round(v).toLocaleString("en-US")) +
      suf;
    setText(format(0));
    const run = () => {
      let start: number | null = null;
      const tick = (t: number) => {
        if (start === null) start = t;
        const p = Math.min((t - start) / duration, 1);
        setText(format(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          run();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to, dec, pre, suf, duration]);

  return (
    <span className="n" ref={ref}>
      {text}
    </span>
  );
}
