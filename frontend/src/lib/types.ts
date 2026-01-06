// frontend/src/lib/types.ts
// frontend/src/lib/types.ts

export interface TokenSupplyParams {
  total_supply: number;
  initial_supply: number;
  initial_locked: number;
  years: number;
  annual_inflation_rate: number;
  min_inflation_rate: number;
  inflation_decay_rate: number;
  inflation_applies_to: 'circulating' | 'remaining';
  staking_rate: number;
  staking_adoption_slope: number;
  staking_reward_share: number;
  burn_rate: number;
  tx_activity_index: number;
  vesting_months: number;
  vesting_curve: 'linear' | 'exponential';
  demand_index_base: number;
  demand_growth_rate: number;
  price_scale: number;
  stochastic: boolean;
  inflation_volatility_monthly: number;
  runs: number;
  seed?: number | null;
  stop_if_cap_reached: boolean;
}

export interface MonthlyData {
  month: number;
  year: number;
  new_tokens: number;
  staking_rewards: number;
  treasury_issuance: number;
  burned_tokens: number;
  circulating: number;
  staked_supply: number;
  burned_cumulative: number;
  minted_cumulative: number;
  locked: number;
  price: number;
  demand_index: number;
  inflation_annual_equiv: number;
}

export interface TokenSupplyResponse {
  success: boolean;
  params: TokenSupplyParams;
  data: MonthlyData[];
  summary: {
    final_circulating: number;
    final_burned: number;
    final_staked: number;
    final_price: number;
    total_months: number;
    effective_years: number;
  };
  metadata: {
    simulation_type: string;
    total_data_points: number;
  };
}

export interface MonteCarloData {
  month: number;
  circulating_mean: number;
  circulating_std: number;
  circulating_p25: number;
  circulating_p75: number;
  circulating_lower: number;
  circulating_upper: number;
  burned_mean: number;
  burned_std: number;
  price_mean: number;
  price_std: number;
  staked_mean: number;
  staked_std: number;
}

export interface MonteCarloResponse {
  success: boolean;
  params: TokenSupplyParams;
  aggregated_data: MonteCarloData[];
  summary: {
    final_circulating_mean: number;
    final_circulating_std: number;
    final_burned_mean: number;
    final_price_mean: number;
    total_runs: number;
  };
  metadata: {
    simulation_type: string;
    runs: number;
    total_months: number;
  };
}

export interface PresetScenario {
  name: string;
  description: string;
  params: TokenSupplyParams;
}

// Token Impact Types
export interface TokenImpactParams {
  csv_data?: any[];
  V0_tx: number;
  V0_stake: number;
  alpha: number;
  k?: number | null;
  epsilon: number;
  calibrate: boolean;
  anchor_mode?: 'current_price' | 'current_market_cap' | 'none';
  anchor_price?: number;
  anchor_market_cap?: number;
  anchor_supply_idx?: number;
  smoothing_window: number;
  run_monte_carlo: boolean;
  mc_jitter_std?: number;
}

export interface TokenImpactResponse {
  success: boolean;
  params: TokenImpactParams;
  data: any[];
  summary: {
    final_effective_supply: number;
    final_demand_index: number;
    final_price: number;
  };
  metadata: any;
}

// Vesting Types - CORRECTED PROPERTY NAMES
export interface VestingRole {
  name: string;
  allocation_pct: number; // ✅ Fixed: was "allocation"
  cliff_months: number; // ✅ Fixed: was "cliff"
  vesting_months: number; // ✅ Fixed: was "vesting_period"
  activation_ratio: number;
  governance_fraction: number;
}

export interface VestingParams {
  total_supply: number;
  months: number;
  roles: VestingRole[];
  stochastic: boolean;
  noise_std_pct: number;
  seed: number;
  annual_discount_rate: number;
  clip_to_total: boolean;
}

export interface MonthlyVestingData {
  month: number;
  total_unlocked: number;
  effective_circulating: number;
  governance_locked: number;
  monthly_inflation: number;
  by_role: { [roleName: string]: any };
}

export interface VestingResponse {
  success: boolean;
  params: VestingParams;
  data: MonthlyVestingData[]; // ✅ Fixed: was "any"
  summary: {
    final_cumulative_unlocked: number;
    final_effective_circulating: number;
    final_governance_locked: number; // ✅ Added missing property
    pv_unlocked: number;
    total_months: number; // ✅ Added missing property
  };
  metadata: any;
}

export interface VestingProfile {
  id: string;
  name: string;
  created_at: string;
  params: VestingParams;
  summary: any;
}