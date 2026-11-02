from app.models.token_supply import TokenSupplyParams
from app.services.token_supply_simulator import TokenSupplySimulator as Sim


def base(**kw):
    p = dict(total_supply=1000, initial_supply=100, years=2, annual_inflation_rate=0,
             min_inflation_rate=0, inflation_decay_rate=0, price_scale=1.0)
    p.update(kw)
    return TokenSupplyParams(**p)


def test_schedule_adds_unlocks_to_float():
    sched = [50.0 * (i + 1) for i in range(24)]  # 50 tokens released every month
    d = Sim.simulate(base(unlock_schedule=sched))
    assert abs(d[0].circulating - 150) < 1e-6
    assert d[23].circulating == 1000  # 100 + 1200 is capped at total supply


def test_no_schedule_unchanged():
    a = Sim.simulate(base(vesting_months=12))
    b = Sim.simulate(base(vesting_months=12, unlock_schedule=None))
    assert [x.circulating for x in a] == [x.circulating for x in b]


def test_burn_and_schedule_interact():
    sched = [10.0 * (i + 1) for i in range(24)]
    d0 = Sim.simulate(base(unlock_schedule=sched))
    d1 = Sim.simulate(base(unlock_schedule=sched, burn_rate=0.2))
    assert d1[-1].circulating < d0[-1].circulating


def test_endpoint_accepts_schedule_and_reading_notes_it():
    from fastapi.testclient import TestClient
    from app.main import app
    c = TestClient(app)
    body = dict(total_supply=1000, initial_supply=100, years=2, annual_inflation_rate=0.02,
                min_inflation_rate=0.01, inflation_decay_rate=0.1,
                unlock_schedule=[20.0 * (i + 1) for i in range(24)])
    r = c.post("/api/v1/token-supply/simulate", json=body)
    assert r.status_code == 200, r.text
    caveats = " ".join(r.json()["reading"]["caveats"])
    assert "from your Vesting run" in caveats and "ceiling" not in caveats


def test_buyback_burns_more_when_revenue_is_higher():
    lo = Sim.simulate(base(price_scale=100, buyback_revenue_annual=12))
    hi = Sim.simulate(base(price_scale=100, buyback_revenue_annual=60))
    assert 0 < lo[-1].burned_cumulative < hi[-1].burned_cumulative
    assert hi[-1].circulating < lo[-1].circulating


def test_buyback_share_zero_changes_nothing():
    a = Sim.simulate(base(price_scale=100))
    b = Sim.simulate(base(price_scale=100, buyback_revenue_annual=100, buyback_share=0))
    assert [x.circulating for x in a] == [x.circulating for x in b]


def test_buyback_spend_matches_revenue_at_prior_price():
    d = Sim.simulate(base(price_scale=100, buyback_revenue_annual=120))  # 10 a month, launch price 1
    assert abs(d[0].buyback_burned - 10.0) < 1e-6
