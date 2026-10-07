"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8000";

type State = "checking" | "online" | "offline";

function hostOf(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function useApiStatus(): { state: State; host: string } {
  const [state, setState] = useState<State>("checking");

  useEffect(() => {
    let alive = true;
    const check = async () => {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 8000);
      try {
        const res = await fetch(`${API}/health`, {
          cache: "no-store",
          signal: ctl.signal,
        });
        if (alive) setState(res.ok ? "online" : "offline");
      } catch {
        if (alive) setState("offline");
      } finally {
        clearTimeout(t);
      }
    };
    check();
    const id = setInterval(check, 15000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return { state, host: hostOf(API) };
}

/** Sidebar card (desktop). */
export function ApiStatus() {
  const { state, host } = useApiStatus();
  const title =
    state === "online"
      ? "API connected"
      : state === "offline"
        ? "API not reachable"
        : "Checking API…";
  const sub =
    state === "online"
      ? host
      : state === "offline"
        ? `Start the backend (${host})`
        : host;
  return (
    <div className="pro" role="status" aria-live="polite">
      <span className={`sdot ${state}`} />
      <div>
        <b>{title}</b>
        <small>{sub}</small>
      </div>
    </div>
  );
}

/** Small status dot for the mobile top bar. */
export function ApiDot() {
  const { state, host } = useApiStatus();
  const label =
    state === "online"
      ? `API connected (${host})`
      : state === "offline"
        ? `API not reachable (${host})`
        : "Checking API";
  return (
    <span
      className={`sdot ${state}`}
      role="status"
      aria-label={label}
      title={label}
    />
  );
}
