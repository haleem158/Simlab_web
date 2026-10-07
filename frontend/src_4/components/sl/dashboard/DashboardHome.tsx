"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CountUp } from "../CountUp";
import { Icon } from "../Icon";
import { Logo } from "../Logo";
import { Spark } from "../Spark";
import {
  RUN_META,
  impactRecord,
  supplyRecord,
  timeAgo,
  useRuns,
  vestingRecord,
  type RunRecord,
  type RunType,
} from "@/lib/runs";

const ORDER: RunType[] = ["supply", "vesting", "impact"];
const TONE = { g: "#34d399", r: "#f87171" } as const;
const LINE = { g: "#a78bfa", r: "#f87171" } as const;

export function DashboardHome() {
  const stored = useRuns();
  const [fixture, setFixture] = useState<RunRecord[] | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  // Test-only: seed the three runs from the approved sample data so the page can be compared pixel by pixel.
  useEffect(() => {
    if (
      process.env.NEXT_PUBLIC_VISUAL_TEST !== "1" ||
      new URLSearchParams(window.location.search).get("fixture") !== "1"
    )
      return;
    import("@/lib/fixtures.json").then((m) => {
      const f = (m as any).default;
      const t = Date.now();
      const mk = (x: any, i: number, ago: number): RunRecord => ({
        ...x,
        id: `fx${i}`,
        ts: t - ago * 60000,
      });
      setFixture([
        mk(supplyRecord(f.supply.params, { mc: f.supply.mc }), 1, 5),
        mk(vestingRecord(f.vesting.params, f.vesting.result), 2, 42),
        mk(impactRecord(f.impact.params, f.impact.result), 3, 190),
      ]);
    });
  }, []);

  const runs = fixture ?? stored;
  const latest = useMemo(() => {
    const m = {} as Partial<Record<RunType, RunRecord>>;
    for (const r of runs) if (!m[r.type]) m[r.type] = r;
    return m;
  }, [runs]);
  const ran = ORDER.filter((t) => latest[t]).length;
  const active = runs.find((r) => r.id === picked) ?? runs[0];
  const ago = (ts: number) => (now === null ? "" : timeAgo(ts, now));

  return (
    <div className="cnt">
      <div>
        <div className="hd">
          <div>
            <div className="rec">
              Latest results
              <Icon n="clock" style={{ width: 14, height: 14 }} />
              <b>{ran} of 3 run</b>
            </div>
            <h2>Your Simulators</h2>
          </div>
        </div>
        <div className="cards">
          {ORDER.map((t) => {
            const meta = RUN_META[t];
            const r = latest[t];
            return (
              <Link key={t} className="ac" href={meta.href}>
                <div className="t">
                  <div className="ic" style={{ background: meta.color }}>
                    <Icon n={meta.icon} />
                  </div>
                  <div>
                    <small>{meta.model}</small>
                    <div className="nm">
                      {meta.name
                        .replace("Token Supply", "Token supply")
                        .replace("Price Impact", "Price impact")}
                    </div>
                  </div>
                  <div className="go">
                    <Icon n="ur" style={{ width: 15, height: 15 }} />
                  </div>
                </div>
                {r ? (
                  <>
                    <div className="lb">{r.headline.label}</div>
                    <div className="big">
                      <CountUp
                        key={r.id}
                        to={r.headline.parts.to}
                        dec={r.headline.parts.dec}
                        pre={r.headline.parts.pre}
                        suf={r.headline.parts.suf}
                      />
                    </div>
                    <div className="chip" style={{ color: TONE[r.delta.tone] }}>
                      <i style={{ background: TONE[r.delta.tone] }} />
                      {r.delta.text}
                    </div>
                    <Spark values={r.spark} color={LINE[r.delta.tone]} />
                  </>
                ) : (
                  <>
                    <div className="lb">
                      {t === "supply"
                        ? "Final circulating"
                        : t === "vesting"
                          ? "Circulating at end"
                          : "Final price"}
                    </div>
                    <div className="big" style={{ color: "#3f3f46" }}>
                      —
                    </div>
                    <div className="chip" style={{ color: "#8b8b95" }}>
                      <i style={{ background: "#52525b" }} />
                      No run yet. Open to start
                    </div>
                    <Spark values={[]} color="#a78bfa" />
                  </>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="feat">
        <div className="fh">
          <div className="bl">
            <Logo height={26} />
            Simlab<sup style={{ fontSize: 9 }}>®</sup>
          </div>
          <span className="nw">Monte Carlo</span>
        </div>
        <h3>Monte Carlo Engine</h3>
        <p>
          Stress-test your token economy across up to 500 randomized runs and
          see the range of outcomes.
        </p>
        <svg
          width="90"
          height="60"
          viewBox="0 0 90 60"
          style={{ position: "absolute", right: 20, top: 120, opacity: 0.5 }}
          aria-hidden="true"
        >
          <path d="M4 56 L86 6" stroke="#8b7be0" strokeWidth="1" />
        </svg>
        <div className="fb">
          <Link className="btn lavb" href="/token-supply">
            Run Monte Carlo
            <Icon n="flask" style={{ width: 16, height: 16 }} />
          </Link>
          <Link className="btn o" href="/token-impact">
            Upload Token Data (CSV)
            <Icon n="up" style={{ width: 16, height: 16 }} />
          </Link>
        </div>
      </div>

      <div className="act">
        <div className="ah">
          <span>Your latest run</span>
          {runs.length > 1 ? (
            <label className="fl">
              <select
                aria-label="Choose a run"
                value={active?.id}
                onChange={(e) => setPicked(e.target.value)}
              >
                {runs.map((r) => (
                  <option key={r.id} value={r.id}>
                    {RUN_META[r.type].name} · {ago(r.ts) || "recent"}
                  </option>
                ))}
              </select>
              <Icon n="cd" style={{ width: 12, height: 12 }} />
            </label>
          ) : null}
        </div>

        {active ? (
          <>
            <div className="inn">
              <div>
                <div className="lu">
                  Last run · {ago(active.ts) || "recently"}
                  <Icon n="clock" style={{ width: 14, height: 14 }} />
                </div>
                <div className="ttl">
                  <h3>{RUN_META[active.type].name} Simulation</h3>
                  <div
                    className="ic"
                    style={{ background: RUN_META[active.type].color }}
                  >
                    <Icon n={RUN_META[active.type].icon} />
                  </div>
                  <Link
                    className="vp deskonly"
                    href={RUN_META[active.type].href}
                  >
                    Open simulator
                    <Icon n="ur" style={{ width: 14, height: 14 }} />
                  </Link>
                </div>
                <div className="cb">{active.headline.label}</div>
                <div className="bal">
                  <div className="n">
                    <CountUp
                      key={active.id}
                      to={active.headline.parts.to}
                      dec={active.headline.parts.dec}
                      pre={active.headline.parts.pre}
                      suf={active.headline.parts.suf}
                    />
                  </div>
                  <Link
                    className="btn lavb"
                    href={`${RUN_META[active.type].href}?run=${active.id}`}
                  >
                    Re-run
                  </Link>
                  <Link
                    className="btn ghost mobonly"
                    href={RUN_META[active.type].href}
                  >
                    Open simulator
                  </Link>
                </div>
              </div>
              <div className="per det">
                <h4>Run settings</h4>
                <small>Parameters used for this run</small>
                <div className="drows">
                  {active.details.map((d) => (
                    <div className="drow" key={d.label}>
                      <span>{d.label}</span>
                      <b>{d.value}</b>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mets">
              {active.metrics.map((m) => (
                <div className="mc" key={active.id + m.label}>
                  <div className="h">{m.label}</div>
                  <div className="v">
                    <CountUp
                      to={m.parts.to}
                      dec={m.parts.dec}
                      pre={m.parts.pre}
                      suf={m.parts.suf}
                    />
                  </div>
                  {m.sub ? (
                    <div
                      className="msub"
                      style={m.tone ? { color: TONE[m.tone] } : undefined}
                    >
                      {m.sub}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="inn none">
            <div className="t">No runs yet</div>
            <div className="s">
              Run any simulator and its results will appear here. Runs are saved
              in this browser only.
            </div>
            <div className="starts">
              {ORDER.map((t) => (
                <Link key={t} className="btn ghost" href={RUN_META[t].href}>
                  <Icon
                    n={RUN_META[t].icon}
                    style={{ width: 16, height: 16 }}
                  />
                  {RUN_META[t].name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
