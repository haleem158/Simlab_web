"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "../Icon";
import { Logo } from "../Logo";
import { ApiStatus } from "../ApiStatus";

const API = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8000";

const NAV = [
  { href: "/dashboard", icon: "dash", label: "Dashboard" },
  { href: "/token-supply", icon: "coins", label: "Token supply" },
  { href: "/vesting", icon: "cal", label: "Vesting" },
  { href: "/token-impact", icon: "down", label: "Price impact" },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="side">
      <Link href="/" className="brand" aria-label="Simlab home">
        <div className="bl">
          <Logo height={34} />
          <div>
            <div className="bn">
              Simlab<sup>®</sup>
            </div>
            <div className="bs">Tokenomics simulations</div>
          </div>
        </div>
      </Link>
      <nav style={{ marginTop: 28 }} aria-label="Main">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`ni${path === n.href ? " on" : ""}`}
            aria-current={path === n.href ? "page" : undefined}
          >
            <Icon n={n.icon} />
            {n.label}
          </Link>
        ))}
        <a
          className="ni"
          href={`${API}/api/docs`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon n="db" />
          API docs
          <Icon n="ur" style={{ width: 13, height: 13, marginLeft: -4 }} />
        </a>
      </nav>
      <ApiStatus />
    </aside>
  );
}
