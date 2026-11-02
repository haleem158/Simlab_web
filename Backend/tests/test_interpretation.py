"""Readings checked against the $VAR runs. Run: python tests/test_interpretation.py"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.models.token_impact import CSVRow, TokenImpactParams  # noqa: E402
from app.models.token_supply import TokenSupplyParams  # noqa: E402
from app.models.valuation import (  # noqa: E402
    CashflowInputs, LockRole, LockupInputs, NetworkInputs, PeerInputs, ValuationParams,
)
from app.models.vesting import VestingParams, VestingRole  # noqa: E402
from app.services.interpretation import read_impact, read_supply, read_valuation, read_vesting  # noqa: E402
from app.services.token_impact_simulator import TokenImpactSimulator  # noqa: E402
from app.services.token_supply_simulator import TokenSupplySimulator  # noqa: E402
from app.services.valuation import run_valuation  # noqa: E402
from app.services.vesting_simulator import VestingSimulator  # noqa: E402


def role(name, pct, cliff, vest, init=0.0, freq="monthly"):
    return VestingRole(name=name, allocation_pct=pct, cliff_months=cliff, vesting_months=vest,
                       activation_ratio=1.0, governance_fraction=0.0,
                       initial_unlock_pct=init, release_frequency=freq)


DIST_A = [role("Genesis airdrop", 32, 0, 1, 100), role("Ecosystem reserve", 18, 6, 42, 0, "quarterly"),
          role("Team and investors", 50, 12, 36)]
DIST_B = [role("Genesis airdrop", 33, 0, 1, 100), role("Ecosystem and rewards", 30, 0, 48),
          role("Team", 18, 12, 36), role("Investors", 14, 12, 36), role("Liquidity", 5, 0, 1, 100)]


def vesting(roles):
    p = VestingParams(total_supply=1e9, months=60, roles=roles, annual_discount_rate=0.0)
    return p, VestingSimulator.simulate(p)


def impact(results, annual_growth):
    g = (1 + annual_growth) ** (1 / 12) - 1
    prev, rows = 0.0, []
    for r in results:
        rows.append(CSVRow(month=str(r.month), unlocked_tokens=r.total_unlocked - prev, emission=0.0,
                           tx_volume_growth_pct=g * 100, staking_growth_pct=0.0))
        prev = r.total_unlocked
    p = TokenImpactParams(csv_data=rows, initial_circ_supply=0.0, alpha=1.0, epsilon=1.0, calibrate=True,
                          anchor_mode="current_price", anchor_price=1.53, global_activation=0.85)
    return p, TokenImpactSimulator.simulate(p)


def text(reading):
    return " ".join([reading.headline] + [i for s in reading.sections for i in s.items])


def test_impact_matches_var_runs():
    pa, ra = impact(vesting(DIST_A)[1], 0.25)
    rd = read_impact(pa, ra)
    t = text(rd)
    assert "-4.1%" in rd.headline and "34%" in rd.headline, rd.headline
    assert rd.tone == "risk"
    assert "about 36% a year" in t and "about 26% a year" in t, t
    pb, rb = impact(vesting(DIST_B)[1], 0.25)
    rdb = read_impact(pb, rb)
    assert "+15.7%" in rdb.headline and "13%" in rdb.headline, rdb.headline
    assert "about 30% a year" in text(rdb) and "about 21% a year" in text(rdb)
    pa75, ra75 = impact(vesting(DIST_A)[1], 0.75)
    assert read_impact(pa75, ra75).tone == "good"


def test_vesting_reading_matches_var():
    pa, ra = vesting(DIST_A)
    rd = read_vesting(pa, ra)
    t = text(rd)
    assert "32.0% of supply is unlocked in month 1" in t, t
    assert "month 13" in t and "63%" in t, t
    assert "2.67%" in t or "2.7%" in t, t
    pb, rb = vesting(DIST_B)
    assert "38.6% of supply is unlocked in month 1" in text(read_vesting(pb, rb))


def test_supply_demand_beats_burn():
    p = TokenSupplyParams(total_supply=10, initial_supply=9.9, years=5, annual_inflation_rate=0.0,
                          min_inflation_rate=0.0, inflation_decay_rate=0.0, burn_rate=0.012,
                          demand_growth_rate=0.25, price_scale=15.28)
    res = TokenSupplySimulator.simulate(p)
    rd = read_supply(p, res)
    drivers = rd.sections[0].items
    assert drivers[0].startswith("The top lever"), drivers
    assert drivers[1].startswith("Demand growth"), drivers
    assert any("ceiling" in c for c in rd.caveats)


def test_valuation_flags_defaults():
    p = ValuationParams(
        network=NetworkInputs(economy_millions=2000, velocity=20, float_millions=40, horizon_years=10, rate_low_pct=30, rate_high_pct=50),
        cashflow=CashflowInputs(fees_year1_millions=1.5, growth_year2_pct=50, rate_pct=30, total_tokens_millions=100),
        peers=PeerInputs(multiples=[6, 9, 14]),
        lockup=LockupInputs(volatility_pct=100, roles=[LockRole(name="Team", allocation_pct=50, cliff_months=12, vesting_months=36)]),
    )
    rd = read_valuation(p, run_valuation(p))
    assert sum(i.status == "default" for i in rd.inputs) == 7
    assert "3 fee and peer inputs are still" in rd.caveats[0]
    real = p.model_copy(deep=True)
    real.cashflow.fees_year1_millions = 16
    real.cashflow.total_tokens_millions = 1000
    real.peers.multiples = [31, 53, 88]
    rd2 = read_valuation(real, run_valuation(real))
    assert sum(i.status == "default" for i in rd2.inputs) == 4
    assert all("fee and peer inputs" not in c for c in rd2.caveats)
    assert any("payment" in c for c in rd2.caveats)


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
            print("ok", name)
