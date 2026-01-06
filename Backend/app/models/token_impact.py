# backend/app/models/token_impact.py
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Literal

class CSVRow(BaseModel):
    """Single row of CSV data"""
    month: str
    unlocked_tokens: float
    emission: float
    tx_volume_growth_pct: float
    staking_growth_pct: float
    locked: Optional[float] = 0.0
    staked: Optional[float] = 0.0

class TokenImpactParams(BaseModel):
    """Parameters for token impact simulation"""
    # CSV data
    csv_data: List[CSVRow]
    
    # Initial supply
    initial_circ_supply: float = Field(default=0.0, ge=0)
    total_supply_estimate: float = Field(default=0.0, ge=0)
    
    # Activation
    activation_mode: Literal["global_ratio", "column_based"] = "global_ratio"
    global_activation: float = Field(default=0.85, ge=0, le=1)
    
    # Demand parameters
    V0_tx: float = Field(default=1.0, ge=0)
    V0_stake: float = Field(default=1.0, ge=0)
    alpha: float = Field(default=0.6, ge=0, le=1)  # weight for transactions
    
    # Price tuning
    k: Optional[float] = None
    epsilon: float = Field(default=1.0, ge=0.1, le=2.0)
    calibrate: bool = True
    anchor_mode: Optional[Literal["current_price", "current_market_cap", "none"]] = "none"
    anchor_price: Optional[float] = None
    anchor_market_cap: Optional[float] = None
    anchor_supply_idx: int = Field(default=0, ge=0)
    
    # Smoothing
    smoothing_window: int = Field(default=1, ge=1, le=12)
    
    # Monte Carlo
    run_monte_carlo: bool = False
    mc_jitter_std: float = Field(default=0.05, ge=0, le=1)
    mc_runs: int = Field(default=200, ge=10, le=1000)

class MonthlyImpactData(BaseModel):
    """Monthly impact data point"""
    month: str
    raw_circulating: float
    effective_supply: float
    demand_index: float
    indicative_price: float

class TokenImpactResponse(BaseModel):
    """Response from token impact simulation"""
    success: bool
    params: TokenImpactParams
    data: List[MonthlyImpactData]
    summary: dict
    metadata: dict

class SampleCSVResponse(BaseModel):
    """Sample CSV data response"""
    success: bool
    data: List[CSVRow]