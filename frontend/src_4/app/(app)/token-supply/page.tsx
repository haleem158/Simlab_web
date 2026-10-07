"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import apiClient from "@/lib/api";
import { getRun, saveRun, supplyRecord } from "@/lib/runs";
import type {
  MonteCarloResponse,
  TokenSupplyParams,
  TokenSupplyResponse,
} from "@/lib/types";
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
  NumField,
  PageHeader,
  PctRange,
  Toggle,
} from "@/components/sl/kit";
import {
  axisFor,
  compact,
  csvDownload,
  moneyParts,
  pctDelta,
  priceLabel,
  priceParts,
  yearLabels,
} from "@/lib/charts";

const PRESETS = [
  { id: "Bitcoin-Style", label: "Bitcoin-style" },
  { id: "PoS Staking Protocol", label: "PoS staking protocol" },
  { id: "Deflationary DeFi", label: "Deflationary DeFi" },
];

const DEFAULTS: TokenSupplyParams = {
  total_supply: 1_000_000_000,
  initial_supply: 100_000_000,
  initial_locked: 0,
  years: 20,
  annual_inflation_rate: 0.05,
  min_inflation_rate: 0.01,
  inflation_decay_rate: 0.5,
  inflation_applies_to: "circulating",
  staking_rate: 0.4,
  staking_adoption_slope: 0,
  staking_reward_share: 0.75,
  burn_rate: 0.02,
  tx_activity_index: 1.0,
  vesting_months: 0,
  vesting_curve: "linear",
  demand_index_base: 1.0,
  demand_growth_rate: 0.02,
  price_scale: 1.0,
  stochastic: false,
  inflation_volatility_monthly: 0.01,
  runs: 50,
  seed: null,
  stop_if_cap_reached: true,
};

const last = <T,>(a: T[]) => a[a.length - 1];

export default function TokenSupplySimulator() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<TokenSupplyResponse | null>(null);
  const [mcResults, setMcResults] = useState<MonteCarloResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<string | null>(null);
  const [runId, setRunId] = useState(0);
  const [tab, setTab] = useState<SimTab>("params");
  const [ranParams, setRanParams] = useState<{
    initial_supply: number;
    total_supply: number;
  } | null>(null);

  const { control, handleSubmit, watch, setValue, reset } =
    useForm<TokenSupplyParams>({ defaultValues: DEFAULTS });
  const stochastic = watch("stochastic");

  // "Re-run" from the dashboard: start from the settings of that run
  useEffect(() => {
    const rec = getRun(new URLSearchParams(window.location.search).get("run"));
    if (rec && rec.type === "supply")
      reset({ ...DEFAULTS, ...(rec.params as Partial<TokenSupplyParams>) });
  }, [reset]);

  // Test-only: load the approved mock's data so the page can be pixel-compared.
  useEffect(() => {
    if (
      process.env.NEXT_PUBLIC_VISUAL_TEST !== "1" ||
      new URLSearchParams(window.location.search).get("fixture") !== "1"
    )
      return;
    import("@/lib/fixtures.json").then((m) => {
      const f = (m as any).default.supply;
      reset({ ...DEFAULTS, ...f.params });
      setPreset(f.preset);
      setMcResults(f.mc);
      setRanParams({
        initial_supply: f.params.initial_supply,
        total_supply: f.params.total_supply,
      });
      setRunId((n) => n + 1);
    });
  }, [reset]);

  const onSubmit = async (data: TokenSupplyParams) => {
    setIsLoading(true);
    setError(null);
    setResults(null);
    setMcResults(null);
    setRanParams({
      initial_supply: Number(data.initial_supply),
      total_supply: Number(data.total_supply),
    });
    try {
      if (data.stochastic && data.runs > 1) {
        const r = (await apiClient.monteCarloTokenSupply(
          data,
        )) as MonteCarloResponse;
        setMcResults(r);
        saveRun(supplyRecord(data, { mc: r }));
        setTab("results");
      } else {
        const r = (await apiClient.simulateTokenSupply(
          data,
        )) as TokenSupplyResponse;
        setResults(r);
        saveRun(supplyRecord(data, { det: r }));
        setTab("results");
      }
      setRunId((n) => n + 1);
    } catch (err: any) {
      setError(err.message || "Simulation failed");
    } finally {
      setIsLoading(false);
    }
  };

  const loadPreset = async (presetName: string) => {
    try {
      const presets = await apiClient.getTokenSupplyPresets();
      const found = presets.find((p: any) => p.name === presetName);
      if (found) {
        Object.entries(found.params).forEach(([key, value]) =>
          setValue(key as any, value as any),
        );
        setPreset(presetName);
        setError(null);
      }
    } catch {
      setError("Failed to load preset");
    }
  };

  // One shape for both deterministic and Monte Carlo runs
  const view = useMemo(() => {
    if (mcResults) {
      const a = mcResults.aggregated_data;
      return {
        mc: true,
        params: ranParams ?? { initial_supply: 1, total_supply: 1 },
        runs: mcResults.summary.total_runs,
        years: (mcResults.metadata?.total_months ?? a.length - 1) / 12,
        circ: a.map((d) => d.circulating_mean),
        stak: a.map((d) => d.staked_mean),
        burn: a.map((d) => d.burned_mean),
        price: a.map((d) => d.price_mean),
        lo: a.map((d) => Math.max(0, d.price_mean - d.price_std)),
        hi: a.map((d) => d.price_mean + d.price_std),
        finals: {
          circ: mcResults.summary.final_circulating_mean,
          burn: mcResults.summary.final_burned_mean,
          stak: last(a).staked_mean,
          price: mcResults.summary.final_price_mean,
        },
        rows: a as unknown as Record<string, unknown>[],
      };
    }
    if (results) {
      const d = results.data;
      return {
        mc: false,
        params: ranParams ?? { initial_supply: 1, total_supply: 1 },
        runs: 0,
        years: results.summary.effective_years ?? (d.length - 1) / 12,
        circ: d.map((x) => x.circulating),
        stak: d.map((x) => x.staked_supply),
        burn: d.map((x) => x.burned_cumulative),
        price: d.map((x) => x.price),
        lo: [] as number[],
        hi: [] as number[],
        finals: {
          circ: results.summary.final_circulating,
          burn: results.summary.final_burned,
          stak: results.summary.final_staked,
          price: results.summary.final_price,
        },
        rows: d as unknown as Record<string, unknown>[],
      };
    }
    return null;
  }, [results, mcResults, ranParams]);

  const supplyAxis = view
    ? axisFor(Math.max(...view.circ, ...view.stak, ...view.burn))
    : null;
  const priceAxis = view
    ? axisFor(Math.max(...view.price, ...(view.mc ? view.hi : [])))
    : null;
  const priceStep = priceAxis ? (priceAxis.max - priceAxis.min) / 4 : 1;
  const yrs = view ? yearLabels(view.years) : [];
  const monthName = (i: number) => `Month ${i} · Year ${(i / 12).toFixed(1)}`;

  return (
    <div className={`pgi${tab === "params" ? " hasbar" : ""}`}>
      <PageHeader kicker="Supply model" title="Token Supply Simulator">
        <button
          type="button"
          className="btn ghost"
          disabled={!view}
          onClick={() =>
            view && csvDownload(view.rows, "token_supply_simulation.csv")
          }
        >
          Export CSV
          <Icon n="dl" style={{ width: 16, height: 16 }} />
        </button>
        <button
          type="submit"
          form="supply-form"
          className="btn lavb"
          disabled={isLoading}
        >
          {isLoading ? "Running…" : "Run simulation"}
          <Icon n="flask" style={{ width: 16, height: 16 }} />
        </button>
      </PageHeader>

      <MobileSeg tab={tab} onTab={setTab} hasResults={!!view} />

      <div className="g2">
        <form
          id="supply-form"
          className={`panel${tab === "results" ? " tab-hide" : ""}`}
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <h3>Simulation parameters</h3>
          <div className="sub">Tune the emission, staking and burn model</div>
          <div className="fld">
            <label>Load preset scenario</label>
            <Chips items={PRESETS} active={preset} onPick={loadPreset} />
          </div>
          <div className="r2c">
            <NumField
              control={control}
              name="total_supply"
              label="Total supply"
              rules={{ required: true, min: 1 }}
            />
            <NumField
              control={control}
              name="initial_supply"
              label="Initial supply"
              rules={{ required: true, min: 0 }}
            />
          </div>
          <NumField
            control={control}
            name="years"
            label="Years to simulate"
            unit="years"
            rules={{ required: true, min: 1, max: 200 }}
          />

          <Group color="#38bdf8" title="Inflation parameters">
            <PctRange
              control={control}
              name="annual_inflation_rate"
              label="Annual inflation rate"
              minPct={0}
              maxPct={15}
              hint="Typical: 3-10% for new protocols"
            />
            <PctRange
              control={control}
              name="min_inflation_rate"
              label="Minimum inflation floor"
              minPct={0}
              maxPct={5}
              hint="Long-term floor: 0.5-2%"
            />
          </Group>
          <Group color="#34d399" title="Staking parameters">
            <PctRange
              control={control}
              name="staking_rate"
              label="Staking participation rate"
              minPct={0}
              maxPct={100}
              stepPct={1}
              digits={0}
              hint="Mature PoS: 30-70% staked"
            />
          </Group>
          <Group color="#f87171" title="Burn mechanism">
            <PctRange
              control={control}
              name="burn_rate"
              label="Annual burn rate"
              minPct={0}
              maxPct={5}
              hint="Typical: 0.1-3% annually"
            />
          </Group>
          <Group color="#a78bfa" title="Monte Carlo simulation">
            <Toggle
              label="Enable stochastic mode"
              on={!!stochastic}
              onChange={(v) => setValue("stochastic", v)}
            />
            <NumField
              control={control}
              name="runs"
              label="Number of runs"
              unit="runs"
              hint="Recommended: 50-200 runs"
              rules={{ required: !!stochastic, min: 1, max: 500 }}
            />
          </Group>
          <button type="submit" className="btn lavb runb" disabled={isLoading}>
            {isLoading ? "Running simulation…" : "Run simulation"}
            <Icon n="flask" style={{ width: 16, height: 16 }} />
          </button>
        </form>

        <div className={tab === "params" ? "tab-hide" : undefined}>
          {error ? (
            <ErrorBox message={error} onClose={() => setError(null)} />
          ) : null}
          {view && supplyAxis && priceAxis ? (
            <>
              <div
                className="kps"
                style={{ gridTemplateColumns: "repeat(4,minmax(0,1fr))" }}
              >
                <Kpi
                  runKey={runId}
                  label="Final circulating"
                  parts={moneyParts(view.finals.circ)}
                  delta={`${pctDelta((view.finals.circ / view.circ[0] - 1) * 100)} vs. start`}
                  tone={view.finals.circ >= view.circ[0] ? "g" : "r"}
                />
                <Kpi
                  runKey={runId}
                  label="Final burned"
                  parts={moneyParts(view.finals.burn)}
                  delta={`${((view.finals.burn / view.params.total_supply) * 100).toFixed(1)}% of supply`}
                  tone="r"
                />
                <Kpi
                  runKey={runId}
                  label="Final staked"
                  parts={moneyParts(view.finals.stak)}
                  delta={`${((view.finals.stak / view.finals.circ) * 100).toFixed(1)}% of circulating`}
                />
                <Kpi
                  runKey={runId}
                  label="Final price"
                  parts={priceParts(view.finals.price)}
                  delta={`${pctDelta((view.finals.price / view.price[0] - 1) * 100)} vs. start`}
                  tone={view.finals.price >= view.price[0] ? "g" : "r"}
                />
              </div>

              <ChartPanel
                title="Supply dynamics"
                sub={`Circulating, staked and burned supply over ${+view.years.toFixed(1)} years`}
                legend={
                  <Legend
                    items={[
                      { color: "#a78bfa", text: "Circulating" },
                      { color: "#38bdf8", text: "Staked" },
                      { color: "#f87171", text: "Burned" },
                    ]}
                  />
                }
              >
                <Chart
                  defaultWidth={678}
                  label="Supply dynamics chart"
                  y={{
                    min: supplyAxis.min,
                    max: supplyAxis.max,
                    ticks: supplyAxis.ticks,
                    fmt: compact,
                  }}
                  xLabels={yrs}
                  xName={monthName}
                  valueFmt={compact}
                  layers={[
                    {
                      type: "line",
                      name: "Circulating",
                      values: view.circ,
                      color: "#a78bfa",
                      fill: 0.16,
                    },
                    {
                      type: "line",
                      name: "Staked",
                      values: view.stak,
                      color: "#38bdf8",
                      fill: 0.1,
                    },
                    {
                      type: "line",
                      name: "Burned",
                      values: view.burn,
                      color: "#f87171",
                      fill: 0.1,
                    },
                  ]}
                />
              </ChartPanel>

              <ChartPanel
                title="Price trajectory"
                sub={
                  view.mc
                    ? `Mean of ${view.runs} Monte Carlo runs with a ±1 standard deviation band`
                    : "Simulated token price over the period"
                }
                legend={
                  <Legend
                    items={
                      view.mc
                        ? [
                            { color: "#a78bfa", text: "Mean" },
                            { color: "#4b3f8f", text: "±1 std dev" },
                          ]
                        : [{ color: "#a78bfa", text: "Price" }]
                    }
                  />
                }
              >
                <Chart
                  defaultWidth={678}
                  label="Price trajectory chart"
                  y={{
                    min: priceAxis.min,
                    max: priceAxis.max,
                    ticks: priceAxis.ticks,
                    fmt: (v) => priceLabel(v, priceStep),
                  }}
                  xLabels={yrs}
                  xName={monthName}
                  valueFmt={(v) => `$${v.toPrecision(3)}`}
                  layers={
                    view.mc
                      ? [
                          {
                            type: "band",
                            lo: view.lo,
                            hi: view.hi,
                            color: "#a78bfa",
                          },
                          {
                            type: "line",
                            values: view.hi,
                            color: "#a78bfa",
                            dash: true,
                            w: 1.2,
                          },
                          {
                            type: "line",
                            values: view.lo,
                            color: "#a78bfa",
                            dash: true,
                            w: 1.2,
                          },
                          {
                            type: "line",
                            name: "Mean",
                            values: view.price,
                            color: "#a78bfa",
                            w: 2.4,
                          },
                        ]
                      : [
                          {
                            type: "line",
                            name: "Price",
                            values: view.price,
                            color: "#a78bfa",
                            w: 2.4,
                          },
                        ]
                  }
                />
              </ChartPanel>
            </>
          ) : !isLoading ? (
            <EmptyState
              title="No simulation yet"
              text='Set your parameters and press "Run simulation" to see supply, staking, burn and price results.'
            />
          ) : (
            <EmptyState
              title="Running simulation"
              text="This can take a few seconds for large Monte Carlo runs."
            />
          )}
        </div>
      </div>
      {tab === "params" ? (
        <div className="runbar">
          <button
            type="submit"
            form="supply-form"
            className="btn lavb"
            disabled={isLoading}
          >
            {isLoading ? "Running…" : "Run simulation"}
            <Icon n="flask" style={{ width: 18, height: 18 }} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
