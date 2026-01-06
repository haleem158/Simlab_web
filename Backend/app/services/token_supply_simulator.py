# backend/app/services/token_supply_simulator.py
import numpy as np
import pandas as pd
from typing import List, Optional
from app.models.token_supply import TokenSupplyParams, MonthlyData

class TokenSupplySimulator:
    """Core simulation engine for token supply dynamics"""
    
    @staticmethod
    def vesting_unlocked_fraction(
        t_month: int,
        vesting_months: int,
        vesting_curve: str = "linear"
    ) -> float:
        """Calculate fraction of vested tokens unlocked at month t"""
        if vesting_months <= 0:
            return 1.0
        
        if vesting_curve == "linear":
            return min(1.0, t_month / vesting_months)
        elif vesting_curve == "exponential":
            lam = 5.0 / vesting_months
            return min(1.0, 1 - np.exp(-lam * t_month))
        
        return min(1.0, t_month / vesting_months)
    
    @classmethod
    def simulate(
        cls,
        params: TokenSupplyParams,
        rng: Optional[np.random.Generator] = None
    ) -> List[MonthlyData]:
        """
        Run token supply simulation
        
        Returns list of monthly data points
        """
        if rng is None:
            rng = np.random.default_rng(params.seed)
        
        months = params.years * 12
        total_supply = float(params.total_supply)
        circulating = float(params.initial_supply)
        burned = 0.0
        minted_cumulative = max(0.0, circulating - float(params.initial_locked))
        locked = max(0.0, float(params.initial_locked))
        
        results = []
        
        for m in range(1, months + 1):
            year = (m - 1) // 12 + 1
            
            # Time-varying inflation
            decay_rate = float(params.inflation_decay_rate)
            inf0 = float(params.annual_inflation_rate)
            inf_min = float(params.min_inflation_rate)
            inflation_t = inf_min + (inf0 - inf_min) * np.exp(-decay_rate * (m - 1) / 12.0)
            
            # Staking adoption curve
            stake_base = float(params.staking_rate)
            stake_growth = float(params.staking_adoption_slope)
            staking_rate_t = min(1.0, max(0.0, stake_base + stake_growth * np.log1p(m / 12.0)))
            
            # Vesting unlock
            unlocked_fraction = cls.vesting_unlocked_fraction(
                m, params.vesting_months, params.vesting_curve
            )
            unlocked_tokens = total_supply * unlocked_fraction
            circulating = min(circulating, unlocked_tokens)
            
            # Remaining cap
            remaining_cap = max(0.0, total_supply - (circulating + locked + burned))
            
            # Base for inflation
            base_for_inflation = (
                circulating if params.inflation_applies_to == "circulating"
                else remaining_cap
            )
            
            # Stochastic perturbation
            if params.stochastic:
                infl_noise = rng.normal(0.0, float(params.inflation_volatility_monthly))
                inflation_t_eff = max(0.0, inflation_t * (1.0 + infl_noise))
            else:
                inflation_t_eff = inflation_t
            
            # Monthly issuance
            new_tokens = base_for_inflation * (((1 + inflation_t_eff) ** (1/12.0)) - 1.0)
            new_tokens = min(new_tokens, remaining_cap)
            
            # Staking rewards and treasury
            staking_rewards = new_tokens * float(params.staking_reward_share)
            treasury_issuance = new_tokens - staking_rewards
            
            # Burn calculation
            staked_supply = circulating * staking_rate_t
            non_staked = max(0.0, circulating - staked_supply)
            burn_rate_monthly = 1 - (1 - float(params.burn_rate)) ** (1/12.0)
            burn_from_activity = non_staked * burn_rate_monthly * float(params.tx_activity_index)
            burned_tokens = min(non_staked, burn_from_activity)
            
            # Update supplies
            circulating += new_tokens + staking_rewards - burned_tokens
            burned += burned_tokens
            minted_cumulative += new_tokens
            locked = max(0.0, total_supply - (circulating + burned + (remaining_cap - new_tokens)))
            
            # Price model
            demand_index_base = float(params.demand_index_base)
            demand_growth = float(params.demand_growth_rate)
            demand_index = demand_index_base * (1 + demand_growth) ** ((m - 1) / 12.0)
            price = float(params.price_scale) * demand_index / max(1.0, circulating)
            
            results.append(MonthlyData(
                month=int(m),
                year=int(year),
                new_tokens=float(new_tokens),
                staking_rewards=float(staking_rewards),
                treasury_issuance=float(treasury_issuance),
                burned_tokens=float(burned_tokens),
                circulating=float(circulating),
                staked_supply=float(staked_supply),
                burned_cumulative=float(burned),
                minted_cumulative=float(minted_cumulative),
                locked=float(locked),
                price=float(price),
                demand_index=float(demand_index),
                inflation_annual_equiv=float(inflation_t_eff)
            ))
            
            # Early stop if cap reached
            if params.stop_if_cap_reached and remaining_cap <= 1e-9:
                last_data = results[-1]
                for mm in range(m + 1, months + 1):
                    results.append(MonthlyData(
                        month=int(mm),
                        year=int((mm - 1) // 12 + 1),
                        **{k: v for k, v in last_data.dict().items() if k not in ['month', 'year']}
                    ))
                break
        
        return results
    
    @classmethod
    def monte_carlo(
        cls,
        params: TokenSupplyParams,
        runs: int = 50
    ) -> pd.DataFrame:
        """
        Run Monte Carlo simulation
        
        Returns aggregated DataFrame with mean and confidence intervals
        """
        rng_master = np.random.default_rng(params.seed)
        outcomes = []
        
        for i in range(runs):
            seed = int(rng_master.integers(0, 2**31 - 1))
            run_params = params.copy(update={"seed": seed})
            data = cls.simulate(run_params, np.random.default_rng(seed))
            df = pd.DataFrame([d.dict() for d in data])
            df['run'] = i
            outcomes.append(df)
        
        # Combine all runs
        panel = pd.concat(outcomes, ignore_index=True)
        
        # Aggregate statistics
        agg = panel.groupby('month').agg({
            'circulating': ['mean', 'std', lambda x: np.percentile(x, 25), lambda x: np.percentile(x, 75)],
            'burned_cumulative': ['mean', 'std'],
            'price': ['mean', 'std'],
            'staked_supply': ['mean', 'std']
        }).reset_index()
        
        agg.columns = [
            'month',
            'circulating_mean', 'circulating_std', 'circulating_p25', 'circulating_p75',
            'burned_mean', 'burned_std',
            'price_mean', 'price_std',
            'staked_mean', 'staked_std'
        ]
        
        # Add confidence intervals
        agg['circulating_lower'] = np.maximum(0, agg['circulating_mean'] - 1.96 * agg['circulating_std'])
        agg['circulating_upper'] = agg['circulating_mean'] + 1.96 * agg['circulating_std']
        
        return agg