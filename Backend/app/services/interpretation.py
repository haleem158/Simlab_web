"""Plain-language readings of simulation results.

Every sentence is built from the numbers by fixed rules, so the same result always
gives the same reading and each claim can be checked against the result.
"""
from typing import List, Optional

import numpy as np

from app.models.interpretation import InputFlag, Reading, ReadingSection
from app.models.token_impact import TokenImpactParams
from app.models.token_supply import TokenSupplyParams
from app.models.valuation import ValuationParams, ValuationResponse
from app.models.vesting import VestingParams, VestingRole
from app.services.token_supply_simulator import TokenSupplySimulator

# Starting numbers on the Valuation page. A run that still uses them has not been given real inputs.
VALUATION_PAGE_DEFAULTS = {
    "economy_millions": 2000.0, "velocity": 20.0, "float_millions": 40.0, "horizon_years": 10.0,
    "fees_year1_millions": 1.5, "total_tokens_millions": 100.0, "multiples": [6.0, 9.0, 14.0],
}


def _pct(x: float, digits: int = 1) -> str:
    return f"{x * 100:+.{digits}f}%"


def _share(x: float, digits: int = 1) -> str:
    return f"{x * 100:.{digits}f}%"


def _usd(x: float) -> str:
    if abs(x) >= 100:
        return f"${x:,.0f}"
    if abs(x) >= 1:
        return f"${x:,.2f}"
    return f"${x:,.3f}"


def _num(x: float) -> str:
    ax = abs(x)
    if ax >= 1e9:
        return f"{x / 1e9:.2f}B"
    if ax >= 1e6:
        return f"{x / 1e6:.1f}M"
    if ax >= 1e3:
        return f"{x / 1e3:.1f}K"
    return f"{x:,.2f}"


def _flag(name: str, value, default) -> InputFlag:
    same = False
    try:
        same = abs(float(value) - float(default)) < 1e-9
    except (TypeError, ValueError):
        same = value == default
    return InputFlag(name=name, value=str(value), status="default" if same else "set")


def _annual(monthly: float) -> float:
    return (1.0 + monthly) ** 12 - 1.0


# ------------------------------------------------------------------ token supply

def _final_price(params: TokenSupplyParams) -> Optional[float]:
    """Final price of a steady (no random noise) run, or None if the run hit the supply cap and froze."""
    res = TokenSupplySimulator.simulate(params.model_copy(update={"stochastic": False}))
    if len(res) > 1 and res[-1].price == res[-2].price and res[-1].demand_index == res[-2].demand_index:
        return None
    return res[-1].price


def read_supply(params: TokenSupplyParams, results) -> Reading:
    first, last = results[0], results[-1]
    years = len(results) / 12.0
    change = last.price / first.price - 1.0 if first.price > 0 else 0.0
    burned_share = last.burned_cumulative / params.total_supply
    circ_change = last.circulating / first.circulating - 1.0 if first.circulating > 0 else 0.0

    headline = (
        f"Over {years:.0f} years the price index moves {_pct(change, 0)}, "
        f"circulating supply moves {_pct(circ_change)} and {_share(burned_share)} of total supply is burned."
    )
    tone = "good" if change > 0 else "risk"

    # How much each lever moves the final price, one step at a time.
    base = _final_price(params)
    levers = []

    def step(label: str, field: str, delta: float, hi: float):
        cur = getattr(params, field)
        new = min(hi, cur + delta)
        if base is None or new - cur < 1e-12 or base <= 0:
            return
        alt = _final_price(params.model_copy(update={field: new}))
        if alt is None:
            return
        moved = alt / base - 1.0
        levers.append((abs(moved), f"{label}: {_pct(moved)} on the final price"))

    step("Demand growth +10 points a year", "demand_growth_rate", 0.10, 1.0)
    step("Burn rate +1 point a year", "burn_rate", 0.01, 1.0)
    step("Inflation +1 point a year", "annual_inflation_rate", 0.01, 10.0)
    step("Staking participation +10 points", "staking_rate", 0.10, 1.0)
    levers.sort(key=lambda t: -t[0])
    drivers = [t[1] for t in levers]
    if len(levers) >= 2 and levers[1][0] > 0 and levers[0][0] / levers[1][0] >= 2:
        drivers.insert(0, "The top lever moves the price at least twice as much as the next one.")

    timing: List[str] = []
    issuance = [(r.new_tokens, r.month) for r in results if r.new_tokens > 0]
    if issuance:
        amt, mo = max(issuance)
        timing.append(f"Largest monthly issuance is in month {mo}: {_num(amt)} tokens.")
    else:
        timing.append("No new tokens are issued, so supply changes only through the burn.")

    caveats = ["The price here is demand divided by circulating supply, scaled by the price scale. Read it as an index, not a price target."]
    has_sched = bool(getattr(params, "unlock_schedule", None))
    if has_sched:
        caveats.append("Unlocks come from your Vesting run and join the circulating supply. Holders selling those unlocks is not modelled here, so test sell pressure in Price Impact.")
    elif params.vesting_months == 0:
        caveats.append("This run has no unlock schedule, so it is a ceiling: nothing unlocks onto the market. Test unlocks in Vesting and Price Impact.")
    if getattr(params, "buyback_revenue_annual", 0) > 0 and params.buyback_share > 0:
        caveats.append("Buyback burns are revenue times the share spent, divided by last month's price, so a falling price buys more tokens. The price here is an index scaled by the price scale, so set the price scale to your real launch price before reading the burn in dollars.")
    if params.burn_rate > 0:
        caveats.append("The burn is a fixed share of the float each year. If buybacks are paid from revenue, check that revenue is large enough to fund it.")
    if params.stochastic:
        caveats.append("Random noise is on, so the numbers change from run to run.")

    inputs = [
        _flag("Demand growth a year", params.demand_growth_rate, 0.02),
        _flag("Burn rate a year", params.burn_rate, 0.0),
        _flag("Annual inflation", params.annual_inflation_rate, 0.0),
        _flag("Staking participation", params.staking_rate, 0.0),
        _flag("Price scale", params.price_scale, 1.0),
        _flag("Activity multiplier", params.tx_activity_index, 1.0),
    ]
    return Reading(
        headline=headline, tone=tone,
        sections=[
            ReadingSection(key="drivers", title="What moves the price most", items=drivers or ["No lever changes the price in this run."]),
            ReadingSection(key="timing", title="Timing", items=timing),
        ],
        inputs=inputs,
        next_test="Run Vesting for the same token and compare, because this run ignores unlock selling." if (params.vesting_months == 0 and not has_sched)
        else "Change the demand growth to a lower case and see whether the result still holds.",
        caveats=caveats,
    )


# ------------------------------------------------------------------ vesting

def _first_unlock_month(results, role_name: str) -> Optional[int]:
    prev = 0.0
    for r in results:
        cur = r.by_role[role_name]["unlocked"]
        if cur - prev > 1e-9 and r.month > 1:
            return r.month
        prev = cur
    return None


def read_vesting(params: VestingParams, results) -> Reading:
    total = params.total_supply
    unlocked = np.array([r.total_unlocked for r in results])
    share = unlocked / total
    n = len(results)
    new = np.diff(unlocked, prepend=0.0)

    start_share = share[0]
    full = next((r.month for r, s in zip(results, share) if s >= 0.9999 * min(1.0, sum(x.allocation_pct for x in params.roles) / 100.0)), None)

    # Growth of the unlocked amount over each year: months 1 to 12, 13 to 24, and so on.
    edges = [1] + list(range(12, n + 1, 12))
    blocks = []
    for e0, e1 in zip(edges[:-1], edges[1:]):
        base = unlocked[e0 - 1]
        if base > 0 and unlocked[e1 - 1] > base + 1e-9:
            blocks.append((unlocked[e1 - 1] / base - 1.0, f"months {1 if e0 == 1 else e0 + 1} to {e1}"))
    busiest = max(blocks, key=lambda t: t[0]) if blocks else None

    after = [(new[i], i + 1) for i in range(1, n) if new[i] > 0]
    big_amt = max((a for a, _ in after), default=0.0)
    big_mo = next((m for a, m in after if a >= 0.999 * big_amt), 0)
    repeats = sum(1 for a, _ in after if a >= 0.95 * big_amt) if after else 0

    headline = f"{_share(start_share)} of supply is unlocked in month 1"
    if busiest:
        headline += f", and the busiest stretch is {busiest[1]}, when the unlocked amount grows {_share(busiest[0], 0)}"
    headline += f". Everything allocated is unlocked by month {full}." if full else "."

    timing = []
    for m in (12, 24, 36):
        if m <= n:
            timing.append(f"Unlocked by month {m}: {_share(share[m - 1])} of supply.")
    if big_amt > 0:
        rep = f" This size repeats {repeats} times." if repeats > 1 else ""
        timing.append(f"Largest unlock after month 1: {_num(big_amt)} tokens ({_share(big_amt / total, 2)} of supply) in month {big_mo}.{rep}")

    drivers = []
    roles_sorted = sorted(params.roles, key=lambda r: -r.allocation_pct)
    for r in roles_sorted[:3]:
        fm = _first_unlock_month(results, r.name)
        when = f"starts to unlock in month {fm}" if fm else ("unlocks at launch" if r.initial_unlock_pct >= 100 or r.cliff_months == 0 else "does not unlock inside this horizon")
        drivers.append(f"{r.name} holds {r.allocation_pct:g}% of supply and {when}.")
    if blocks:
        drivers.append("Growth in the unlocked amount by block: " + "; ".join(f"{lab} {_pct(g, 0)}" for g, lab in blocks) + ".")

    caveats = ["Vesting shows when tokens become available, not whether holders sell them. Price Impact applies the unlocks to demand."]
    if any(r.activation_ratio < 1 for r in params.roles):
        caveats.append("Some roles use an activation ratio below 100%, so 'effective circulating' is lower than the unlocked amount.")
    if params.stochastic:
        caveats.append("Random noise is on in the unlock amounts.")
    inputs = [_flag(f"{r.name}: activation ratio", r.activation_ratio, 0.8) for r in params.roles]
    return Reading(
        headline=headline, tone="info",
        sections=[ReadingSection(key="drivers", title="Who unlocks and when", items=drivers),
                  ReadingSection(key="timing", title="Timing", items=timing)],
        inputs=inputs,
        next_test="Export these unlocks to Price Impact and test them against a slow and a fast demand path.",
        caveats=caveats,
    )


# ------------------------------------------------------------------ price impact

def read_impact(params: TokenImpactParams, results) -> Reading:
    p = np.array([r.indicative_price for r in results], dtype=float)
    s = np.array([r.effective_supply for r in results], dtype=float)
    d = np.array([r.demand_index for r in results], dtype=float)
    n = len(p)
    p0 = p[0]
    final_change = p[-1] / p0 - 1.0 if p0 > 0 else 0.0

    run_max = np.maximum.accumulate(p)
    dd = 1.0 - p / np.where(run_max > 0, run_max, 1.0)
    low_i = int(np.argmax(dd))
    peak_i = int(np.argmax(p[: low_i + 1])) if low_i > 0 else 0
    below = p < p0 * (1 - 1e-9)
    months_below = int(below.sum())
    first_below = int(np.argmax(below)) + 1 if months_below else None
    recovered = None
    if months_below and p[-1] >= p0:
        last_below = int(np.max(np.where(below)[0]))
        recovered = last_below + 2

    pct = _pct(final_change)
    if months_below == 0:
        tone = "good"
        headline = f"The price never falls below its starting level and ends {pct}"
    elif p[-1] >= p0:
        tone = "watch"
        headline = f"The price dips below its start but recovers, ending {pct}"
    else:
        tone = "risk"
        headline = f"The price ends below its start ({pct})"
    if dd[low_i] > 0.005:
        headline += f", with a {_share(dd[low_i], 0)} fall from its peak (month {peak_i + 1}) to its low (month {low_i + 1})"
    headline += "."

    d_mult = d[-1] / d[0] if d[0] > 0 else float("nan")
    s_mult = s[-1] / s[0] if s[0] > 0 else float("nan")
    drivers = []
    if np.isfinite(d_mult) and np.isfinite(s_mult):
        drivers.append(
            f"Demand grows {d_mult:.2f} times and the effective supply grows {s_mult:.2f} times, "
            f"so the price moves about {d_mult / (s_mult ** params.epsilon):.2f} times."
        )
    drivers.append("The price is demand divided by effective supply (to the power of epsilon). More unlocks lower it; more demand raises it.")

    thresholds: List[str] = []
    if n > 2 and s[0] > 0 and np.isfinite(d_mult) and d_mult > 0:
        t = np.arange(1, n)
        ratio = (s[1:] / s[0]) ** (params.epsilon / t) - 1.0
        g_never = max(0.0, float(ratio.max()))
        g_end = max(0.0, float(ratio[-1]))
        actual = d_mult ** (12.0 / (n - 1)) - 1.0
        thresholds.append(f"Demand in your data grows about {_share(actual, 0)} a year.")
        thresholds.append(f"To never fall below its start, demand would need to grow about {_share(_annual(g_never), 0)} a year.")
        thresholds.append(f"To end at its start, it would need about {_share(_annual(g_end), 0)} a year.")
        thresholds.append("These assume steady demand growth. They solve the same price formula, so they hold for this supply path only.")

    timing = []
    if months_below:
        timing.append(f"First month below the start: {first_below}. Months below the start: {months_below} of {n}.")
        timing.append(f"Back above the start in month {recovered}." if recovered else "It does not get back to its start inside this window.")
    else:
        timing.append("No month is below the start.")

    caveats = ["This is an index of relative price. It does not model who sells, how deep the market is, or how traders react before an unlock."]
    if params.anchor_mode in ("current_price", "current_market_cap") and params.calibrate:
        caveats.append("Prices are calibrated to your anchor. Read the percentage changes, not the dollar levels, as targets.")
    else:
        caveats.append("The price is not calibrated to a known price, so only percentage changes mean anything.")
    if params.run_monte_carlo:
        caveats.append("The uncertainty band adds independent monthly noise to the price. It is not a forecast interval.")
    inputs = [
        _flag("Activation", params.global_activation, 0.85),
        _flag("Epsilon", params.epsilon, 1.0),
        _flag("Transaction weight (alpha)", params.alpha, 0.6),
        _flag("Initial circulating supply", params.initial_circ_supply, 0.0),
    ]
    return Reading(
        headline=headline, tone=tone,
        sections=[ReadingSection(key="drivers", title="What drives it", items=drivers),
                  ReadingSection(key="thresholds", title="What demand has to do", items=thresholds),
                  ReadingSection(key="timing", title="Timing", items=timing)],
        inputs=inputs,
        next_test="Run the same demand path with a softer unlock in Vesting (a longer vesting period or a larger launch float) and compare the fall from peak.",
        caveats=caveats,
    )


# ------------------------------------------------------------------ valuation

def read_valuation(params: ValuationParams, res: ValuationResponse) -> Reading:
    by = {m.id: m for m in res.methods}
    parts = []
    for key, label in (("cashflow", "fees"), ("peers", "similar projects"), ("network", "network needs")):
        if key in by:
            parts.append(f"{label} {_usd(by[key].mid)}")
    ratio = res.headline.spread_ratio
    headline = "Middle cases per token: " + ", ".join(parts) + "."
    tone = {"close": "good", "rough": "watch", "wide": "risk"}[res.headline.agreement]

    drivers = []
    if "cashflow" in by:
        cf = params.cashflow
        implied = by["cashflow"].mid * cf.total_tokens_millions / cf.fees_year1_millions if cf.fees_year1_millions > 0 else None
        if implied:
            ms = params.peers.multiples
            drivers.append(
                f"The fee method values the whole token at about {implied:.0f} times year-1 fees. "
                f"The peers you picked trade at {min(ms):g} to {max(ms):g} times."
            )
    mids = sorted(res.methods, key=lambda m: m.mid)
    if len(mids) > 1:
        drivers.append(f"The highest middle case is {ratio:.1f} times the lowest ({mids[0].name.lower()} versus {mids[-1].name.lower()}).")
    if res.lockup.locked_share_pct > 0:
        drivers.append(
            f"{res.lockup.locked_share_pct:.0f}% of supply is still locked at launch; the average lock-up discount is {_share(res.lockup.blended_discount, 0)}."
        )

    thresholds = []
    if res.headline.locked_low is not None:
        thresholds.append(f"A token that is still locked is worth about {_usd(res.headline.locked_low)} to {_usd(res.headline.locked_high)}.")

    inputs = [
        _flag("Network economy ($M)", params.network.economy_millions, VALUATION_PAGE_DEFAULTS["economy_millions"]),
        _flag("Velocity", params.network.velocity, VALUATION_PAGE_DEFAULTS["velocity"]),
        _flag("Float in year T (M tokens)", params.network.float_millions, VALUATION_PAGE_DEFAULTS["float_millions"]),
        _flag("Years ahead", params.network.horizon_years, VALUATION_PAGE_DEFAULTS["horizon_years"]),
        _flag("Fees to holders, year 1 ($M)", params.cashflow.fees_year1_millions, VALUATION_PAGE_DEFAULTS["fees_year1_millions"]),
        _flag("Total tokens (M)", params.cashflow.total_tokens_millions, VALUATION_PAGE_DEFAULTS["total_tokens_millions"]),
        _flag("Peer multiples", ", ".join(f"{m:g}" for m in params.peers.multiples),
              ", ".join(f"{m:g}" for m in VALUATION_PAGE_DEFAULTS["multiples"])),
    ]
    net_names = {"Network economy ($M)", "Velocity", "Float in year T (M tokens)", "Years ahead"}
    core = [i for i in inputs if i.name not in net_names]
    net = [i for i in inputs if i.name in net_names]
    caveats = ["These are scenario values, not forecasts. Each rests on the inputs listed below."]
    n_core = sum(1 for i in core if i.status == "default")
    if n_core >= 2:
        caveats.insert(0, f"{n_core} of the 3 fee and peer inputs are still the page's starting numbers. Replace them with sourced figures before you rely on this.")
    if "network" in by:
        extra = " Its inputs are still the page's starting numbers." if any(i.status == "default" for i in net) else ""
        caveats.append("The network method suits tokens that are used to pay for something. If this token has no payment role, set that method aside." + extra)
    return Reading(
        headline=headline, tone=tone,
        sections=[ReadingSection(key="drivers", title="Why the methods differ", items=drivers),
                  ReadingSection(key="thresholds", title="Locked tokens", items=thresholds)] if thresholds else
        [ReadingSection(key="drivers", title="Why the methods differ", items=drivers)],
        inputs=inputs,
        next_test="Re-run with low, base and high fees to see how far each method moves.",
        caveats=caveats,
    )
