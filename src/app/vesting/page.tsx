'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, BarChart, Bar } from 'recharts';
import { Plus, Trash2, Download, Loader2, Info, ArrowLeft, Save, FolderOpen, X } from 'lucide-react';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { Button, Input, Card, Alert, Badge } from '@/components/ui';

interface VestingRole {
  name: string;
  allocation_pct: number;
  cliff_months: number;
  vesting_months: number;
  activation_ratio: number;
  governance_fraction: number;
}

interface VestingParams {
  total_supply: number;
  months: number;
  roles: VestingRole[];
  stochastic: boolean;
  noise_std_pct: number;
  seed: number;
  annual_discount_rate: number;
  clip_to_total: boolean;
}

interface VestingProfile {
  id: string;
  name: string;
  created_at: string;
  params: VestingParams;
  summary: any;
}

export default function VestingSimulator() {
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedProfiles, setSavedProfiles] = useState<VestingProfile[]>([]);
  const [showProfiles, setShowProfiles] = useState(false);

  const { register, control, handleSubmit, watch, setValue, reset } = useForm<VestingParams>({
    defaultValues: {
      total_supply: 1_000_000_000,
      months: 60,
      roles: [
        {
          name: 'Team',
          allocation_pct: 20,
          cliff_months: 12,
          vesting_months: 48,
          activation_ratio: 0.7,
          governance_fraction: 0.1
        },
        {
          name: 'Investors',
          allocation_pct: 25,
          cliff_months: 6,
          vesting_months: 24,
          activation_ratio: 0.8,
          governance_fraction: 0.0
        }
      ],
      stochastic: false,
      noise_std_pct: 0.05,
      seed: 42,
      annual_discount_rate: 0.10,
      clip_to_total: true
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'roles'
  });

  const roles = watch('roles');
  const totalAllocation = roles.reduce((sum, role) => {
    const alloc = parseFloat(role.allocation_pct as any) || 0;
    return sum + alloc;
  }, 0);

  // Load profiles on mount
  useEffect(() => {
    loadProfiles();
  }, []);

  const onSubmit = async (data: VestingParams) => {
    if (totalAllocation > 100) {
      setError('Total allocations exceed 100%');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await apiClient.simulateVesting(data);
      setResults(response);
    } catch (err: any) {
      setError(err.message || 'Simulation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPreset = async (presetName: string) => {
    try {
      const presets = await apiClient.getVestingPresets();
      const preset = presets.find((p: any) => p.name === presetName);
      if (preset && preset.params) {
        Object.entries(preset.params).forEach(([key, value]) => {
          setValue(key as any, value);
        });
      }
    } catch (err: any) {
      setError('Failed to load preset');
    }
  };

  const addRole = () => {
    if (fields.length >= 10) {
      setError('Maximum 10 roles allowed');
      return;
    }
    append({
      name: `Role ${fields.length + 1}`,
      allocation_pct: 10,
      cliff_months: 12,
      vesting_months: 48,
      activation_ratio: 0.8,
      governance_fraction: 0.0
    });
  };

  const saveProfile = async () => {
    const profileName = prompt('Enter profile name:');
    if (!profileName) return;

    try {
      const data = watch();
      const response = await fetch(`http://localhost:8000/api/v1/vesting/profiles?name=${encodeURIComponent(profileName)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        alert('Profile saved successfully!');
        loadProfiles();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to save profile');
      }
    } catch (err: any) {
      setError('Failed to save profile: ' + err.message);
    }
  };

  const loadProfiles = async () => {
    try {
      const profiles = await apiClient.listVestingProfiles();
      setSavedProfiles(profiles);
    } catch (err) {
      console.error('Failed to load profiles');
    }
  };

  const loadProfile = (profile: VestingProfile) => {
    // Load all parameters from the profile
    Object.entries(profile.params).forEach(([key, value]) => {
      setValue(key as any, value);
    });
    setShowProfiles(false);
    setError(null);
  };

  const deleteProfile = async (profileId: string) => {
    if (!confirm('Are you sure you want to delete this profile?')) return;

    try {
      await fetch(`http://localhost:8000/api/v1/vesting/profiles/${profileId}`, {
        method: 'DELETE'
      });
      loadProfiles();
    } catch (err: any) {
      setError('Failed to delete profile');
    }
  };

  // Prepare chart data
  const chartData = results?.data.map((d: any, idx: number) => ({
    month: d.month,
    total_unlocked: d.total_unlocked,
    effective_circulating: d.effective_circulating,
    governance_locked: d.governance_locked,
    ...Object.entries(d.by_role).reduce((acc, [roleName, roleData]: [string, any]) => ({
      ...acc,
      [`${roleName}_unlocked`]: roleData.unlocked
    }), {})
  })) || [];

  const inflationData = results?.data.map((d: any) => ({
    month: d.month,
    inflation: d.monthly_inflation * 100
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
            Vesting Schedule Simulator
          </h1>
          <p className="text-lg text-slate-400">
            Model token unlock schedules for team, investors, and community allocations
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
              <h2 className="text-xl font-bold mb-6 text-white">Configuration</h2>

              {/* Preset Buttons */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Load Preset
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    fullWidth
                    onClick={() => loadPreset('Standard Startup')}
                  >
                    Standard Startup
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    fullWidth
                    onClick={() => loadPreset('DAO Governance')}
                  >
                    DAO Governance
                  </Button>
                </div>
              </div>

              {/* Saved Profiles Section */}
              {savedProfiles.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-slate-300">
                      Saved Profiles ({savedProfiles.length})
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowProfiles(!showProfiles)}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      {showProfiles ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  
                  {showProfiles && (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {savedProfiles.map((profile) => (
                        <div
                          key={profile.id}
                          className="bg-slate-800 border border-slate-700 rounded-lg p-3"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white">{profile.name}</p>
                              <p className="text-xs text-slate-400">
                                {new Date(profile.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <button
                              onClick={() => deleteProfile(profile.id)}
                              className="text-red-400 hover:text-red-300 ml-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            fullWidth
                            onClick={() => loadProfile(profile)}
                            icon={<FolderOpen className="w-3 h-3" />}
                          >
                            Load Profile
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Base Parameters */}
                <div>
                  <h3 className="font-semibold mb-4 text-blue-400">Base Parameters</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-300 mb-2">
                        Total Supply
                      </label>
                      <input
                        type="number"
                        {...register('total_supply', { required: true, min: 1 })}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-slate-300 mb-2">
                        Simulation Months
                      </label>
                      <input
                        type="number"
                        {...register('months', { required: true, min: 12, max: 240 })}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-slate-500 mt-1">12-240 months (1-20 years)</p>
                    </div>
                  </div>
                </div>

                {/* Vesting Roles */}
                <div className="border-t border-slate-800 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-green-400">
                      Vesting Roles ({fields.length}/10)
                    </h3>
                    <button
                      type="button"
                      onClick={addRole}
                      className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                      disabled={fields.length >= 10}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Total Allocation Warning */}
                  <div className={`mb-4 p-3 rounded-lg ${
                    totalAllocation > 100 
                      ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                      : totalAllocation > 95
                      ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
                      : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
                  }`}>
                    <p className="text-sm font-medium">
                      Total Allocation: {(totalAllocation || 0).toFixed(1)}%
                    </p>
                  </div>

                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {fields.map((field, index) => (
                      <div key={field.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <input
                            type="text"
                            {...register(`roles.${index}.name` as const)}
                            className="flex-1 px-3 py-1 bg-slate-900 border border-slate-700 rounded text-white text-sm font-medium focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="ml-2 p-1 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Allocation %</label>
                            <input
                              type="number"
                              step="0.1"
                              {...register(`roles.${index}.allocation_pct` as const, { min: 0, max: 100 })}
                              className="w-full px-3 py-1 bg-slate-900 border border-slate-700 rounded text-white text-sm focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Cliff (months)</label>
                            <input
                              type="number"
                              {...register(`roles.${index}.cliff_months` as const, { min: 0 })}
                              className="w-full px-3 py-1 bg-slate-900 border border-slate-700 rounded text-white text-sm focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Vesting (months)</label>
                            <input
                              type="number"
                              {...register(`roles.${index}.vesting_months` as const, { min: 1 })}
                              className="w-full px-3 py-1 bg-slate-900 border border-slate-700 rounded text-white text-sm focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Activation</label>
                            <input
                              type="number"
                              step="0.01"
                              {...register(`roles.${index}.activation_ratio` as const, { min: 0, max: 1 })}
                              className="w-full px-3 py-1 bg-slate-900 border border-slate-700 rounded text-white text-sm focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs text-slate-400 mb-1">Governance Lock</label>
                            <input
                              type="number"
                              step="0.01"
                              {...register(`roles.${index}.governance_fraction` as const, { min: 0, max: 1 })}
                              className="w-full px-3 py-1 bg-slate-900 border border-slate-700 rounded text-white text-sm focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Advanced Options */}
                <div className="border-t border-slate-800 pt-6">
                  <h3 className="font-semibold mb-4 text-purple-400">Advanced Options</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('stochastic')}
                        className="mr-2 w-4 h-4 bg-slate-800 border-slate-700 rounded"
                      />
                      <label className="text-sm text-slate-300">
                        Add random noise to unlocks
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm text-slate-300 mb-2">
                        Annual Discount Rate
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register('annual_discount_rate')}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-slate-500 mt-1">For PV calculations (default: 10%)</p>
                    </div>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="space-y-2">
                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    isLoading={isLoading}
                    disabled={isLoading || totalAllocation > 100}
                    icon={!isLoading ? <Info className="w-5 h-5" /> : undefined}
                  >
                    {isLoading ? 'Running Simulation...' : 'Run Simulation'}
                  </Button>

                  <Button
                    type="button"
                    variant="success"
                    fullWidth
                    onClick={saveProfile}
                    icon={<Save className="w-5 h-5" />}
                  >
                    Save Profile
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            {error && (
              <Alert variant="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {results && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="text-sm text-slate-400 mb-1">Total Unlocked</div>
                    <div className="text-2xl font-bold text-white">
                      {(results.summary.final_cumulative_unlocked / 1e6).toFixed(2)}M
                    </div>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="text-sm text-slate-400 mb-1">Circulating</div>
                    <div className="text-2xl font-bold text-green-400">
                      {(results.summary.final_effective_circulating / 1e6).toFixed(2)}M
                    </div>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="text-sm text-slate-400 mb-1">Gov Locked</div>
                    <div className="text-2xl font-bold text-purple-400">
                      {(results.summary.final_governance_locked / 1e6).toFixed(2)}M
                    </div>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="text-sm text-slate-400 mb-1">Present Value</div>
                    <div className="text-2xl font-bold text-blue-400">
                      {(results.summary.pv_unlocked / 1e6).toFixed(2)}M
                    </div>
                  </div>
                </div>

                {/* Charts remain the same... */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-6 text-white">Cumulative Unlocks by Role</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="month" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                      <Legend />
                      {roles.map((role, idx) => (
                        <Area
                          key={role.name}
                          type="monotone"
                          dataKey={`${role.name}_unlocked`}
                          stackId="1"
                          stroke={`hsl(${idx * 360 / roles.length}, 70%, 50%)`}
                          fill={`hsl(${idx * 360 / roles.length}, 70%, 50%)`}
                          name={role.name}
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-6 text-white">Circulating vs Governance-Locked</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="month" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                      <Legend />
                      <Line type="monotone" dataKey="effective_circulating" stroke="#10b981" strokeWidth={2} name="Circulating" />
                      <Line type="monotone" dataKey="governance_locked" stroke="#8b5cf6" strokeWidth={2} name="Governance" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-6 text-white">Monthly Inflation Rate</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={inflationData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="month" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" label={{ value: '%', angle: -90, position: 'insideLeft' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                      <Bar dataKey="inflation" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {!results && !isLoading && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
                <Info className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <p className="text-lg text-slate-400 mb-2">
                  Configure vesting roles and click "Run Simulation"
                </p>
                <p className="text-sm text-slate-500">
                  Add roles, set cliff periods, vesting schedules, and behavioral parameters
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}