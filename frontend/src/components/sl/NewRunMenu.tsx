"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

const ITEMS = [
  {
    href: "/token-supply",
    icon: "coins",
    title: "Token supply",
    sub: "Emission, staking and burn",
  },
  {
    href: "/vesting",
    icon: "cal",
    title: "Vesting",
    sub: "Unlock schedules by role",
  },
  {
    href: "/token-impact",
    icon: "down",
    title: "Price impact",
    sub: "Demand and price response",
  },
];

export function NewRunMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="nrm" ref={ref}>
      <button
        type="button"
        className="btn lavb"
        style={{ height: 46, borderRadius: 14, padding: "0 20px" }}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        New run
        <Icon n="plus" style={{ width: 16, height: 16 }} />
      </button>
      {open ? (
        <div className="nrm-menu" role="menu">
          {ITEMS.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              role="menuitem"
              className="nrm-item"
              onClick={() => setOpen(false)}
            >
              <Icon n={i.icon} />
              <span>
                <b>{i.title}</b>
                <small>{i.sub}</small>
              </span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
