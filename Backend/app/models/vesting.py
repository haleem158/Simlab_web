from pydantic import BaseModel, Field, validator
from typing import List, Optional, Literal

class VestingRole(BaseModel):
    """Configuration for a single vesting role"""
    name: str = Field(..., description="Role name (e.g., Team, Investors)")
    allocation_pct: float = Field(..., ge=0, le=100, description="Percentage of total supply")
    cliff_months: int = Field(..., ge=0, le=240, description="Cliff period in months")
    vesting_months: int = Field(..., ge=1, le=240, description="Vesting duration in months")
    activation_ratio: float = Field(default=0.8, ge=0, le=1, description="Fraction entering circulation")
    governance_fraction: float = Field(default=0.0, ge=0, le=1, description="Governance-locked portion")

class VestingParams(BaseModel):
    """Parameters for vesting schedule simulation"""
    total_supply: float = Field(..., gt=0, description="Total token supply")
    months: int = Field(..., ge=12, le=240, description="Simulation horizon in months")
    roles: List[VestingRole] = Field(..., min_items=1, max_items=10, description="Vesting roles")
    
    # Simulation options
    stochastic: bool = Field(default=False, description="Add random noise to unlocks")
    noise_std_pct: float = Field(default=0.05, ge=0, le=1, description="Monthly unlock noise")
    seed: int = Field(default=42, ge=0, description="Random seed")
    annual_discount_rate: float = Field(default=0.10, ge=0, le=1, description="Discount rate for PV")
    clip_to_total: bool = Field(default=True, description="Enforce supply cap")
    
    @validator('roles')
    def validate_allocations(cls, roles):
        total_alloc = sum(role.allocation_pct for role in roles)
        if total_alloc > 100.0 + 1e-6:
            raise ValueError(f"Total allocations ({total_alloc:.2f}%) exceed 100%")
        return roles

class MonthlyVestingData(BaseModel):
    """Monthly vesting data point"""
    month: int
    total_unlocked: float
    effective_circulating: float
    governance_locked: float
    monthly_inflation: float
    by_role: dict  # {role_name: {unlocked, circulating, gov_locked}}

class VestingResponse(BaseModel):
    """Response from vesting simulation"""
    success: bool
    params: VestingParams
    data: List[MonthlyVestingData]
    summary: dict
    metadata: dict

class VestingProfile(BaseModel):
    """Saved vesting profile"""
    id: str
    name: str
    created_at: str
    params: VestingParams
    summary: dict