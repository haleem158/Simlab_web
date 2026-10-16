from typing import List, Literal, Optional

from pydantic import BaseModel, Field, model_validator

ReleaseFrequency = Literal["biweekly", "monthly", "quarterly"]
LockupModel = Literal["ghaidarov", "finnerty"]

# Weights of the seven pre-launch scorecard factors (Angel Capital Association).
SCORECARD_WEIGHTS = [30.0, 25.0, 15.0, 10.0, 10.0, 5.0, 5.0]


class NetworkInputs(BaseModel):
    """Velocity method (Burniske): money the network needs, spread over the float."""
    economy_millions: float = Field(..., gt=0, description="Size of the network's economy in year T, $M")
    velocity: float = Field(..., gt=0, le=1000, description="Times a token changes hands per year")
    float_millions: float = Field(..., gt=0, description="Tokens in the float in year T, millions")
    horizon_years: float = Field(default=10, ge=1, le=30, description="Years ahead (T)")
    rate_low_pct: float = Field(..., gt=0, le=200, description="Lowest markdown rate, %")
    rate_high_pct: float = Field(..., gt=0, le=200, description="Highest markdown rate, %")

    @model_validator(mode="after")
    def _rates_in_order(self):
        if self.rate_high_pct < self.rate_low_pct:
            raise ValueError("The high markdown rate must not be below the low one")
        return self


class CashflowInputs(BaseModel):
    """Cash-flow method (CFA Institute): five years of holder fees plus a terminal value."""
    fees_year1_millions: float = Field(..., ge=0, description="Fees to holders in year 1, $M")
    growth_year2_pct: float = Field(..., ge=0, le=500, description="Fee growth in year 2, %")
    growth_slowdown_pct: float = Field(default=10, ge=0, le=100, description="Growth slows by this % each year")
    rate_pct: float = Field(..., gt=0, le=200, description="Markdown rate, %")
    terminal_growth_pct: float = Field(default=3, ge=0, le=50, description="Long-run growth, %")
    total_tokens_millions: float = Field(..., gt=0, description="Total tokens, millions")

    @model_validator(mode="after")
    def _rate_above_growth(self):
        # The range shown uses rate -5 points with growth +1 point.
        if self.rate_pct - 5 <= self.terminal_growth_pct + 1:
            raise ValueError(
                "The markdown rate must be at least 7 points above long-run growth"
            )
        return self


class PeerInputs(BaseModel):
    """Peer comparison: market value divided by fees, for projects the user picks."""
    multiples: List[float] = Field(..., min_length=1, max_length=6, description="Market value / fees per peer")

    @model_validator(mode="after")
    def _positive(self):
        if any(m <= 0 for m in self.multiples):
            raise ValueError("Peer multiples must be above zero")
        return self


class PrelaunchInputs(BaseModel):
    """Pre-launch scorecard (Angel Capital Association, adapted from equity)."""
    enabled: bool = False
    ratings_pct: List[float] = Field(
        default_factory=lambda: [100.0] * 7,
        description="Rating of each of the 7 factors against a typical project (100 = typical)",
    )
    median_low_millions: float = Field(default=4.0, gt=0, description="Similar projects' value, low, $M")
    median_high_millions: float = Field(default=6.0, gt=0, description="Similar projects' value, high, $M")

    @model_validator(mode="after")
    def _shape(self):
        if len(self.ratings_pct) != len(SCORECARD_WEIGHTS):
            raise ValueError("Exactly 7 scorecard ratings are required")
        if any(r < 0 or r > 300 for r in self.ratings_pct):
            raise ValueError("Scorecard ratings must be between 0 and 300")
        if self.median_high_millions < self.median_low_millions:
            raise ValueError("The high value must not be below the low value")
        return self


class LockRole(BaseModel):
    """One vesting role, in the shape the Vesting page already uses."""
    name: str
    allocation_pct: float = Field(..., ge=0, le=100)
    cliff_months: int = Field(..., ge=0, le=240)
    vesting_months: int = Field(..., ge=1, le=240)
    initial_unlock_pct: float = Field(default=0.0, ge=0, le=100)
    release_frequency: ReleaseFrequency = "monthly"


class LockupInputs(BaseModel):
    """Lock-up discount (Finnerty 2012, Ghaidarov 2009)."""
    volatility_pct: float = Field(..., gt=0, le=400, description="Annual price volatility, %")
    model: LockupModel = "ghaidarov"
    roles: List[LockRole] = Field(default_factory=list, max_length=10)

    @model_validator(mode="after")
    def _allocations(self):
        if sum(r.allocation_pct for r in self.roles) > 100.0 + 1e-6:
            raise ValueError("Role allocations exceed 100%")
        return self


class ValuationParams(BaseModel):
    network: NetworkInputs
    cashflow: CashflowInputs
    peers: PeerInputs
    prelaunch: PrelaunchInputs = Field(default_factory=PrelaunchInputs)
    lockup: LockupInputs


class MethodResult(BaseModel):
    id: Literal["network", "cashflow", "peers", "prelaunch"]
    name: str
    why: str
    low: float
    mid: float
    high: float


class RoleDiscount(BaseModel):
    name: str
    allocation_pct: float
    average_wait_years: float
    discount: float = Field(..., description="Lock-up discount as a fraction (0.25 = 25%)")


class LockupResult(BaseModel):
    model: LockupModel
    blended_discount: float
    other_model: LockupModel
    other_model_blended_discount: float
    locked_share_pct: float
    roles: List[RoleDiscount]
    volatility_warning: bool = Field(..., description="True above about 150% volatility")


class Headline(BaseModel):
    low: float = Field(..., description="Lowest middle case across the methods, $ per token")
    high: float = Field(..., description="Highest middle case across the methods, $ per token")
    spread_ratio: float = Field(..., description="Highest middle case divided by the lowest")
    agreement: Literal["close", "rough", "wide"]
    locked_low: Optional[float] = Field(None, description="Low end for a still-locked token")
    locked_high: Optional[float] = Field(None, description="High end for a still-locked token")


class ValuationResponse(BaseModel):
    success: bool
    headline: Headline
    methods: List[MethodResult]
    lockup: LockupResult
