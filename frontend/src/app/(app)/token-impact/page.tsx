"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import Papa from "papaparse";
import apiClient from "@/lib/api";
import { getRun, impactRecord, saveRun } from "@/lib/runs";
import { Icon } from "@/components/sl/Icon";
import { MobileSeg, type SimTab } from "@/components/sl/MobileSeg";
import { Chart } from "@/components/sl/Chart";
import {
  ChartPanel,
  EmptyState,
  ErrorBox,
  Group,
  Kpi,
  Legend,
  NumField,
  PageHeader,
  PlainRange,
  Seg,
  Toggle,
} from "@/components/sl/kit";
import {
  axisFor,
  csvDownload,
  evenLabels,
  moneyParts,
  pctDelta,
  priceLabel,
  priceParts,
} from "@/lib/charts";

interface CSVRow {
  month: string;
  unlocked_tokens: number;
  emission: number;
  tx_volume_growth_pct: number;
  staking_growth_pct: number;
  locked?: number;
  staked?: number;
}

interface Form {
  initial_circ_supply: number;
  V0_tx: number;
  V0_stake: number;
  alpha: number;
  epsilon: number;
  calibrate: boolean;
  anchor_mode: "current_price" | "current_market_cap" | "none";
  anchor_price?: number;
  anchor_market_cap?: number;
  smoothing_window: number;
  run_monte_carlo: boolean;
  mc_runs: number;
}

const DEFAULTS: Form = {
  initial_circ_supply: 0,
  V0_tx: 1.0,
  V0_stake: 1.0,
  alpha: 0.6,
  epsilon: 1.0,
  calibrate: false,
  anchor_mode: "none",
  smoothing_window: 1,
  run_monte_carlo: false,
  mc_runs: 200,
};

const TEMPLATE = `Month,Unlocked Tokens,Emission,Transaction Volume Growth (%),Staking Participation Growth (%),Locked,Staked
2025-01-01,100000,50000,10,5,20000,30000
2025-02-01,120000,60000,12,6,21000,35000
2025-03-01,110000,55000,8,4,22000,31000`;

const ANCHOR_MODES = [
  { id: "none", label: "None" },
  { id: "current_price", label: "Known price" },
  { id: "current_market_cap", label: "Market cap" },
];

export default function TokenImpactModel() {
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runId, setRunId] = useState(0);
  const [tab, setTab] = useState<SimTab>("params");
  const [ranParams, setRanParams] = useState<Form | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { control, handleSubmit, watch, setValue, reset } = useForm<Form>({
    defaultValues: DEFAULTS,
  });
  const calibrate = watch("calibrate");
  const anchorMode = watch("anchor_mode");
  const runMc = watch("run_monte_carlo");

  useEffect(() => {
    const rec = getRun(new URLSearchParams(window.location.search).get("run"));
    if (rec && rec.type === "impact")
      reset({ ...DEFAULTS, ...(rec.params as Partial<Form>) });
  }, [reset]);

  useEffect(() => {
    if (
      process.env.NEXT_PUBLIC_VISUAL_TEST !== "1" ||
      new URLSearchParams(window.location.search).get("fixture") !== "1"
    )
      return;
    import("@/lib/fixtures.json").then((m) => {
      const f = (m as any).default.impact;
      reset({ ...DEFAULTS, ...f.params });
      setResults(f.result);
      setRanParams({ ...DEFAULTS, ...f.params });
      setRunId((n) => n + 1);
    });
  }, [reset]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (r) => {
        const rows = (r.data as any[])
          .filter((row) => row.Month || row.month)
          .map((row) => ({
            month: String(row.Month || row.month),
            unlocked_tokens: parseFloat(
              row["Unlocked Tokens"] || row.unlocked_tokens || 0,
            ),
            emission: parseFloat(row.Emission || row.emission || 0),
            tx_volume_growth_pct: parseFloat(
              row["Transaction Volume Growth (%)"] ||
                row.tx_volume_growth_pct ||
                0,
            ),
            staking_growth_pct: parseFloat(
              row["Staking Participation Growth (%)"] ||
                row.staking_growth_pct ||
                0,
            ),
            locked: parseFloat(row.Locked || row.locked || 0),
            staked: parseFloat(row.Staked || row.staked || 0),
          }));
        setCsvData(rows);
        setError(
          rows.length
            ? null
            : "No rows found. Check that the CSV has a Month column.",
        );
      },
      error: (err) => setError(`CSV parsing error: ${err.message}`),
    });
    e.target.value = "";
  };

  const loadSample = async () => {
    try {
      const res = await apiClient.getSampleCSV();
      setCsvData(res.data);
      setError(null);
    } catch {
      setError("Failed to load sample CSV");
    }
  };

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob([TEMPLATE], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "simlab_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onSubmit = async (data: Form) => {
    if (csvData.length === 0) {
      setError("Please upload CSV data or load sample data first");
      return;
    }
    setIsLoading(true);
    setError(null);
    setResults(null);
    setRanParams(data);
    try {
      const r = await apiClient.simulateTokenImpact({
        csv_data: csvData,
        ...data,
      });
      setResults(r);
      saveRun(impactRecord(data, r));
      setTab("results");
      setRunId((n) => n + 1);
    } catch (err: any) {
      setError(err.message || "Simulation failed");
    } finally {
      setIsLoading(false);
    }
  };

  const view = useMemo(() => {
    if (!results) return null;
    const d: any[] = results.data;
    const supply = d.map((x) => x.effective_supply as number);
    const demand = d.map((x) => x.demand_index as number);
    const mc: any[] | null =
      results.mc && results.mc.length ? results.mc : null;
    return {
      months: d.map((x) => String(x.month)),
      supplyIdx: supply.map((v) => v / supply[0]),
      demandIdx: demand.map((v) => v / demand[0]),
      price: d.map((x) => x.indicative_price as number),
      p25: mc?.map((x) => x.price_p25 as number) ?? [],
      p50: mc?.map((x) => x.price_median as number) ?? [],
      p75: mc?.map((x) => x.price_p75 as number) ?? [],
      mc: !!mc,
      runs: ranParams?.mc_runs ?? 0,
      anchor:
        ranParams?.calibrate && ranParams?.anchor_mode === "current_price"
          ? (ranParams?.anchor_price ?? null)
          : null,
      s: results.summary,
      supplyFirst: supply[0],
      supplyLast: supply[supply.length - 1],
      rows: d as Record<string, unknown>[],
    };
  }, [results, ranParams]);

  const idxMin = view
    ? Math.min(
        0.5,
        Math.floor(Math.min(...view.supplyIdx, ...view.demandIdx) * 2) / 2,
      )
    : 0.5;
  const dynAxis = view
    ? axisFor(Math.max(...view.supplyIdx, ...view.demandIdx) * 1.2, idxMin)
    : null;
  const priceLine = view ? (view.mc ? view.p50 : view.price) : [];
  const priceAxis = view
    ? axisFor(Math.max(...priceLine, ...(view.mc ? view.p75 : [])))
    : null;
  const priceStep = priceAxis ? (priceAxis.max - priceAxis.min) / 4 : 1;
  const xl = view ? evenLabels(view.months) : [];
  const mName = (i: number) => view?.months[i] ?? "";
  const uncal = !!ranParams && !ranParams.calibrate;
  const priceSub =
    (view?.mc
      ? `Median of ${view.runs} runs with 25th to 75th percentile band`
      : "Indicative price over the data period") +
    (uncal
      ? ". Uncalibrated: turn on price calibration for realistic values."
      : "");
  const priceRef = view ? (view.anchor ?? view.price[0]) : 1;

  return (
    <div className={`pgi${tab === "params" ? " hasbar" : ""}`}>
      <PageHeader help="/guide#price-impact" kicker="Market model" title="Token Price Impact Model">
        <button
          type="button"
          className="btn ghost"
          disabled={!view}
          onClick={() =>
            view && csvDownload(view.rows, "token_impact_simulation.csv")
          }
        >
          Export CSV
          <Icon n="dl" style={{ width: 16, height: 16 }} />
        </button>
        <button
          type="submit"
          form="impact-form"
          className="btn lavb"
          disabled={isLoading}
        >
          {isLoading ? "Running…" : "Run analysis"}
          <Icon n="flask" style={{ width: 16, height: 16 }} />
        </button>
      </PageHeader>

      <MobileSeg tab={tab} onTab={setTab} hasResults={!!view} />

      <div className="g2">
        <form
          id="impact-form"
          className={`panel${tab === "results" ? " tab-hide" : ""}`}
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <h3>Configuration</h3>
          <div className="sub">Calibrate the demand and supply response</div>
          <div className="fld">
            <label>Data input</label>
            <div
              className="drop"
              role="button"
              tabIndex={0}
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") && fileRef.current?.click()
              }
            >
              <Icon n="up" style={{ width: 22, height: 22 }} />
              <span>
                {csvData.length
                  ? `${csvData.length} months loaded`
                  : "Upload CSV of monthly activity"}
              </span>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                onChange={handleFile}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="lnk">
              <button type="button" onClick={loadSample}>
                <Icon n="up" style={{ width: 14, height: 14 }} />
                Load sample CSV
              </button>
              <button type="button" onClick={downloadTemplate}>
                <Icon n="dl" style={{ width: 14, height: 14 }} />
                Download template
              </button>
            </div>
            {csvData.length > 0 ? (
              <div className="ok">✓ Loaded {csvData.length} months of data</div>
            ) : null}
          </div>

          <Group color="#38bdf8" title="Base parameters">
            <NumField
              control={control}
              name="initial_circ_supply"
              label="Initial circulating supply"
              unit="tokens"
              hint="Tokens in circulation before data period"
            />
          </Group>
          <Group color="#34d399" title="Demand parameters">
            <div className="r2c">
              <NumField
                control={control}
                name="V0_tx"
                label="Transaction base (V0_tx)"
              />
              <NumField
                control={control}
                name="V0_stake"
                label="Staking base (V0_stake)"
              />
            </div>
            <div className="hint">
              Starting transaction and staking activity levels
            </div>
            <PlainRange
              control={control}
              name="alpha"
              label="Transaction weight (α)"
              min={0}
              max={1}
              step={0.01}
            />
          </Group>
          <Group color="#fbbf24" title="Price calibration">
            <Toggle
              label="Enable price calibration"
              on={!!calibrate}
              onChange={(v) => setValue("calibrate", v)}
            />
            {calibrate ? (
              <>
                <div className="fld">
                  <label>Calibration method</label>
                  <Seg
                    items={ANCHOR_MODES}
                    active={anchorMode}
                    onPick={(id) =>
                      setValue("anchor_mode", id as Form["anchor_mode"])
                    }
                  />
                </div>
                {anchorMode === "current_price" ? (
                  <NumField
                    control={control}
                    name="anchor_price"
                    label="Anchor price"
                    unit="USD"
                    prefix="$"
                  />
                ) : null}
                {anchorMode === "current_market_cap" ? (
                  <NumField
                    control={control}
                    name="anchor_market_cap"
                    label="Market cap"
                    unit="USD"
                  />
                ) : null}
              </>
            ) : null}
            <PlainRange
              control={control}
              name="epsilon"
              label="Supply elasticity (ε)"
              min={0.1}
              max={2}
              step={0.05}
              hint="Price sensitivity to supply changes"
            />
          </Group>
          <Group color="#a78bfa" title="Monte Carlo analysis">
            <Toggle
              label="Run uncertainty analysis"
              on={!!runMc}
              onChange={(v) => setValue("run_monte_carlo", v)}
            />
            <NumField
              control={control}
              name="mc_runs"
              label="Number of runs"
              unit="runs"
              hint="Recommended: 100-500 runs"
              disabled={!runMc}
            />
          </Group>
          <button type="submit" className="btn lavb runb" disabled={isLoading}>
            {isLoading ? "Running analysis…" : "Run analysis"}
            <Icon n="flask" style={{ width: 16, height: 16 }} />
          </button>
        </form>

        <div className={tab === "params" ? "tab-hide" : undefined}>
          {error ? (
            <ErrorBox message={error} onClose={() => setError(null)} />
          ) : null}
          {view && dynAxis && priceAxis ? (
            <>
              <div
                className="kps"
                style={{ gridTemplateColumns: "repeat(3,minmax(0,1fr))" }}
              >
                <Kpi
                  runKey={runId}
                  label="Final supply"
                  parts={moneyParts(view.s.final_effective_supply)}
                  delta={`${pctDelta((view.supplyLast / view.supplyFirst - 1) * 100)} vs. start`}
                  tone={view.supplyLast >= view.supplyFirst ? "g" : "r"}
                />
                <Kpi
                  runKey={runId}
                  label="Demand index"
                  parts={{
                    to: view.s.final_demand_index,
                    dec: 2,
                    pre: "",
                    suf: "",
                  }}
                  delta={`${pctDelta((view.demandIdx[view.demandIdx.length - 1] - 1) * 100)} vs. start`}
                  tone={
                    view.demandIdx[view.demandIdx.length - 1] >= 1 ? "g" : "r"
                  }
                />
                <Kpi
                  runKey={runId}
                  label="Final price"
                  parts={priceParts(view.s.final_price)}
                  delta={`${pctDelta((view.s.final_price / priceRef - 1) * 100)} ${view.anchor ? "vs. anchor" : "vs. start"}`}
                  tone={view.s.final_price >= priceRef ? "g" : "r"}
                />
              </div>

              <ChartPanel
                title="Supply & demand dynamics"
                sub="Supply and demand indices relative to month 0"
                legend={
                  <Legend
                    items={[
                      { color: "#a78bfa", text: "Supply index" },
                      { color: "#34d399", text: "Demand index" },
                    ]}
                  />
                }
              >
                <Chart
                  defaultWidth={678}
                  label="Supply and demand indices"
                  y={{
                    min: dynAxis.min,
                    max: dynAxis.max,
                    ticks: dynAxis.ticks,
                    fmt: (v) => v.toFixed(1),
                  }}
                  xLabels={xl}
                  xName={mName}
                  valueFmt={(v) => v.toFixed(2)}
                  layers={[
                    {
                      type: "line",
                      name: "Supply index",
                      values: view.supplyIdx,
                      color: "#a78bfa",
                      fill: 0.12,
                    },
                    {
                      type: "line",
                      name: "Demand index",
                      values: view.demandIdx,
                      color: "#34d399",
                      fill: 0.1,
                    },
                  ]}
                />
              </ChartPanel>

              <ChartPanel
                title="Price trajectory"
                sub={priceSub}
                legend={
                  <Legend
                    items={
                      view.mc
                        ? [
                            { color: "#a78bfa", text: "Median" },
                            { color: "#4b3f8f", text: "P25 to P75" },
                          ]
                        : [{ color: "#a78bfa", text: "Price" }]
                    }
                  />
                }
              >
                <Chart
                  defaultWidth={678}
                  label="Price trajectory"
                  y={{
                    min: priceAxis.min,
                    max: priceAxis.max,
                    ticks: priceAxis.ticks,
                    fmt: (v) => priceLabel(v, priceStep),
                  }}
                  xLabels={xl}
                  xName={mName}
                  valueFmt={(v) => `$${v.toPrecision(3)}`}
                  layers={
                    view.mc
                      ? [
                          {
                            type: "band",
                            lo: view.p25,
                            hi: view.p75,
                            color: "#a78bfa",
                          },
                          {
                            type: "line",
                            values: view.p75,
                            color: "#a78bfa",
                            dash: true,
                            w: 1.2,
                          },
                          {
                            type: "line",
                            values: view.p25,
                            color: "#a78bfa",
                            dash: true,
                            w: 1.2,
                          },
                          {
                            type: "line",
                            name: "Median",
                            values: view.p50,
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
          ) : (
            <EmptyState
              title={isLoading ? "Running analysis" : "No analysis yet"}
              text={
                isLoading
                  ? "Calculating demand and price response…"
                  : 'Upload a CSV or load the sample data, then press "Run analysis". The CSV needs Month, Unlocked Tokens, Emission, Transaction Volume Growth (%) and Staking Participation Growth (%).'
              }
            />
          )}
        </div>
      </div>
      {tab === "params" ? (
        <div className="runbar">
          <button type="submit" form="impact-form" className="btn lavb" disabled={isLoading}>
            {isLoading ? "Running…" : "Run analysis"}
            <Icon n="flask" style={{ width: 18, height: 18 }} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
