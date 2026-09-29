// frontend/src/app/token-impact/page.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Upload, Download, Loader2, Info, ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';
import Papa from 'papaparse';
import apiClient from '@/lib/api';

interface CSVRow {
  month: string;
  unlocked_tokens: number;
  emission: number;
  tx_volume_growth_pct: number;
  staking_growth_pct: number;
  locked?: number;
  staked?: number;
}

interface TokenImpactParams {
  csv_data: CSVRow[];
  initial_circ_supply: number;
  V0_tx: number;
  V0_stake: number;
  alpha: number;
  epsilon: number;
  calibrate: boolean;
  anchor_mode: 'current_price' | 'current_market_cap' | 'none';
  anchor_price?: number;
  anchor_market_cap?: number;
  smoothing_window: number;
  run_monte_carlo: boolean;
  mc_runs: number;
}

export default function TokenImpactModel() {
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue } = useForm<Omit<TokenImpactParams, 'csv_data'>>({
    defaultValues: {
      initial_circ_supply: 0,
      V0_tx: 1.0,
      V0_stake: 1.0,
      alpha: 0.6,
      epsilon: 1.0,
      calibrate: false,
      anchor_mode: 'none',
      smoothing_window: 1,
      run_monte_carlo: false,
      mc_runs: 200,
    }
  });

  const calibrate = watch('calibrate');
  const anchorMode = watch('anchor_mode');
  const runMonteCarlo = watch('run_monte_carlo');

  // Handle CSV file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        const data = results.data as any[];
        const formatted = data
          .filter(row => row.Month) // Filter out empty rows
          .map(row => ({
            month: row.Month || row.month,
            unlocked_tokens: parseFloat(row['Unlocked Tokens'] || row.unlocked_tokens || 0),
            emission: parseFloat(row.Emission || row.emission || 0),
            tx_volume_growth_pct: parseFloat(row['Transaction Volume Growth (%)'] || row.tx_volume_growth_pct || 0),
            staking_growth_pct: parseFloat(row['Staking Participation Growth (%)'] || row.staking_growth_pct || 0),
            locked: parseFloat(row.Locked || row.locked || 0),
            staked: parseFloat(row.Staked || row.staked || 0),
          }));
        
        setCsvData(formatted);
        setError(null);
      },
      error: (error) => {
        setError(`CSV parsing error: ${error.message}`);
      }
    });
  };

  // Load sample CSV
  const loadSampleCSV = async () => {
    try {
      const response = await apiClient.getSampleCSV();
      setCsvData(response.data);
      setError(null);
    } catch (err: any) {
      setError('Failed to load sample CSV');
    }
  };

  // Run simulation
  const onSubmit = async (data: Omit<TokenImpactParams, 'csv_data'>) => {
    if (csvData.length === 0) {
      setError('Please upload CSV data or load sample data first');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const params: TokenImpactParams = {
        csv_data: csvData,
        ...data,
      };

      const response = await apiClient.simulateTokenImpact(params);
      setResults(response);
    } catch (err: any) {
      setError(err.message || 'Simulation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = `Month,Unlocked Tokens,Emission,Transaction Volume Growth (%),Staking Participation Growth (%),Locked,Staked
2025-01-01,100000,50000,10,5,20000,30000
2025-02-01,120000,60000,12,6,21000,35000
2025-03-01,110000,55000,8,4,22000,31000`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'simlab_template.csv';
    a.click();
  };

  const chartData = results?.data.map((d: any) => ({
    month: d.month,
    effective_supply: d.effective_supply,
    demand_index: d.demand_index,
    price: d.indicative_price,
  })) || [];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Token Price Impact Model
          </h1>
          <p className="text-lg text-slate-400">
            Estimate how demand growth and supply changes affect token price. Upload CSV data or use sample scenarios.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-6 text-white">Configuration</h2>

              {/* CSV Upload Section */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Data Input
                </label>
                
                <div className="space-y-3">
                  {/* File Upload */}
                  <label className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 hover:border-blue-500/50 text-sm text-slate-300 transition-all cursor-pointer">
                    <Upload className="w-4 h-4" />
                    Upload CSV
                    <input 
                      type="file" 
                      accept=".csv" 
                      onChange={handleFileUpload} 
                      className="hidden" 
                    />
                  </label>

                  {/* Sample CSV */}
                  <button
                    type="button"
                    onClick={loadSampleCSV}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 hover:border-blue-500/50 text-sm text-slate-300 transition-all"
                  >
                    Load Sample CSV
                  </button>

                  {/* Download Template */}
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 hover:border-purple-500/50 text-sm text-slate-300 transition-all"
                  >
                    <FileText className="w-4 h-4" />
                    Download Template
                  </button>
                </div>

                {csvData.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-sm text-blue-400">
                      ✓ Loaded {csvData.length} months of data
                    </p>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Base Parameters */}
                <div className="border-t border-slate-800 pt-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2 text-blue-400">
                    <Info className="w-4 h-4" />
                    Base Parameters
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-300 mb-2">
                        Initial Circulating Supply
                      </label>
                      <input
                        type="number"
                        {...register('initial_circ_supply')}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-slate-500 mt-1">Tokens in circulation before data period</p>
                    </div>
                  </div>
                </div>

                {/* Demand Parameters */}
                <div className="border-t border-slate-800 pt-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2 text-green-400">
                    <Info className="w-4 h-4" />
                    Demand Parameters
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-300 mb-2">
                        Transaction Volume Base (V0_tx)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        {...register('V0_tx')}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-slate-500 mt-1">Starting transaction activity level</p>
                    </div>

                    <div>
                      <label className="block text-sm text-slate-300 mb-2">
                        Staking Base (V0_stake)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        {...register('V0_stake')}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-slate-500 mt-1">Starting staking participation level</p>
                    </div>

                    <div>
                      <label className="block text-sm text-slate-300 mb-2">
                        Transaction Weight (α)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        {...register('alpha')}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-slate-500 mt-1">0-1: Weight between transactions vs staking</p>
                    </div>
                  </div>
                </div>

                {/* Price Tuning */}
                <div className="border-t border-slate-800 pt-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2 text-purple-400">
                    <Info className="w-4 h-4" />
                    Price Calibration
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('calibrate')}
                        className="mr-2 w-4 h-4 bg-slate-800 border-slate-700 rounded"
                      />
                      <label className="text-sm text-slate-300">
                        Enable price calibration
                      </label>
                    </div>

                    {calibrate && (
                      <>
                        <div>
                          <label className="block text-sm text-slate-300 mb-2">
                            Calibration Method
                          </label>
                          <select
                            {...register('anchor_mode')}
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="none">None</option>
                            <option value="current_price">Known Price</option>
                            <option value="current_market_cap">Market Cap</option>
                          </select>
                        </div>

                        {anchorMode === 'current_price' && (
                          <div>
                            <label className="block text-sm text-slate-300 mb-2">
                              Anchor Price
                            </label>
                            <input
                              type="number"
                              step="0.0001"
                              {...register('anchor_price')}
                              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        )}

                        {anchorMode === 'current_market_cap' && (
                          <div>
                            <label className="block text-sm text-slate-300 mb-2">
                              Market Cap
                            </label>
                            <input
                              type="number"
                              {...register('anchor_market_cap')}
                              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        )}
                      </>
                    )}

                    <div>
                      <label className="block text-sm text-slate-300 mb-2">
                        Supply Elasticity (ε)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="2"
                        {...register('epsilon')}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-slate-500 mt-1">Price sensitivity to supply changes</p>
                    </div>
                  </div>
                </div>

                {/* Monte Carlo */}
                <div className="border-t border-slate-800 pt-6">
                  <h3 className="font-semibold mb-4 text-red-400">Monte Carlo Analysis</h3>
                  
                  <div className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      {...register('run_monte_carlo')}
                      className="mr-2 w-4 h-4 bg-slate-800 border-slate-700 rounded"
                    />
                    <label className="text-sm text-slate-300">
                      Run uncertainty analysis
                    </label>
                  </div>

                  {runMonteCarlo && (
                    <div>
                      <label className="block text-sm text-slate-300 mb-2">
                        Number of Runs
                      </label>
                      <input
                        type="number"
                        {...register('mc_runs')}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-slate-500 mt-1">Recommended: 100-500 runs</p>
                    </div>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading || csvData.length === 0}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold disabled:bg-slate-700 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all transform hover:scale-105"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Running Simulation...
                    </>
                  ) : (
                    <>
                      <Info className="w-5 h-5" />
                      Run Analysis
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            {error && (
              <div className="bg-red-900/20 border border-red-900/50 text-red-400 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {results && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="text-sm text-slate-400 mb-1">Final Supply</div>
                    <div className="text-2xl font-bold text-white">
                      {(results.summary.final_effective_supply / 1e6).toFixed(2)}M
                    </div>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="text-sm text-slate-400 mb-1">Demand Index</div>
                    <div className="text-2xl font-bold text-green-400">
                      {results.summary.final_demand_index.toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="text-sm text-slate-400 mb-1">Final Price</div>
                    <div className="text-2xl font-bold text-blue-400">
                      ${results.summary.final_price.toFixed(6)}
                    </div>
                  </div>
                </div>

                {/* Charts */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-6 text-white">Supply & Demand Dynamics</h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="month" stroke="#94a3b8" angle={-45} textAnchor="end" height={80} />
                      <YAxis yAxisId="left" stroke="#94a3b8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="effective_supply" stroke="#3b82f6" strokeWidth={2} name="Effective Supply" />
                      <Line yAxisId="right" type="monotone" dataKey="demand_index" stroke="#10b981" strokeWidth={2} name="Demand Index" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-6 text-white">Price Trajectory</h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="month" stroke="#94a3b8" angle={-45} textAnchor="end" height={80} />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                      <Line type="monotone" dataKey="price" stroke="#8b5cf6" strokeWidth={2} name="Indicative Price" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {!results && !isLoading && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
                <Upload className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <p className="text-lg text-slate-400 mb-2">
                  Upload CSV data or load sample to begin
                </p>
                <p className="text-sm text-slate-500">
                  CSV should include: Month, Unlocked Tokens, Emission, Transaction Growth %, Staking Growth %
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}