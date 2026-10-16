"""Token valuation maths.

Sources (all reproduced against published numbers in tests/test_valuation.py):
- Velocity method: Burniske, "Cryptoasset Valuations" (MV = PQ, discounted back).
- Cash-flow method: CFA Institute, "Valuation of Cryptoassets" (2023).
- Scorecard: Angel Capital Association, Scorecard Valuation Methodology.
- Lock-up discount: Finnerty (2012) and Ghaidarov (2009), average-strike put.
"""
import math
from typing import List, Tuple

from app.models.valuation import (
    SCORECARD_WEIGHTS,
    CashflowInputs,
    Headline,
    LockRole,
    LockupInputs,
    LockupResult,
    MethodResult,
    NetworkInputs,
    PeerInputs,
    PrelaunchInputs,
    RoleDiscount,
    ValuationParams,
    ValuationResponse,
)
from app.services.vesting_simulator import PERIOD_MONTHS


# ---------------------------------------------------------------- lock-up (DLOM)

def _ln_em(x: float) -> float:
    """ln(e^x - x - 1), stable for tiny and large x."""
    if x < 0.01:
        return math.log(x * x / 2.0 * (1.0 + x / 3.0 + x * x / 12.0))
    if x < 30.0:
        return math.log(math.expm1(x) - x)
    return x + math.log1p(-(x + 1.0) * math.exp(-x))


def _ln_e1(x: float) -> float:
    """ln(e^x - 1)."""
    if x < 30.0:
        return math.log(math.expm1(x))
    return x + math.log1p(-math.exp(-x))


def lockup_discount(volatility: float, years: float, model: str = "ghaidarov") -> float:
    """Discount for lack of marketability as a fraction (0.2 = 20%).

    volatility is annual (1.4 = 140%). years is the wait until the tokens can be sold.
    """
    x = volatility * volatility * years
    if x < 1e-9 or years <= 0:
        return 0.0
    if model == "finnerty":
        v2 = x + math.log(2.0) + _ln_em(x) - 2.0 * _ln_e1(x)
    else:
        v2 = math.log(2.0) + _ln_em(x) - 2.0 * math.log(x)
    v2 = max(v2, 0.0)
    # 2N(z) - 1 with z = sqrt(v2)/2  ==  erf(z / sqrt(2))
    return math.erf(math.sqrt(v2) / (2.0 * math.sqrt(2.0)))


def role_tranches(role: LockRole) -> List[Tuple[float, float]]:
    """(months until sellable, share of the role) - mirrors the vesting simulator."""
    period = PERIOD_MONTHS[role.release_frequency]
    initial = role.initial_unlock_pct / 100.0
    rest = 1.0 - initial
    n_rel = max(1, int(math.ceil(role.vesting_months / period - 1e-9)))
    tranches: List[Tuple[float, float]] = []
    if initial > 0:
        tranches.append((float(role.cliff_months), initial))
    for k in range(1, n_rel + 1):
        t = min(role.cliff_months + k * period, role.cliff_months + role.vesting_months)
        tranches.append((t, rest / n_rel))
    return tranches


def role_discount(role: LockRole, volatility: float, model: str) -> RoleDiscount:
    tranches = role_tranches(role)
    disc = sum(share * lockup_discount(volatility, t / 12.0, model) for t, share in tranches)
    wait = sum(share * t / 12.0 for t, share in tranches)
    return RoleDiscount(
        name=role.name,
        allocation_pct=role.allocation_pct,
        average_wait_years=wait,
        discount=disc,
    )


def _blend(roles: List[RoleDiscount]) -> float:
    total = sum(r.allocation_pct for r in roles)
    if total <= 0:
        return 0.0
    return sum(r.allocation_pct * r.discount for r in roles) / total


def compute_lockup(inp: LockupInputs) -> LockupResult:
    vol = inp.volatility_pct / 100.0
    other = "finnerty" if inp.model == "ghaidarov" else "ghaidarov"
    roles = [role_discount(r, vol, inp.model) for r in inp.roles]
    roles_other = [role_discount(r, vol, other) for r in inp.roles]
    return LockupResult(
        model=inp.model,
        blended_discount=_blend(roles),
        other_model=other,
        other_model_blended_discount=_blend(roles_other),
        locked_share_pct=sum(r.allocation_pct for r in roles if r.discount > 0),
        roles=roles,
        volatility_warning=inp.volatility_pct > 150.0,
    )


# ---------------------------------------------------------------- the methods

def network_value(inp: NetworkInputs, rate_pct: float) -> float:
    """$ per token today: (economy / velocity) / float, marked down T years."""
    per_token_then = (inp.economy_millions / inp.velocity) / inp.float_millions
    return per_token_then / (1.0 + rate_pct / 100.0) ** inp.horizon_years


def compute_network(inp: NetworkInputs) -> MethodResult:
    mid_rate = (inp.rate_low_pct + inp.rate_high_pct) / 2.0
    return MethodResult(
        id="network",
        name="What the network needs",
        why="Tokens that people use to pay need a certain total value to keep the network running.",
        low=network_value(inp, inp.rate_high_pct),
        mid=network_value(inp, mid_rate),
        high=network_value(inp, inp.rate_low_pct),
    )


def cashflow_value(inp: CashflowInputs, rate_pct: float, terminal_growth_pct: float) -> float:
    """$ per token: five years of fees plus a terminal value, all marked down."""
    r = rate_pct / 100.0
    gt = terminal_growth_pct / 100.0
    g = inp.growth_year2_pct / 100.0
    slow = inp.growth_slowdown_pct / 100.0
    fee = inp.fees_year1_millions
    pv = 0.0
    for year in range(1, 6):
        if year > 1:
            fee *= 1.0 + g
            g *= 1.0 - slow
        pv += fee / (1.0 + r) ** year
    terminal = fee * (1.0 + gt) / (r - gt)
    pv += terminal / (1.0 + r) ** 5
    return pv / inp.total_tokens_millions


def compute_cashflow(inp: CashflowInputs) -> MethodResult:
    return MethodResult(
        id="cashflow",
        name="What the fees are worth",
        why="If holders earn a share of the fees, the token is worth those future fees marked down to today.",
        low=cashflow_value(inp, inp.rate_pct + 5, inp.terminal_growth_pct - 1),
        mid=cashflow_value(inp, inp.rate_pct, inp.terminal_growth_pct),
        high=cashflow_value(inp, inp.rate_pct - 5, inp.terminal_growth_pct + 1),
    )


def _median(xs: List[float]) -> float:
    s = sorted(xs)
    n = len(s)
    return s[n // 2] if n % 2 else (s[n // 2 - 1] + s[n // 2]) / 2.0


def compute_peers(inp: PeerInputs, fees_year1: float, total_tokens: float) -> MethodResult:
    per = lambda m: m * fees_year1 / total_tokens
    return MethodResult(
        id="peers",
        name="What similar projects trade at",
        why="Projects like yours are priced at some multiple of their fees; apply the same to yours.",
        low=per(min(inp.multiples)),
        mid=per(_median(inp.multiples)),
        high=per(max(inp.multiples)),
    )


def scorecard_multiplier(ratings_pct: List[float]) -> float:
    return sum(w * r / 100.0 for w, r in zip(SCORECARD_WEIGHTS, ratings_pct)) / 100.0


def compute_prelaunch(inp: PrelaunchInputs, total_tokens: float) -> MethodResult:
    m = scorecard_multiplier(inp.ratings_pct)
    lo, hi = inp.median_low_millions * m, inp.median_high_millions * m
    return MethodResult(
        id="prelaunch",
        name="How you compare to a typical project",
        why="Score your team, product, market and more against a typical project at your stage.",
        low=lo / total_tokens,
        mid=(lo + hi) / 2.0 / total_tokens,
        high=hi / total_tokens,
    )


# ---------------------------------------------------------------- everything

def run_valuation(params: ValuationParams) -> ValuationResponse:
    methods = [
        compute_network(params.network),
        compute_cashflow(params.cashflow),
        compute_peers(
            params.peers,
            params.cashflow.fees_year1_millions,
            params.cashflow.total_tokens_millions,
        ),
    ]
    if params.prelaunch.enabled:
        methods.append(compute_prelaunch(params.prelaunch, params.cashflow.total_tokens_millions))

    lockup = compute_lockup(params.lockup)

    mids = [m.mid for m in methods]
    low, high = min(mids), max(mids)
    ratio = high / low if low > 0 else float("inf")
    if ratio == float("inf"):
        ratio = 999.0
    agreement = "close" if ratio <= 1.5 else "rough" if ratio <= 2.5 else "wide"

    has_locks = bool(params.lockup.roles)
    headline = Headline(
        low=low,
        high=high,
        spread_ratio=ratio,
        agreement=agreement,
        locked_low=low * (1.0 - lockup.blended_discount) if has_locks else None,
        locked_high=high * (1.0 - lockup.blended_discount) if has_locks else None,
    )
    return ValuationResponse(success=True, headline=headline, methods=methods, lockup=lockup)
