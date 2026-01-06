// frontend/src/app/token-supply/page.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Play, Download, Loader2, Info, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import apiClient from '@/lib/api';
import type { TokenSupplyParams, TokenSupplyResponse, MonteCarloResponse } from '@/lib/types';

export default function TokenSupplySimulator() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<TokenSupplyResponse | null>(null);
  const [mcResults, setMcResults] = useState<MonteCarloResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue } = useForm<TokenSupplyParams>({
    defaultValues: {
      total_supply: 1_000_000_000,
      initial_supply: 100_000_000,
      initial_locked: 0,
      years: 20,
      annual_inflation_rate: 0.05,
      min_inflation_rate: 0.01,
      inflation_decay_rate: 0.5,
      inflation_applies_to: 'circulating',
      staking_rate: 0.4,
      staking_adoption_slope: 0,
      staking_reward_share: 0.75,
      burn_rate: 0.02,
      tx_activity_index: 1.0,
      vesting_months: 0,
      vesting_curve: 'linear',
      demand_index_base: 1.0,
      demand_growth_rate: 0.02,
      price_scale: 1.0,
      stochastic: false,
      inflation_volatility_monthly: 0.01,
      runs: 50,
      seed: null,
      stop_if_cap_reached: true,
    }
  });

  const stochastic = watch('stochastic');

  const onSubmit = async (data: TokenSupplyParams) => {
    setIsLoading(true);
    setError(null);
    setResults(null);
    setMcResults(null);

    try {
      if (data.stochastic && data.runs > 1) {
        const response = await apiClient.monteCarloTokenSupply(data);
        setMcResults(response as MonteCarloResponse);
      } else {
        const response = await apiClient.simulateTokenSupply(data);
        setResults(response as TokenSupplyResponse);
      }
    } catch (err: any) {
      setError(err.message || 'Simulation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPreset = async (presetName: string) => {
    try {
      const presets = await apiClient.getTokenSupplyPresets();
      const preset = presets.find((p: any) => p.name === presetName);
      if (preset) {
        Object.entries(preset.params).forEach(([key, value]) => {
          setValue(key as any, value);
        });
      }
    } catch (err: any) {
      setError('Failed to load preset');
    }
  };

  const downloadCSV = () => {
    if (!results) return;
    
    const csv = [
      Object.keys(results.data[0]).join(','),
      ...results.data.map((row: any) => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'token_supply_simulation.csv';
    a.click();
  };

  const chartData = results?.data.map((d: any) => ({
    year: d.month / 12,
    circulating: d.circulating,
    burned: d.burned_cumulative,
    staked: d.staked_supply,
    price: d.price,
  })) || [];

  const mcChartData = mcResults?.aggregated_data.map((d: any) => ({
    year: d.month / 12,
    mean: d.circulating_mean,
    upper: d.circulating_upper,
    lower: d.circulating_lower,
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
            Token Supply Simulator
          </h1>
          <p className="text-lg text-slate-400">
            Model token supply dynamics including inflation, staking, burning, and vesting schedules.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sidebar Form */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-6 text-white">Simulation Parameters</h2>

              {/* Preset Buttons */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Load Preset Scenario
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => loadPreset('Bitcoin-Style')}
                    className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 hover:border-blue-500/50 text-sm text-slate-300 transition-all"
                  >
                    Bitcoin-Style
                  </button>
                  <button
                    type="button"
                    onClick={() => loadPreset('PoS Staking Protocol')}
                    className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 hover:border-blue-500/50 text-sm text-slate-300 transition-all"
                  >
                    PoS Staking Protocol
                  </button>
                  <button
                    type="button"
                    onClick={() => loadPreset('Deflationary DeFi')}
                    className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 hover:border-blue-500/50 text-sm text-slate-300 transition-all"
                  >
                    Deflationary DeFi
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Base Parameters */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Total Supply
                  </label>
                  <input
                    type="number"
                    {...register('total_supply', { required: true, min: 1 })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Initial Supply
                  </label>
                  <input
                    type="number"
                    {...register('initial_supply', { required: true, min: 0 })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Years to Simulate
                  </label>
                  <input
                    type="number"
                    {...register('years', { required: true, min: 1, max: 200 })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Inflation */}
                <div className="border-t border-slate-800 pt-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2 text-blue-400">
                    <Info className="w-4 h-4" />
                    Inflation Parameters
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-300 mb-2">
                        Annual Inflation Rate
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register('annual_inflation_rate', { required: true, min: 0, max: 10 })}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-slate-500 mt-1">Typical: 3-10% for new protocols</p>
                    </div>

                    <div>
                      <label className="block text-sm text-slate-300 mb-2">
                        Minimum Inflation Floor
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register('min_inflation_rate', { required: true, min: 0, max: 10 })}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-slate-500 mt-1">Long-term floor: 0.5-2%</p>
                    </div>
                  </div>
                </div>

                {/* Staking */}
                <div className="border-t border-slate-800 pt-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2 text-green-400">
                    <Info className="w-4 h-4" />
                    Staking Parameters
                  </h3>
                  
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">
                      Staking Participation Rate
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('staking_rate', { required: true, min: 0, max: 1 })}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-slate-500 mt-1">Mature PoS: 30-70% staked</p>
                  </div>
                </div>

                {/* Burn */}
                <div className="border-t border-slate-800 pt-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2 text-red-400">
                    <Info className="w-4 h-4" />
                    Burn Mechanism
                  </h3>
                  
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">
                      Annual Burn Rate
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('burn_rate', { required: true, min: 0, max: 1 })}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-slate-500 mt-1">Typical: 0.1-3% annually</p>
                  </div>
                </div>

                {/* Monte Carlo */}
                <div className="border-t border-slate-800 pt-6">
                  <h3 className="font-semibold mb-4 text-purple-400">Monte Carlo Simulation</h3>
                  
                  <div className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      {...register('stochastic')}
                      className="mr-2 w-4 h-4 bg-slate-800 border-slate-700 rounded"
                    />
                    <label className="text-sm text-slate-300">
                      Enable stochastic mode
                    </label>
                  </div>

                  {stochastic && (
                    <div>
                      <label className="block text-sm text-slate-300 mb-2">
                        Number of Runs
                      </label>
                      <input
                        type="number"
                        {...register('runs', { required: true, min: 1, max: 500 })}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-slate-500 mt-1">Recommended: 50-200 runs</p>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold disabled:bg-slate-700 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all transform hover:scale-105"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Running Simulation...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Run Simulation
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="text-sm text-slate-400 mb-1">Final Circulating</div>
                    <div className="text-2xl font-bold text-white">
                      {(results.summary.final_circulating / 1e6).toFixed(2)}M
                    </div>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="text-sm text-slate-400 mb-1">Final Burned</div>
                    <div className="text-2xl font-bold text-red-400">
                      {(results.summary.final_burned / 1e6).toFixed(2)}M
                    </div>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="text-sm text-slate-400 mb-1">Final Staked</div>
                    <div className="text-2xl font-bold text-green-400">
                      {(results.summary.final_staked / 1e6).toFixed(2)}M
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
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-white">Supply Dynamics</h3>
                    <button
                      onClick={downloadCSV}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 text-slate-300 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      Export CSV
                    </button>
                  </div>
                  
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="year" stroke="#94a3b8" label={{ value: 'Years', position: 'insideBottom', offset: -5, fill: '#94a3b8' }} />
                      <YAxis stroke="#94a3b8" label={{ value: 'Tokens', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                      <Legend />
                      <Line type="monotone" dataKey="circulating" stroke="#3b82f6" strokeWidth={2} name="Circulating" />
                      <Line type="monotone" dataKey="burned" stroke="#ef4444" strokeWidth={2} name="Burned" />
                      <Line type="monotone" dataKey="staked" stroke="#10b981" strokeWidth={2} name="Staked" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-6 text-white">Price Trajectory</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="year" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                      <Line type="monotone" dataKey="price" stroke="#8b5cf6" strokeWidth={2} name="Price" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {mcResults && (
              <div className="space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-6 text-white">
                    Monte Carlo Results ({mcResults.summary.total_runs} runs)
                  </h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={mcChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="year" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                      <Legend />
                      <Area type="monotone" dataKey="upper" stroke="#93c5fd" fill="#3b82f6" fillOpacity={0.2} name="Upper 95%" />
                      <Area type="monotone" dataKey="mean" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} name="Mean" />
                      <Area type="monotone" dataKey="lower" stroke="#93c5fd" fill="#3b82f6" fillOpacity={0.2} name="Lower 95%" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {!results && !mcResults && !isLoading && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
                <Play className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <p className="text-lg text-slate-400">
                  Configure your parameters and click "Run Simulation" to see results
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}