# backend/app/models/token_supply.py
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Literal

class TokenSupplyParams(BaseModel):
    """Parameters for token supply simulation"""
    total_supply: float = Field(..., gt=0, le=1e12, description="Maximum token supply cap")
    initial_supply: float = Field(..., ge=0, description="Initial circulating supply")
    initial_locked: float = Field(default=0.0, ge=0, description="Initial locked tokens")
    years: int = Field(..., ge=1, le=200, description="Simulation duration in years")
    
    # Inflation parameters
    annual_inflation_rate: float = Field(..., ge=0, le=10, description="Initial annual inflation rate")
    min_inflation_rate: float = Field(..., ge=0, le=10, description="Minimum inflation floor")
    inflation_decay_rate: float = Field(..., ge=0, le=10, description="Inflation decay rate per year")
    inflation_applies_to: Literal["circulating", "remaining"] = Field(
        default="circulating",
        description="Base for inflation calculation"
    )
    
    # Staking parameters
    staking_rate: float = Field(default=0.0, ge=0, le=1, description="Base staking participation rate")
    staking_adoption_slope: float = Field(
        default=0.0,
        ge=-0.05,
        le=0.05,
        description="Annual change in staking rate"
    )
    staking_reward_share: float = Field(
        default=0.75,
        ge=0,
        le=1,
        description="Share of issuance paid to stakers"
    )
    
    # Burn parameters
    burn_rate: float = Field(default=0.0, ge=0, le=1, description="Annual burn rate on non-staked supply")
    tx_activity_index: float = Field(default=1.0, ge=0, le=5, description="Transaction activity multiplier")
    
    # Vesting parameters
    vesting_months: int = Field(default=0, ge=0, le=1200, description="Vesting duration in months")
    vesting_curve: Literal["linear", "exponential"] = Field(default="linear", description="Vesting curve type")
    
    # Demand/Price parameters
    demand_index_base: float = Field(default=1.0, ge=0.001, le=100, description="Base demand index")
    demand_growth_rate: float = Field(default=0.02, ge=0, le=1, description="Annual demand growth rate")
    price_scale: float = Field(default=1.0, ge=0.001, le=100, description="Price scaling factor")
    
    # Simulation options
    stochastic: bool = Field(default=False, description="Enable stochastic perturbations")
    inflation_volatility_monthly: float = Field(
        default=0.01,
        ge=0,
        le=1,
        description="Monthly inflation volatility (std dev)"
    )
    runs: int = Field(default=1, ge=1, le=500, description="Number of Monte Carlo runs")
    seed: Optional[int] = Field(default=None, ge=0, description="Random seed for reproducibility")
    stop_if_cap_reached: bool = Field(default=True, description="Stop simulation if cap is reached")
    
    @validator('initial_supply')
    def validate_initial_supply(cls, v, values):
        if 'total_supply' in values and v > values['total_supply']:
            raise ValueError('initial_supply cannot exceed total_supply')
        return v
    
    @validator('initial_locked')
    def validate_initial_locked(cls, v, values):
        if 'total_supply' in values and v > values['total_supply']:
            raise ValueError('initial_locked cannot exceed total_supply')
        return v

class MonthlyData(BaseModel):
    """Monthly simulation data point"""
    month: int
    year: int
    new_tokens: float
    staking_rewards: float
    treasury_issuance: float
    burned_tokens: float
    circulating: float
    staked_supply: float
    burned_cumulative: float
    minted_cumulative: float
    locked: float
    price: float
    demand_index: float
    inflation_annual_equiv: float

class TokenSupplyResponse(BaseModel):
    """Response from token supply simulation"""
    success: bool
    params: TokenSupplyParams
    data: List[MonthlyData]
    summary: dict
    metadata: dict

class MonteCarloResponse(BaseModel):
    """Response from Monte Carlo simulation"""
    success: bool
    params: TokenSupplyParams
    aggregated_data: List[dict]
    summary: dict
    metadata: dict

class PresetScenario(BaseModel):
    """Preset simulation scenario"""
    name: str
    description: str
    params: TokenSupplyParams