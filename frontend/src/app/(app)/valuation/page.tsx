"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import apiClient from "@/lib/api";
import { getRun, saveRun, useRuns, valuationRecord } from "@/lib/runs";
import type { ValuationResponse } from "@/lib/types";

/* The three plain questions, mapped to the technical numbers behind them. */
const USAGE = [
  { l: "Slowly", pq: 1000, g2: 25 },
  { l: "Steadily", pq: 2000, g2: 50 },
  { l: "Fast", pq: 4000, g2: 75 },
];
const RISK = [
  { l: "Established", dr: 15, rlo: 25, rhi: 35 },
  { l: "Growing", dr: 20, rlo: 30, rhi: 40 },
  { l: "Early-stage", dr: 30, rlo: 30, rhi: 50 },
  { l: "Experimental", dr: 40, rlo: 40, rhi: 60 },
];
const SWING = [
  { l: "Calm", vol: 60 },
  { l: "Normal", vol: 100 },
  { l: "Wild", vol: 150 },
];

const FACTORS: [string, number, number][] = [
  ["Team", 30, 125],
  ["Size of opportunity", 25, 150],
  ["Product", 15, 100],
  ["Competition", 10, 75],
  ["Sales and partners", 10, 80],
  ["Funding need", 5, 100],
  ["Other", 5, 100],
];

const METHOD_COLOR: Record<string, string> = {
  network: "#a78bfa",
  cashflow: "#d9ceff",
  peers: "#f5f5f7",
  prelaunch: "#8b8b95",
};

const EXAMPLE_ROLES = [
  { name: "Team", allocation_pct: 20, cliff_months: 12, vesting_months: 36, initial_unlock_pct: 0, release_frequency: "monthly" },
  { name: "Investors", allocation_pct: 25, cliff_months: 6, vesting_months: 24, initial_unlock_pct: 10, release_frequency: "quarterly" },
  { name: "Advisors", allocation_pct: 5, cliff_months: 6, vesting_months: 18, initial_unlock_pct: 0, release_frequency: "monthly" },
  { name: "Ecosystem fund", allocation_pct: 15, cliff_months: 0, vesting_months: 48, initial_unlock_pct: 5, release_frequency: "quarterly" },
];

type Role = (typeof EXAMPLE_ROLES)[number];

const n = (s: string) => {
  const v = parseFloat(s);
  return Number.isFinite(v) ? v : NaN;
};
const fm = (x: number, d: number) =>
  x.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
const usd = (x: number) => (x >= 1 ? "$" + fm(x, 2) : "$" + fm(x, 3));

function roleNote(r: Role) {
  const freq = r.release_frequency === "biweekly" ? "bi-weekly" : r.release_frequency;
  const first =
    r.initial_unlock_pct > 0
      ? `${r.initial_unlock_pct}% ${r.cliff_months ? `at ${r.cliff_months} months` : "at launch"}, then ${freq}`
      : r.cliff_months
        ? `${r.cliff_months}-month cliff, then ${freq}`
        : `Released ${freq} from launch`;
  return first;
}

function Field({
  id, label, value, onChange, step, min, bad,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void;
  step?: string; min?: string; bad?: boolean;
}) {
  return (
    <div className={`val-f${bad ? " bad" : ""}`}>
      <label htmlFor={id}>{label}</label>
      <input id={id} type="number" inputMode="decimal" value={value} step={step ?? "any"} min={min}
        onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Seg({
  label, items, value, onPick, note,
}: {
  label: string; items: string[]; value: number; onPick: (i: number) => void; note: string;
}) {
  const id = label.replace(/\W+/g, "-");
  return (
    <div className="val-q">
      <h4 id={id}>{label}</h4>
      <div className="val-seg" role="group" aria-labelledby={id}>
        {items.map((t, i) => (
          <button key={t} type="button" aria-pressed={value === i} onClick={() => onPick(i)}>
            {t}
          </button>
        ))}
      </div>
      <p className="val-note">{note}</p>
    </div>
  );
}

export default function ValuationPage() {
  const runs = useRuns();
  const vestingRoles = useMemo<Role[] | null>(() => {
    const r = runs.find((x) => x.type === "vesting");
    const roles = (r?.params as any)?.roles;
    if (!Array.isArray(roles) || roles.length === 0) return null;
    return roles.slice(0, 10).map((x: any) => ({
      name: String(x.name ?? "Role"),
      allocation_pct: Number(x.allocation_pct) || 0,
      cliff_months: Math.round(Number(x.cliff_months) || 0),
      vesting_months: Math.max(1, Math.round(Number(x.vesting_months) || 1)),
      initial_unlock_pct: Number(x.initial_unlock_pct) || 0,
      release_frequency: x.release_frequency ?? "monthly",
    }));
  }, [runs]);
  const [restoredRoles, setRestoredRoles] = useState<Role[] | null>(null);
  const roles = restoredRoles ?? vestingRoles ?? EXAMPLE_ROLES;

  const [u, setU] = useState(1);
  const [r, setR] = useState(2);
  const [s, setS] = useState(1);
  const [f, setF] = useState<Record<string, string>>({
    pq: "2000", g2: "50", dr: "30", rlo: "30", rhi: "50", vol: "100",
    vel: "20", flt: "40", hor: "10", cf1: "1.5", dec: "10", tg: "3", fd: "100",
    m1: "6", m2: "9", m3: "14", pml: "4", pmh: "6", model: "ghaidarov",
    ...Object.fromEntries(FACTORS.map((x, i) => [`pf${i}`, String(x[2])])),
  });
  const [inc, setInc] = useState(false);
  const [data, setData] = useState<ValuationResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const seq = useRef(0);

  // Opening a saved run from the dashboard (?run=...) puts every answer and number back.
  useEffect(() => {
    const rec = getRun(new URLSearchParams(window.location.search).get("run"));
    if (!rec || rec.type !== "valuation") return;
    const p: any = rec.params;
    if (p?.f) setF((prev) => ({ ...prev, ...p.f }));
    if (typeof p?.inc === "boolean") setInc(p.inc);
    if (Number.isInteger(p?.u)) setU(p.u);
    if (Number.isInteger(p?.r)) setR(p.r);
    if (Number.isInteger(p?.s)) setS(p.s);
    if (Array.isArray(p?.roles)) setRestoredRoles(p.roles);
  }, []);


  const set = (k: string) => (v: string) => setF((p) => ({ ...p, [k]: v }));
  const patch = (o: Record<string, number>) =>
    setF((p) => ({ ...p, ...Object.fromEntries(Object.entries(o).map(([k, v]) => [k, String(v)])) }));

  const payload = useMemo(() => {
    const g = (k: string) => n(f[k]);
    const peers = [g("m1"), g("m2"), g("m3")].filter((x) => x > 0);
    const need = ["pq", "vel", "flt", "hor", "rlo", "rhi", "cf1", "g2", "dec", "dr", "tg", "fd", "vol"];
    if (need.some((k) => !Number.isFinite(g(k))) || peers.length === 0) return null;
    if (g("dr") - 5 <= g("tg") + 1 || g("rhi") < g("rlo")) return null;
    return {
      network: {
        economy_millions: g("pq"), velocity: g("vel"), float_millions: g("flt"),
        horizon_years: g("hor"), rate_low_pct: g("rlo"), rate_high_pct: g("rhi"),
      },
      cashflow: {
        fees_year1_millions: g("cf1"), growth_year2_pct: g("g2"), growth_slowdown_pct: g("dec"),
        rate_pct: g("dr"), terminal_growth_pct: g("tg"), total_tokens_millions: g("fd"),
      },
      peers: { multiples: peers },
      prelaunch: {
        enabled: inc,
        ratings_pct: FACTORS.map((_, i) => {
          const v = g(`pf${i}`);
          return Number.isFinite(v) ? v : 100;
        }),
        median_low_millions: g("pml") > 0 ? g("pml") : 4,
        median_high_millions: g("pmh") > 0 ? g("pmh") : 6,
      },
      lockup: {
        volatility_pct: g("vol"),
        model: f.model,
        roles: roles.filter((x) => x.allocation_pct > 0),
      },
    };
  }, [f, inc, roles]);

  // Any change after saving makes the saved copy out of date.
  useEffect(() => setSaved(false), [payload]);

  const saveThisRun = () => {
    if (!data) return;
    saveRun(
      valuationRecord(
        {
          f, inc, u, r, s, roles,
          labels: { usage: USAGE[u].l, risk: RISK[r].l, swing: SWING[s].l },
        },
        data,
      ),
    );
    setSaved(true);
  };

  useEffect(() => {
    if (!payload) return;
    const id = ++seq.current;
    setBusy(true);
    const t = setTimeout(async () => {
      try {
        const res: ValuationResponse = await apiClient.runValuation(payload);
        if (id !== seq.current) return;
        setData(res);
        setErr(null);
      } catch (e: any) {
        if (id !== seq.current) return;
        setErr(e?.message ?? "Something went wrong.");
      } finally {
        if (id === seq.current) setBusy(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [payload]);

  const h = data?.headline;
  const top = h ? Math.ceil(h.high * 1.25 * 100) / 100 : 1;
  const P = (v: number) => Math.max(0, Math.min(100, (v / top) * 100));
  const agreeText =
    h?.agreement === "close"
      ? "The methods agree closely."
      : h?.agreement === "rough"
        ? "The methods roughly agree."
        : "The methods disagree widely. Treat this with care.";
  const L = data?.lockup;
  const volN = n(f.vol);

  return (
    <div className="val">
      <div className="val-col">
        <div style={{ color: "var(--muted)", fontSize: 13 }}>
          <b style={{ color: "var(--text)", fontSize: 15, fontWeight: 600 }}>Valuation</b> ·{" "}
          {vestingRoles ? "Roles from your latest Vesting run" : "Example roles until you run Vesting"}
        </div>

        <section className={`val-answer${busy ? " val-busy" : ""}`} aria-live="polite">
          <p className="val-say">One token is worth somewhere between</p>
          {h ? (
            <>
              <p className="val-big">{usd(h.low)} to {usd(h.high)}</p>
              <p className="val-agree">{agreeText}</p>
              <div className="val-track">
                <div className="ln" />
                <div className="sp" style={{ left: `${P(h.low)}%`, width: `${P(h.high) - P(h.low)}%` }} />
                {data!.methods.map((m) => (
                  <div key={m.id} className="dt" title={`${m.name} ${usd(m.mid)}`}
                    style={{ left: `${P(m.mid)}%`, background: METHOD_COLOR[m.id] }} />
                ))}
              </div>
              <div className="val-axis"><span>$0</span><span>{usd(top)}</span></div>
              <ul className="val-methods">
                {data!.methods.map((m) => (
                  <li key={m.id}>
                    <i style={{ background: METHOD_COLOR[m.id] }} />
                    {m.name}
                    <span>{usd(m.mid)}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="val-big">{err ? "—" : "Working it out…"}</p>
          )}
          <p className="val-fine">A scenario range built from the choices below. It is not a forecast.</p>
          {h ? (
            <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <button type="button" className="btn ghost" onClick={saveThisRun} disabled={busy || saved}>
                {saved ? "Saved to your dashboard" : "Save this run"}
              </button>
              {saved ? <span className="val-fine" style={{ margin: 0 }}>Kept in this browser only.</span> : null}
            </div>
          ) : null}
          {err ? <div className="val-err" role="alert">{err}</div> : null}
          {!payload ? <div className="val-err">Some numbers under “Edit the numbers” are empty or do not fit together (the fee markdown rate must be at least 7 points above long-run growth, and the high rate above the low). Fix them to update the answer.</div> : null}
        </section>

        <section>
          <h3 className="val-h">What are you assuming?</h3>
          <p className="val-lead">Pick the closest answer. Each one fills in the numbers behind it, and the answer updates.</p>
          <Seg label="How much will people use the network?" items={USAGE.map((x) => x.l)} value={u}
            onPick={(i) => { setU(i); patch({ pq: USAGE[i].pq, g2: USAGE[i].g2 }); }}
            note="Sets how big the network's economy gets and how fast fees grow." />
          <Seg label="How risky is the project?" items={RISK.map((x) => x.l)} value={r}
            onPick={(i) => { setR(i); patch({ dr: RISK[i].dr, rlo: RISK[i].rlo, rhi: RISK[i].rhi }); }}
            note="Sets how much future earnings are marked down today. Riskier projects get a bigger markdown." />
          <Seg label="How much do the token's price swings run?" items={SWING.map((x) => x.l)} value={s}
            onPick={(i) => { setS(i); patch({ vol: SWING[i].vol }); }}
            note="Sets the lock-up discount below. Wilder swings make waiting to sell riskier." />
        </section>

        <section className={busy ? "val-busy" : ""}>
          <h3 className="val-h">Tokens that are still locked</h3>
          {L && h ? (
            L.roles.length > 0 ? (
              <>
                <p className="val-hl">About {fm(L.blended_discount * 100, 0)}% less</p>
                <p className="val-lead">
                  A token you cannot sell yet is worth less today, because you carry the price risk while you wait.
                  Across the {fm(L.locked_share_pct, 0)}% of supply that is still locked, the discount averages{" "}
                  {fm(L.blended_discount * 100, 0)}%, so a locked token is worth about {usd(h.locked_low ?? h.low)} to{" "}
                  {usd(h.locked_high ?? h.high)}.
                </p>
                <div className="val-roles">
                  {L.roles.map((x, i) => (
                    <div className="val-role" key={x.name + i}>
                      <div>{x.name}<small>{roleNote(roles.filter((q) => q.allocation_pct > 0)[i] ?? roles[i])}</small></div>
                      <div className="bar"><b style={{ width: `${Math.min(100, (x.discount * 100) / 0.7)}%` }} /></div>
                      <div className="p">{fm(x.discount * 100, 0)}%</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="val-lead">No vesting roles to price. Run the Vesting page first and they will appear here.</p>
            )
          ) : null}
        </section>

        <details>
          <summary>How we got this</summary>
          <div className="val-how">
            {data?.methods.map((m) => (
              <div key={m.id}>
                <b>{m.name}</b>
                <p>{m.why}</p>
                <span className="r">{usd(m.low)} to {usd(m.high)}, middle {usd(m.mid)}</span>
              </div>
            ))}
          </div>

          <details>
            <summary>Edit the numbers</summary>
            <p className="val-note" style={{ marginTop: 10 }}>The three choices above fill these in. Typing here overrides them.</p>

            <div className="val-group">
              <h5>Network use</h5>
              <p className="why">Money the network needs = size of its economy ÷ how often tokens change hands, spread over the tokens in the float, then discounted for the wait.</p>
              <div className="val-fields">
                <Field id="pq" label="Network economy in year T ($M)" value={f.pq} onChange={set("pq")} min="1" />
                <Field id="vel" label="Times a token changes hands a year" value={f.vel} onChange={set("vel")} min="0.1" />
                <Field id="flt" label="Tokens in the float (M)" value={f.flt} onChange={set("flt")} min="1" />
                <Field id="hor" label="Years ahead (T)" value={f.hor} onChange={set("hor")} min="1" />
                <Field id="rlo" label="Markdown rate, low (%)" value={f.rlo} onChange={set("rlo")} min="1" />
                <Field id="rhi" label="Markdown rate, high (%)" value={f.rhi} onChange={set("rhi")} min="1" />
              </div>
            </div>

            <div className="val-group">
              <h5>Fee income</h5>
              <p className="why">Five years of fees to holders, each year marked down, plus one lump for everything after.</p>
              <div className="val-fields">
                <Field id="cf1" label="Fees to holders, year 1 ($M)" value={f.cf1} onChange={set("cf1")} min="0" />
                <Field id="g2" label="Growth in year 2 (%)" value={f.g2} onChange={set("g2")} min="0" />
                <Field id="dec" label="Growth slows by (% a year)" value={f.dec} onChange={set("dec")} min="0" />
                <Field id="dr" label="Markdown rate (%)" value={f.dr} onChange={set("dr")} min="1" />
                <Field id="tg" label="Long-run growth (%)" value={f.tg} onChange={set("tg")} min="0" />
                <Field id="fd" label="Total tokens (M)" value={f.fd} onChange={set("fd")} min="1" />
              </div>
            </div>

            <div className="val-group">
              <h5>Similar projects</h5>
              <p className="why">Market value ÷ fees for three projects you pick. Simlab ships no defaults you should trust, because the choice of peer can flip the answer.</p>
              <div className="val-fields">
                <Field id="m1" label="Project A" value={f.m1} onChange={set("m1")} />
                <Field id="m2" label="Project B" value={f.m2} onChange={set("m2")} />
                <Field id="m3" label="Project C" value={f.m3} onChange={set("m3")} />
              </div>
            </div>

            <div className="val-group">
              <h5>Pre-launch scorecard</h5>
              <p className="why">For tokens with no price yet. An adapted startup-equity method: start from what similar early projects are valued at, then adjust. Off by default.</p>
              <label className="val-check">
                <input type="checkbox" checked={inc} onChange={(e) => setInc(e.target.checked)} /> Include it in the answer
              </label>
              <div className="val-fields" style={{ marginTop: 12 }}>
                {FACTORS.map((x, i) => (
                  <Field key={x[0]} id={`pf${i}`} label={`${x[0]} (${x[1]}%)`} value={f[`pf${i}`]} onChange={set(`pf${i}`)} min="0" />
                ))}
              </div>
              <div className="val-fields" style={{ marginTop: 10 }}>
                <Field id="pml" label="Similar projects' value, low ($M)" value={f.pml} onChange={set("pml")} min="0.1" />
                <Field id="pmh" label="Similar projects' value, high ($M)" value={f.pmh} onChange={set("pmh")} min="0.1" />
              </div>
            </div>

            <div className="val-group">
              <h5>Lock-up discount</h5>
              <div className="val-fields">
                <div className="val-f">
                  <label htmlFor="vol">Price swings (% a year): {Number.isFinite(volN) ? fm(volN, 0) : "—"}%</label>
                  <input id="vol" type="range" min="30" max="300" step="5" value={Number.isFinite(volN) ? volN : 100}
                    onChange={(e) => set("vol")(e.target.value)} />
                </div>
                <div className="val-f">
                  <label htmlFor="model">Model</label>
                  <select id="model" value={f.model} onChange={(e) => set("model")(e.target.value)}>
                    <option value="ghaidarov">Ghaidarov</option>
                    <option value="finnerty">Finnerty</option>
                  </select>
                </div>
              </div>
              {L?.volatility_warning ? (
                <div className="val-warn">Above about 150% these models become unstable. Treat the result as indicative.</div>
              ) : null}
              {L && L.roles.length > 0 ? (
                <p className="val-note">
                  The {L.other_model === "finnerty" ? "Finnerty" : "Ghaidarov"} model would give about{" "}
                  {fm(L.other_model_blended_discount * 100, 0)}%.
                </p>
              ) : null}
            </div>
          </details>

          <p className="val-src">
            Methods: Burniske 2017 (network use), CFA Institute 2023 (fee income, similar projects), Angel Capital
            Association (pre-launch, adapted from equity), Finnerty 2012 and Ghaidarov 2009 (lock-up). Formulas and how
            far each was checked are in the Simlab Valuation Maths Reference.
          </p>
        </details>
      </div>
    </div>
  );
}
