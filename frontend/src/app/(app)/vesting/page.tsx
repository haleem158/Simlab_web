"use client";

import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import apiClient from "@/lib/api";
import { getRun, saveRun, vestingRecord } from "@/lib/runs";
import { deleteProfile, saveProfile, useProfiles } from "@/lib/profiles";
import type { VestingParams } from "@/lib/types";
import { Icon } from "@/components/sl/Icon";
import { MobileSeg, type SimTab } from "@/components/sl/MobileSeg";
import { Chart } from "@/components/sl/Chart";
import {
  ChartPanel,
  Chips,
  EmptyState,
  ErrorBox,
  Group,
  Kpi,
  Legend,
  NumCell,
  NumField,
  PageHeader,
  TextCell,
  Toggle,
} from "@/components/sl/kit";
import {
  PALETTE,
  axisFor,
  compact,
  csvDownload,
  moneyParts,
  monthLabels,
  percentLabel,
} from "@/lib/charts";

const PRESETS = [
  { id: "Standard Startup", label: "Standard startup" },
  { id: "DAO Governance", label: "DAO governance" },
];

const DEFAULTS: VestingParams = {
  total_supply: 1_000_000_000,
  months: 60,
  roles: [
    {
      name: "Team",
      allocation_pct: 20,
      cliff_months: 12,
      vesting_months: 48,
      activation_ratio: 0.7,
      governance_fraction: 0.1,
    },
    {
      name: "Investors",
      allocation_pct: 25,
      cliff_months: 6,
      vesting_months: 24,
      activation_ratio: 0.8,
      governance_fraction: 0.0,
    },
  ],
  stochastic: false,
  noise_std_pct: 0.05,
  seed: 42,
  annual_discount_rate: 0.1,
  clip_to_total: true,
};

export default function VestingSimulator() {
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const profiles = useProfiles();
  const [preset, setPreset] = useState<string | null>(null);
  const [runId, setRunId] = useState(0);
  const [tab, setTab] = useState<SimTab>("params");
  const [profileId, setProfileId] = useState("");

  const { register, control, handleSubmit, watch, setValue, reset } =
    useForm<VestingParams>({ defaultValues: DEFAULTS });
  const { fields, append, remove } = useFieldArray({ control, name: "roles" });
  const roles = watch("roles");
  const stochastic = watch("stochastic");
  const totalAllocation = roles.reduce(
    (s, r) => s + (parseFloat(r.allocation_pct as any) || 0),
    0,
  );

  useEffect(() => {
    const rec = getRun(new URLSearchParams(window.location.search).get("run"));
    if (rec && rec.type === "vesting")
      reset({ ...DEFAULTS, ...(rec.params as Partial<VestingParams>) });
  }, [reset]);

  useEffect(() => {
    if (
      process.env.NEXT_PUBLIC_VISUAL_TEST === "1" &&
      new URLSearchParams(window.location.search).get("fixture") === "1"
    ) {
      import("@/lib/fixtures.json").then((m) => {
        const f = (m as any).default.vesting;
        reset({ ...DEFAULTS, ...f.params });
        setPreset(f.preset);
        setResults(f.result);
        setRunId((n) => n + 1);
      });
    }
  }, [reset]);

  const onSubmit = async (data: VestingParams) => {
    if (totalAllocation > 100) {
      setError("Total allocations exceed 100%");
      return;
    }
    setIsLoading(true);
    setError(null);
    setResults(null);
    try {
      const r = await apiClient.simulateVesting(data);
      setResults(r);
      saveRun(vestingRecord(data, r));
      setTab("results");
      setRunId((n) => n + 1);
    } catch (err: any) {
      setError(err.message || "Simulation failed");
    } finally {
      setIsLoading(false);
    }
  };

  const loadPreset = async (name: string) => {
    try {
      const presets = await apiClient.getVestingPresets();
      const found = presets.find((p: any) => p.name === name);
      if (found?.params) {
        Object.entries(found.params).forEach(([k, v]) =>
          setValue(k as any, v as any),
        );
        setPreset(name);
        setError(null);
      }
    } catch {
      setError("Failed to load preset");
    }
  };

  const addRole = () => {
    if (fields.length >= 10) return setError("Maximum 10 roles allowed");
    append({
      name: `Role ${fields.length + 1}`,
      allocation_pct: 10,
      cliff_months: 12,
      vesting_months: 48,
      activation_ratio: 0.8,
      governance_fraction: 0,
    });
  };

  const onSaveProfile = () => {
    const name = prompt(
      "Name this profile (it is saved in this browser only):",
    );
    if (!name) return;
    const rec = saveProfile(name, watch());
    if (rec) setProfileId(rec.id);
    else
      setError(
        "This browser would not save the profile. Check that storage is allowed.",
      );
  };

  const pickProfile = (id: string) => {
    setProfileId(id);
    const p = profiles.find((x) => x.id === id);
    if (!p) return;
    Object.entries(p.params).forEach(([k, v]) => setValue(k as any, v as any));
    setPreset(null);
    setError(null);
  };

  const onDeleteProfile = () => {
    if (!profileId || !confirm("Delete this profile?")) return;
    deleteProfile(profileId);
    setProfileId("");
  };

  const view = useMemo(() => {
    if (!results) return null;
    const d: any[] = results.data;
    const names: string[] = Object.keys(d[0].by_role);
    const color = Object.fromEntries(
      names.map((n, i) => [n, PALETTE[i % PALETTE.length]]),
    );
    const alloc: Record<string, number> = Object.fromEntries(
      (results.params?.roles ?? roles).map((r: any) => [
        r.name,
        Number(r.allocation_pct) || 0,
      ]),
    );
    const order = [...names].sort((a, b) => (alloc[b] ?? 0) - (alloc[a] ?? 0));
    return {
      names,
      color,
      layers: order.map((n) => ({
        name: n,
        color: color[n],
        values: d.map((x) => x.by_role[n].unlocked as number),
      })),
      tot: d.map((x) => x.total_unlocked as number),
      eff: d.map((x) => x.effective_circulating as number),
      gov: d.map((x) => x.governance_locked as number),
      infl: d.map((x) => (x.monthly_inflation as number) * 100),
      n: d.length,
      rate: results.params?.annual_discount_rate ?? 0.1,
      supply: results.params?.total_supply ?? 1,
      s: results.summary,
    };
  }, [results, roles]);

  const stackAxis = view ? axisFor(Math.max(...view.tot)) : null;
  const cgAxis = view ? axisFor(Math.max(...view.eff, ...view.gov)) : null;
  const infAxis = view ? axisFor(Math.max(...view.infl)) : null;
  const xl = view ? monthLabels(view.n) : [];
  const mName = (i: number) => `Month ${i}`;
  const allocTone = totalAllocation > 100 ? "#f87171" : "#f5f5f7";

  return (
    <div className={`pgi${tab === "params" ? " hasbar" : ""}`}>
      <PageHeader help="/guide#vesting" kicker="Unlock model" title="Vesting Schedule Simulator">
        <div className="deskonly">
          <Chips items={PRESETS} active={preset} onPick={loadPreset} />
        </div>
        <button
          type="button"
          className="btn ghost"
          disabled={!results}
          onClick={() =>
            results &&
            csvDownload(
              results.data.map((d: any) => ({
                month: d.month,
                total_unlocked: d.total_unlocked,
                effective_circulating: d.effective_circulating,
                governance_locked: d.governance_locked,
                monthly_inflation: d.monthly_inflation,
              })),
              "vesting_simulation.csv",
            )
          }
        >
          Export CSV
          <Icon n="dl" style={{ width: 16, height: 16 }} />
        </button>
      </PageHeader>
      <div className="mobonly">
        <Chips items={PRESETS} active={preset} onPick={loadPreset} />
      </div>
      <MobileSeg tab={tab} onTab={setTab} hasResults={!!results} />

      {error ? (
        <div style={{ marginTop: 16 }}>
          <ErrorBox message={error} onClose={() => setError(null)} />
        </div>
      ) : null}

      <form
        id="vesting-form"
        className={tab === "results" ? "tab-hide" : undefined}
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div className="g3">
          <div className="panel">
            <div className="cph">
              <div>
                <h3>Vesting roles</h3>
                <div className="sub">
                  Allocation, cliff and vesting per stakeholder
                </div>
              </div>
              <div className="lg">
                <span>
                  Total allocation{" "}
                  <b style={{ color: allocTone, fontWeight: 500 }}>
                    {+totalAllocation.toFixed(1)}%
                  </b>
                </span>
              </div>
            </div>
            <table className="tbl">
              <colgroup>
                <col style={{ width: "18.89%" }} />
                <col style={{ width: "14.63%" }} />
                <col style={{ width: "15.56%" }} />
                <col style={{ width: "18.89%" }} />
                <col style={{ width: "12.59%" }} />
                <col style={{ width: "19.44%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Allocation %</th>
                  <th>Cliff (months)</th>
                  <th>Vesting (months)</th>
                  <th>Activation</th>
                  <th>Governance lock</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((f, i) => (
                  <tr key={f.id}>
                    <td data-label="">
                      <div className="rl">
                        <i
                          style={{ background: PALETTE[i % PALETTE.length] }}
                        />
                        <TextCell
                          control={control}
                          name={`roles.${i}.name` as const}
                          label="Role name"
                        />
                      </div>
                    </td>
                    <td data-label="Allocation">
                      <NumCell
                        control={control}
                        name={`roles.${i}.allocation_pct` as const}
                        label="Allocation %"
                        suffix="%"
                        rules={{ min: 0, max: 100 }}
                      />
                    </td>
                    <td data-label="Cliff (mo)">
                      <NumCell
                        control={control}
                        name={`roles.${i}.cliff_months` as const}
                        label="Cliff (months)"
                        rules={{ min: 0 }}
                      />
                    </td>
                    <td data-label="Vesting (mo)">
                      <NumCell
                        control={control}
                        name={`roles.${i}.vesting_months` as const}
                        label="Vesting (months)"
                        rules={{ min: 1 }}
                      />
                    </td>
                    <td data-label="Activation">
                      <NumCell
                        control={control}
                        name={`roles.${i}.activation_ratio` as const}
                        label="Activation"
                        scale={100}
                        suffix="%"
                        rules={{ min: 0, max: 1 }}
                      />
                    </td>
                    <td data-label="Governance lock">
                      <NumCell
                        control={control}
                        name={`roles.${i}.governance_fraction` as const}
                        label="Governance lock"
                        scale={100}
                        suffix="%"
                        rules={{ min: 0, max: 1 }}
                      />
                      {fields.length > 1 ? (
                        <button
                          type="button"
                          className="rm"
                          aria-label={`Remove ${roles[i]?.name ?? "role"}`}
                          onClick={() => remove(i)}
                        >
                          <Icon
                            n="plus"
                            style={{
                              transform: "rotate(45deg)",
                              width: 16,
                              height: 16,
                            }}
                          />
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 14 }}>
              <button
                type="button"
                className="btn ghost"
                style={{ height: 38, fontSize: 13, padding: "0 16px" }}
                onClick={addRole}
                disabled={fields.length >= 10}
              >
                <Icon n="plus" style={{ width: 14, height: 14 }} />
                Add role
              </button>
            </div>
          </div>

          <div className="panel">
            <h3>Base parameters</h3>
            <div className="sub">Supply and horizon</div>
            <div className="r2c">
              <NumField
                control={control}
                name="total_supply"
                label="Total supply"
                rules={{ required: true, min: 1 }}
              />
              <NumField
                control={control}
                name="months"
                label="Simulation months"
                unit="months"
                rules={{ required: true, min: 12, max: 240 }}
              />
            </div>
            <Group color="#a78bfa" title="Advanced options">
              <Toggle
                label="Add random noise to unlocks"
                on={!!stochastic}
                onChange={(v) => setValue("stochastic", v)}
              />
              <NumField
                control={control}
                name="annual_discount_rate"
                label="Annual discount rate"
                unit="%"
                scale={100}
                hint="For PV calculations (default: 10%)"
                rules={{ min: 0, max: 1 }}
              />
            </Group>
            <div className="fld">
              <label htmlFor="profile-select">Load profile</label>
              <div className="sel2">
                <select
                  id="profile-select"
                  value={profileId}
                  onChange={(e) => pickProfile(e.target.value)}
                >
                  <option value="">
                    {profiles.length
                      ? "Select a saved profile"
                      : "No saved profiles yet"}
                  </option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <Icon n="cd" style={{ width: 14, height: 14 }} />
              </div>
              {profileId ? (
                <div className="hint">
                  <button
                    type="button"
                    onClick={onDeleteProfile}
                    style={{ color: "#f87171", fontSize: 11 }}
                  >
                    Delete this profile
                  </button>
                </div>
              ) : null}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <button
                type="button"
                className="btn ghost"
                style={{ height: 48, borderRadius: 14, flex: 1, fontSize: 14 }}
                onClick={onSaveProfile}
              >
                Save profile
              </button>
              <button
                type="submit"
                className="btn lavb deskonly"
                style={{
                  height: 48,
                  borderRadius: 14,
                  flex: 1.4,
                  fontSize: 14,
                }}
                disabled={isLoading || totalAllocation > 100}
              >
                {isLoading ? "Running…" : "Run simulation"}
                <Icon n="flask" style={{ width: 16, height: 16 }} />
              </button>
            </div>
          </div>
        </div>
      </form>

      <div className={tab === "params" ? "tab-hide" : undefined}>
        {view && stackAxis && cgAxis && infAxis ? (
          <>
            <div
              className="kps"
              style={{
                gridTemplateColumns: "repeat(4,minmax(0,1fr))",
                marginTop: 20,
              }}
            >
              <Kpi
                runKey={runId}
                label="Total unlocked"
                parts={moneyParts(view.s.final_cumulative_unlocked)}
                delta={`${((view.s.final_cumulative_unlocked / view.supply) * 100).toFixed(1)}% of supply`}
                tone="g"
              />
              <Kpi
                runKey={runId}
                label="Circulating"
                parts={moneyParts(view.s.final_effective_circulating)}
                delta={`${((view.s.final_effective_circulating / view.supply) * 100).toFixed(1)}% of supply`}
              />
              <Kpi
                runKey={runId}
                label="Gov locked"
                parts={moneyParts(view.s.final_governance_locked)}
                delta={`${view.s.final_cumulative_unlocked ? ((view.s.final_governance_locked / view.s.final_cumulative_unlocked) * 100).toFixed(1) : "0.0"}% of unlocked`}
              />
              <Kpi
                runKey={runId}
                label="Present value"
                parts={moneyParts(view.s.pv_unlocked)}
                delta={`At ${Math.round(view.rate * 100)}% discount rate`}
              />
            </div>

            <ChartPanel
              title="Cumulative unlocks by role"
              sub={`Stacked token unlocks over ${view.n} months`}
              legend={
                <Legend
                  items={view.names.map((n) => ({
                    color: view.color[n],
                    text: n,
                  }))}
                />
              }
            >
              <Chart
                defaultWidth={1098}
                label="Cumulative unlocks by role"
                y={{
                  min: stackAxis.min,
                  max: stackAxis.max,
                  ticks: stackAxis.ticks,
                  fmt: compact,
                }}
                xLabels={xl}
                xName={mName}
                valueFmt={compact}
                layers={[{ type: "stack", layers: view.layers }]}
              />
            </ChartPanel>

            <div className="cols2">
              <ChartPanel
                className="cp0"
                title="Circulating vs governance-locked"
                sub="Tokens by availability"
              >
                <Chart
                  defaultWidth={520}
                  height={230}
                  label="Circulating versus governance-locked tokens"
                  y={{
                    min: cgAxis.min,
                    max: cgAxis.max,
                    ticks: cgAxis.ticks,
                    fmt: compact,
                  }}
                  xLabels={xl}
                  xName={mName}
                  valueFmt={compact}
                  layers={[
                    {
                      type: "line",
                      name: "Circulating",
                      values: view.eff,
                      color: "#a78bfa",
                      fill: 0.14,
                    },
                    {
                      type: "line",
                      name: "Gov locked",
                      values: view.gov,
                      color: "#fbbf24",
                      fill: 0.1,
                    },
                  ]}
                />
                <div className="lg" style={{ marginTop: 8 }}>
                  <span>
                    <i style={{ background: "#a78bfa" }} />
                    Circulating
                  </span>
                  <span>
                    <i style={{ background: "#fbbf24" }} />
                    Gov locked
                  </span>
                </div>
              </ChartPanel>
              <ChartPanel
                className="cp0"
                title="Monthly inflation rate"
                sub="New circulating tokens as % of total supply"
              >
                <Chart
                  defaultWidth={520}
                  height={230}
                  label="Monthly inflation rate"
                  y={{
                    min: infAxis.min,
                    max: infAxis.max,
                    ticks: infAxis.ticks,
                    fmt: percentLabel,
                  }}
                  xLabels={xl}
                  xName={mName}
                  valueFmt={(v) => `${v.toFixed(3)}%`}
                  layers={[
                    {
                      type: "bars",
                      name: "Inflation",
                      values: view.infl,
                      color: "#6d4cf5",
                    },
                  ]}
                />
              </ChartPanel>
            </div>
          </>
        ) : (
          <div style={{ marginTop: 20 }}>
            <EmptyState
              title={isLoading ? "Running simulation" : "No simulation yet"}
              text={
                isLoading
                  ? "Calculating unlock schedules…"
                  : 'Add roles, set cliffs and vesting periods, then press "Run simulation".'
              }
            />
          </div>
        )}
      </div>
      {tab === "params" ? (
        <div className="runbar">
          <button
            type="submit"
            form="vesting-form"
            className="btn lavb"
            disabled={isLoading || totalAllocation > 100}
          >
            {isLoading ? "Running…" : "Run simulation"}
            <Icon n="flask" style={{ width: 18, height: 18 }} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
