"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "../Icon";
import { Logo } from "../Logo";
import { ApiStatus } from "../ApiStatus";

const NAV = [
  { href: "/dashboard", icon: "dash", label: "Dashboard" },
  { href: "/token-supply", icon: "coins", label: "Token supply" },
  { href: "/vesting", icon: "cal", label: "Vesting" },
  { href: "/token-impact", icon: "down", label: "Price impact" },
  { href: "/guide", icon: "book", label: "Guide" },
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
      </nav>
      <ApiStatus />
    </aside>
  );
}
