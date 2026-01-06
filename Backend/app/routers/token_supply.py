# backend/app/routers/token_supply.py
from fastapi import APIRouter, HTTPException
from app.models.token_supply import (
    TokenSupplyParams,
    TokenSupplyResponse,
    MonteCarloResponse,
    PresetScenario
)
from app.services.token_supply_simulator import TokenSupplySimulator

router = APIRouter()

@router.post("/simulate", response_model=TokenSupplyResponse)
async def simulate_token_supply(params: TokenSupplyParams):
    """
    Run a single token supply simulation
    
    Returns monthly data for circulating supply, burns, staking, and price
    """
    try:
        results = TokenSupplySimulator.simulate(params)
        
        # Calculate summary statistics
        final_data = results[-1]
        summary = {
            "final_circulating": final_data.circulating,
            "final_burned": final_data.burned_cumulative,
            "final_staked": final_data.staked_supply,
            "final_price": final_data.price,
            "total_months": len(results),
            "effective_years": len(results) / 12
        }
        
        metadata = {
            "simulation_type": "deterministic" if not params.stochastic else "stochastic",
            "total_data_points": len(results)
        }
        
        return TokenSupplyResponse(
            success=True,
            params=params,
            data=results,
            summary=summary,
            metadata=metadata
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")

@router.post("/monte-carlo", response_model=MonteCarloResponse)
async def monte_carlo_simulation(params: TokenSupplyParams):
    """
    Run Monte Carlo simulation with multiple stochastic runs
    
    Returns aggregated statistics with confidence intervals
    """
    try:
        if not params.stochastic:
            raise HTTPException(
                status_code=400,
                detail="Monte Carlo requires stochastic mode to be enabled"
            )
        
        if params.runs < 2:
            raise HTTPException(
                status_code=400,
                detail="Monte Carlo requires at least 2 runs"
            )
        
        agg_df = TokenSupplySimulator.monte_carlo(params, runs=params.runs)
        
        # Convert to list of dicts for JSON response
        aggregated_data = agg_df.to_dict('records')
        
        # Summary from final month
        final_row = agg_df.iloc[-1]
        summary = {
            "final_circulating_mean": float(final_row['circulating_mean']),
            "final_circulating_std": float(final_row['circulating_std']),
            "final_burned_mean": float(final_row['burned_mean']),
            "final_price_mean": float(final_row['price_mean']),
            "total_runs": params.runs
        }
        
        metadata = {
            "simulation_type": "monte_carlo",
            "runs": params.runs,
            "total_months": len(agg_df)
        }
        
        return MonteCarloResponse(
            success=True,
            params=params,
            aggregated_data=aggregated_data,
            summary=summary,
            metadata=metadata
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Monte Carlo simulation failed: {str(e)}")

@router.get("/presets", response_model=list[PresetScenario])
async def get_presets():
    """
    Get predefined simulation scenarios (Bitcoin-style, Ethereum-style, etc.)
    """
    presets = [
        PresetScenario(
            name="Bitcoin-Style",
            description="Fixed supply cap with decaying emission, no staking, minimal inflation",
            params=TokenSupplyParams(
                total_supply=21_000_000,
                initial_supply=19_000_000,
                initial_locked=0,
                years=100,
                annual_inflation_rate=0.015,
                min_inflation_rate=0.0,
                inflation_decay_rate=0.25,
                inflation_applies_to="remaining",
                staking_rate=0.0,
                staking_adoption_slope=0.0,
                staking_reward_share=0.0,
                burn_rate=0.0,
                tx_activity_index=1.0,
                vesting_months=0,
                vesting_curve="linear",
                demand_index_base=1.0,
                demand_growth_rate=0.02,
                price_scale=1.0,
                stochastic=False,
                runs=1,
                stop_if_cap_reached=True
            )
        ),
        PresetScenario(
            name="PoS Staking Protocol",
            description="Proof-of-Stake with high staking participation, moderate inflation",
            params=TokenSupplyParams(
                total_supply=1_000_000_000,
                initial_supply=300_000_000,
                initial_locked=200_000_000,
                years=20,
                annual_inflation_rate=0.05,
                min_inflation_rate=0.01,
                inflation_decay_rate=0.5,
                inflation_applies_to="circulating",
                staking_rate=0.65,
                staking_adoption_slope=0.01,
                staking_reward_share=0.8,
                burn_rate=0.02,
                tx_activity_index=1.0,
                vesting_months=48,
                vesting_curve="linear",
                demand_index_base=1.0,
                demand_growth_rate=0.03,
                price_scale=1.0,
                stochastic=False,
                runs=1,
                stop_if_cap_reached=False
            )
        ),
        PresetScenario(
            name="Deflationary DeFi",
            description="High burn rate protocol with transaction-based deflation",
            params=TokenSupplyParams(
                total_supply=500_000_000,
                initial_supply=100_000_000,
                initial_locked=50_000_000,
                years=15,
                annual_inflation_rate=0.03,
                min_inflation_rate=0.005,
                inflation_decay_rate=0.8,
                inflation_applies_to="circulating",
                staking_rate=0.40,
                staking_adoption_slope=0.005,
                staking_reward_share=0.75,
                burn_rate=0.05,
                tx_activity_index=1.5,
                vesting_months=24,
                vesting_curve="exponential",
                demand_index_base=1.0,
                demand_growth_rate=0.04,
                price_scale=1.0,
                stochastic=False,
                runs=1,
                stop_if_cap_reached=False
            )
        )
    ]
    
    return presets