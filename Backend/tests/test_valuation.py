"""Valuation maths checked against published figures. Run: python tests/test_valuation.py"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.models.valuation import (  # noqa: E402
    CashflowInputs, LockRole, NetworkInputs, ValuationParams,
)
from app.services.valuation import (  # noqa: E402
    lockup_discount, network_value, role_discount, run_valuation, scorecard_multiplier,
)


def close(a, b, tol):
    assert abs(a - b) <= tol, f"{a} vs {b} (tol {tol})"


def test_cfa_example():
    # CFA Institute: sigma 140%, average wait 0.5y -> 23.4% (Ghaidarov)
    close(lockup_discount(1.4, 0.5, "ghaidarov"), 0.234, 0.0005)


def test_finnerty_cap():
    # Withum: Finnerty never exceeds about 32.3%
    d = lockup_discount(5.0, 30.0, "finnerty")
    close(d, 0.3228, 0.0005)
    assert lockup_discount(0.5, 200.0, "finnerty") < 0.3231


def test_tiny_and_zero():
    assert lockup_discount(1.0, 0.0) == 0.0
    assert 0.0 <= lockup_discount(0.001, 0.01) < 0.01
    for m in ("ghaidarov", "finnerty"):
        assert 0.0 <= lockup_discount(3.0, 40.0, m) <= 1.0


def test_per_tranche():
    r = LockRole(name="x", allocation_pct=100, cliff_months=0, vesting_months=12)
    d = role_discount(r, 1.4, "ghaidarov")
    close(d.discount, 0.2343, 0.0002)
    close(d.average_wait_years, 6.5 / 12, 1e-9)


def test_initial_unlock_at_cliff_zero_is_free():
    r = LockRole(name="x", allocation_pct=100, cliff_months=0, vesting_months=12, initial_unlock_pct=100)
    assert role_discount(r, 1.4, "ghaidarov").discount == 0.0


def test_scorecard():
    close(scorecard_multiplier([125, 150, 100, 75, 80, 100, 100]), 1.155, 1e-9)
    close(4.5 * 1.155, 5.1975, 1e-9)


def test_burniske_identity():
    n = NetworkInputs(economy_millions=1000, velocity=20, float_millions=40,
                      horizon_years=10, rate_low_pct=30, rate_high_pct=50)
    # (1000/20)/40 = 1.25 $ per token in year 10, marked down
    close(network_value(n, 50), 1.25 / 1.5 ** 10, 1e-9)
    close(network_value(n, 30), 1.25 / 1.3 ** 10, 1e-9)


def test_cashflow_flat():
    c = CashflowInputs(fees_year1_millions=1, growth_year2_pct=0, rate_pct=20,
                       terminal_growth_pct=0, total_tokens_millions=1)
    from app.services.valuation import cashflow_value
    # flat 1/yr forever at 20% = 5.0
    close(cashflow_value(c, 20, 0), 5.0, 1e-9)


def test_full_run():
    p = ValuationParams.model_validate({
        "network": {"economy_millions": 2000, "velocity": 20, "float_millions": 40,
                    "rate_low_pct": 30, "rate_high_pct": 50},
        "cashflow": {"fees_year1_millions": 1.5, "growth_year2_pct": 50,
                     "rate_pct": 30, "total_tokens_millions": 100},
        "peers": {"multiples": [6, 9, 14]},
        "prelaunch": {"enabled": True, "ratings_pct": [125, 150, 100, 75, 80, 100, 100]},
        "lockup": {"volatility_pct": 100, "roles": [
            {"name": "Team", "allocation_pct": 20, "cliff_months": 12, "vesting_months": 36}]},
    })
    r = run_valuation(p)
    assert len(r.methods) == 4
    assert r.headline.low <= r.headline.high
    assert r.headline.agreement in ("close", "rough", "wide")
    assert 0 < r.lockup.blended_discount < 1
    assert r.headline.locked_low < r.headline.low
    for m in r.methods:
        assert m.low <= m.mid <= m.high, m


def test_validation_errors():
    try:
        CashflowInputs(fees_year1_millions=1, growth_year2_pct=0, rate_pct=8,
                       terminal_growth_pct=3, total_tokens_millions=1)
    except ValueError:
        return
    raise AssertionError("expected rate/growth validation error")


if __name__ == "__main__":
    n = 0
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
            n += 1
            print("ok", name)
    print(f"{n} passed")
