# backend/app/services/token_impact_simulator.py
import numpy as np
import pandas as pd
from typing import List
from app.models.token_impact import TokenImpactParams, MonthlyImpactData, CSVRow

class TokenImpactSimulator:
    """Core simulation engine for token price impact"""
    
    @classmethod
    def simulate(cls, params: TokenImpactParams) -> List[MonthlyImpactData]:
        """
        Run token impact simulation
        
        Steps:
        1. Build raw circulating supply from CSV data
        2. Calculate effective supply (remove locked/staked)
        3. Build demand index from growth rates
        4. Calculate indicative price
        5. Apply smoothing if requested
        """
        n_months = len(params.csv_data)
        
        # Step 1: Raw circulating supply
        unlocked = np.array([row.unlocked_tokens for row in params.csv_data])
        emission = np.array([row.emission for row in params.csv_data])
        raw_circulating = np.cumsum(unlocked + emission) + params.initial_circ_supply
        
        # Step 2: Effective supply
        locked = np.array([row.locked for row in params.csv_data])
        staked = np.array([row.staked for row in params.csv_data])
        
        if params.activation_mode == "global_ratio":
            activation = np.full(n_months, params.global_activation)
        else:
            activation = np.full(n_months, 0.85)
        
        effective_supply = (raw_circulating - locked - staked) * activation
        effective_supply = np.maximum(effective_supply, 1e-9)
        
        # Step 3: Demand index
        tx_growth = np.array([row.tx_volume_growth_pct / 100 for row in params.csv_data])
        stake_growth = np.array([row.staking_growth_pct / 100 for row in params.csv_data])
        
        V_tx = params.V0_tx * np.cumprod(1 + tx_growth)
        V_stake = params.V0_stake * np.cumprod(1 + stake_growth)
        
        alpha = params.alpha
        beta = 1.0 - alpha
        demand_index = alpha * V_tx + beta * V_stake
        
        # Step 4: Calculate k if calibrating
        k = params.k
        if params.calibrate and params.anchor_mode == "current_price" and params.anchor_price:
            idx = params.anchor_supply_idx
            k = params.anchor_price * (effective_supply[idx] ** params.epsilon) / demand_index[idx]
        elif params.calibrate and params.anchor_mode == "current_market_cap" and params.anchor_market_cap:
            idx = params.anchor_supply_idx
            implied_price = params.anchor_market_cap / effective_supply[idx]
            k = implied_price * (effective_supply[idx] ** params.epsilon) / demand_index[idx]
        
        if k is None:
            k = 1e-6
        
        # Step 5: Calculate price
        eps = 1e-9
        indicative_price = k * demand_index / (effective_supply ** params.epsilon + eps)
        
        # Step 6: Smoothing
        if params.smoothing_window > 1:
            indicative_price = pd.Series(indicative_price).rolling(
                window=params.smoothing_window, 
                min_periods=1
            ).mean().values
        
        # Build results
        results = []
        for i, row in enumerate(params.csv_data):
            results.append(MonthlyImpactData(
                month=row.month,
                raw_circulating=float(raw_circulating[i]),
                effective_supply=float(effective_supply[i]),
                demand_index=float(demand_index[i]),
                indicative_price=float(indicative_price[i])
            ))
        
        return results
    
    @classmethod
    def monte_carlo(cls, params: TokenImpactParams) -> pd.DataFrame:
        """Run Monte Carlo simulation with demand shocks"""
        np.random.seed(123)
        n_months = len(params.csv_data)
        sims = np.zeros((params.mc_runs, n_months))
        
        for i in range(params.mc_runs):
            # Add noise to demand
            noise = np.random.normal(1.0, params.mc_jitter_std, size=n_months)
            
            # Modify params with noise (simplified - apply to demand index)
            results = cls.simulate(params)
            prices = np.array([r.indicative_price for r in results]) * noise
            sims[i, :] = prices
        
        # Aggregate statistics
        p25 = np.percentile(sims, 25, axis=0)
        p50 = np.percentile(sims, 50, axis=0)
        p75 = np.percentile(sims, 75, axis=0)
        
        months = [row.month for row in params.csv_data]
        
        return pd.DataFrame({
            'month': months,
            'price_p25': p25,
            'price_median': p50,
            'price_p75': p75
        })