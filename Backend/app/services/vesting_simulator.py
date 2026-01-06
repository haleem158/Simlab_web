import numpy as np
from typing import List
from app.models.vesting import VestingParams, MonthlyVestingData

class VestingSimulator:
    """Core simulation engine for token vesting schedules"""
    
    @classmethod
    def simulate(cls, params: VestingParams) -> List[MonthlyVestingData]:
        """Run vesting schedule simulation"""
        
        if params.stochastic:
            np.random.seed(params.seed)
        
        months = params.months
        total_supply = params.total_supply
        
        # Initialize arrays for totals
        total_cumulative_unlocked = np.zeros(months)
        total_cumulative_effective = np.zeros(months)
        total_cumulative_gov = np.zeros(months)
        
        # Store per-role data
        role_data = {}
        
        # Process each role
        for role in params.roles:
            role_name = str(role.name)
            alloc_tokens = (role.allocation_pct / 100.0) * total_supply
            cliff = role.cliff_months
            vesting = role.vesting_months
            
            # Calculate effective vesting period
            if cliff >= months:
                effective_vesting = 0
            else:
                effective_vesting = min(vesting, months - cliff)
            
            # Calculate monthly unlock amount
            if effective_vesting > 0:
                monthly_amount = alloc_tokens / vesting
            else:
                monthly_amount = 0.0
            
            # Calculate monthly unlocks
            monthly_unlocks = np.zeros(months)
            for m in range(months):
                if m < cliff:
                    unlock = 0.0
                elif m < cliff + effective_vesting:
                    if params.stochastic and monthly_amount > 0:
                        noise = np.random.normal(1.0, params.noise_std_pct)
                        unlock = max(0.0, monthly_amount * noise)
                    else:
                        unlock = monthly_amount
                else:
                    unlock = 0.0
                monthly_unlocks[m] = unlock
            
            # Calculate cumulative unlocked
            cumulative_unlocked = np.cumsum(monthly_unlocks)
            
            # Calculate governance locked
            cumulative_gov = cumulative_unlocked * role.governance_fraction
            
            # Calculate effective circulating
            cumulative_effective = cumulative_unlocked * (1.0 - role.governance_fraction) * role.activation_ratio
            
            # Store role data
            role_data[role_name] = {
                'unlocked': cumulative_unlocked,
                'effective': cumulative_effective,
                'gov': cumulative_gov
            }
            
            # Add to totals
            total_cumulative_unlocked += cumulative_unlocked
            total_cumulative_effective += cumulative_effective
            total_cumulative_gov += cumulative_gov
        
        # Enforce supply cap
        if params.clip_to_total:
            total_cumulative_unlocked = np.minimum(total_cumulative_unlocked, total_supply)
            total_cumulative_effective = np.minimum(total_cumulative_effective, total_supply)
            total_cumulative_gov = np.minimum(total_cumulative_gov, total_cumulative_unlocked)
        
        # Calculate monthly inflation
        monthly_inflation = np.zeros(months)
        if total_supply > 0:
            monthly_inflation[0] = total_cumulative_effective[0] / total_supply
            if months > 1:
                for m in range(1, months):
                    monthly_inflation[m] = (total_cumulative_effective[m] - total_cumulative_effective[m-1]) / total_supply
        
        # Build results
        results = []
        for m in range(months):
            by_role = {}
            for role in params.roles:
                role_name = str(role.name)
                by_role[role_name] = {
                    "unlocked": float(role_data[role_name]['unlocked'][m]),
                    "circulating": float(role_data[role_name]['effective'][m]),
                    "gov_locked": float(role_data[role_name]['gov'][m])
                }
            
            results.append(MonthlyVestingData(
                month=m + 1,
                total_unlocked=float(total_cumulative_unlocked[m]),
                effective_circulating=float(total_cumulative_effective[m]),
                governance_locked=float(total_cumulative_gov[m]),
                monthly_inflation=float(monthly_inflation[m]),
                by_role=by_role
            ))
        
        return results
    
    @classmethod
    def calculate_present_value(
        cls,
        results: List[MonthlyVestingData],
        annual_discount_rate: float
    ) -> float:
        """Calculate discounted present value of all unlocked tokens"""
        
        if len(results) == 0:
            return 0.0
        
        # Calculate monthly discount rate
        if annual_discount_rate > 0:
            monthly_discount_rate = (1 + annual_discount_rate) ** (1/12) - 1
        else:
            monthly_discount_rate = 0.0
        
        # Calculate new unlocks each month
        monthly_new_unlocked = np.zeros(len(results))
        monthly_new_unlocked[0] = results[0].total_unlocked
        for i in range(1, len(results)):
            monthly_new_unlocked[i] = results[i].total_unlocked - results[i-1].total_unlocked
        
        # Calculate discount factors
        if monthly_discount_rate > 0:
            discount_factors = np.array([1 / ((1 + monthly_discount_rate) ** i) for i in range(len(results))])
        else:
            discount_factors = np.ones(len(results))
        
        # Calculate present value
        pv_unlocked = np.sum(monthly_new_unlocked * discount_factors)
        
        return float(pv_unlocked)