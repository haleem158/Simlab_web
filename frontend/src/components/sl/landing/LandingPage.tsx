import Link from "next/link";
import { Icon } from "../Icon";
import { CountUp } from "../CountUp";

export function LandingPage() {
  return (
    <>
      <div className="nav">
        <div className="logo">
          <i>S</i>Simlab
        </div>
        <div className="links">
          <Link href="/dashboard">Platform</Link>
          <Link href="/token-supply">Simulators</Link>
          <Link href="/token-supply">Monte Carlo</Link>
          <Link href="#">Pricing</Link>
          <Link href="#">Enterprise</Link>
        </div>
        <div className="navr">
          <Link href="/dashboard">Sign in</Link>
          <Link className="btn coral" href="/dashboard">
            Start Free Trial
          </Link>
        </div>
      </div>
      <div className="hero">
        <h1>Design token economies that last</h1>
        <p>
          Model supply, demand, and holder behavior before you deploy. Run
          vesting, price impact, and Monte Carlo simulations, all in one unified
          platform.
        </p>
        <div className="cta">
          <Link className="btn coral" href="/dashboard">
            Start Simulation
          </Link>
          <Link className="btn ghost" href="#why-it-matters">
            Learn Why It Matters
          </Link>
        </div>
        <div className="prod">
          <div className="ps">
            <div className="logo">
              <i>S</i>Simlab Hub
            </div>
            <div className="pi on">
              <Icon n="dash" />
              Overview<span className="bd">3</span>
            </div>
            <div className="pi">
              <Icon n="coins" />
              Token supply
            </div>
            <div className="pi">
              <Icon n="cal" />
              Vesting<span className="bd">2</span>
            </div>
            <div className="pi">
              <Icon n="down" />
              Price impact
            </div>
            <div className="pi">
              <Icon n="flask" />
              Monte Carlo
            </div>
            <div className="pi">
              <Icon n="clock" />
              Saved runs
            </div>
            <div className="pi">
              <Icon n="bars" />
              Analytics
            </div>
          </div>
          <div className="pm">
            <div className="ph">
              <div>
                <h3>Simulation overview</h3>
                <small>
                  Live model outputs across all runs. Last updated 1 min ago
                </small>
              </div>
              <div className="ctl">
                <div className="sel">
                  <Icon
                    n="refresh"
                    style={{ width: "16px", height: "16px", color: "#ff6a5a" }}
                  />
                </div>
                <div className="sel">
                  Sep 2026
                  <Icon n="cd" style={{ width: "14px", height: "14px" }} />
                </div>
                <div className="sel">
                  All models
                  <Icon n="cd" style={{ width: "14px", height: "14px" }} />
                </div>
                <a
                  className="btn vio"
                  style={{
                    height: "36px",
                    padding: "0 16px",
                    fontSize: "13px",
                  }}
                >
                  <Icon n="plus" style={{ width: "14px", height: "14px" }} />
                  New Simulation
                </a>
              </div>
            </div>
            <div className="kpis">
              <div className="kpi">
                <div className="l">Simulations run</div>
                <div className="v">
                  <CountUp to={342} dec={0} pre="" suf="" />
                </div>
                <div className="s">+18 this week</div>
                <div className="mb">
                  <b style={{ height: "10px" }}></b>
                  <b style={{ height: "14px" }}></b>
                  <b style={{ height: "18px" }}></b>
                  <b style={{ height: "26px" }}></b>
                </div>
              </div>
              <div className="kpi">
                <div className="l">Live runs</div>
                <div className="v">
                  <CountUp to={12} dec={0} pre="" suf="" />
                </div>
                <div className="s">4 finishing today</div>
                <div className="mb">
                  <b style={{ height: "16px" }}></b>
                  <b style={{ height: "12px" }}></b>
                  <b style={{ height: "20px" }}></b>
                  <b style={{ height: "14px" }}></b>
                </div>
              </div>
              <div className="kpi warn">
                <div className="l">Risk flags</div>
                <div className="v">
                  <CountUp to={8} dec={0} pre="" suf="" />
                </div>
                <div className="s">Needs review</div>
                <div className="mb">
                  <b style={{ height: "8px" }}></b>
                  <b style={{ height: "14px" }}></b>
                  <b style={{ height: "22px" }}></b>
                  <b style={{ height: "26px" }}></b>
                </div>
              </div>
              <div className="kpi">
                <div className="l">Stability score</div>
                <div className="v">
                  <CountUp to={94.2} dec={1} pre="" suf="%" />
                </div>
                <div className="s">Across saved runs</div>
                <div className="mb">
                  <b style={{ height: "18px" }}></b>
                  <b style={{ height: "20px" }}></b>
                  <b style={{ height: "22px" }}></b>
                  <b style={{ height: "26px" }}></b>
                </div>
              </div>
              <div className="kpi">
                <div className="l">Supply modeled</div>
                <div className="v">
                  <CountUp to={1.24} dec={2} pre="" suf="B" />
                </div>
                <div className="s">Year 5 projection</div>
                <div className="mb">
                  <b style={{ height: "10px" }}></b>
                  <b style={{ height: "16px" }}></b>
                  <b style={{ height: "20px" }}></b>
                  <b style={{ height: "26px" }}></b>
                </div>
              </div>
            </div>
            <div className="row2">
              <div className="cardp">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <h4>Supply trend</h4>
                    <small>Modeled supply by quarter</small>
                  </div>
                  <div
                    className="sel"
                    style={{ height: "30px", fontSize: "12px" }}
                  >
                    5 years
                    <Icon n="cd" style={{ width: "14px", height: "14px" }} />
                  </div>
                </div>
                <div className="bars">
                  <b style={{ height: "38%" }}></b>
                  <b style={{ height: "46%" }}></b>
                  <b style={{ height: "54%" }}></b>
                  <b style={{ height: "52%" }}></b>
                  <b style={{ height: "60%" }}></b>
                  <b style={{ height: "72%" }}></b>
                  <b style={{ height: "80%" }}></b>
                  <b style={{ height: "78%" }}></b>
                  <b style={{ height: "86%" }}></b>
                  <b style={{ height: "92%" }}></b>
                  <b style={{ height: "96%" }}></b>
                  <b style={{ height: "100%" }}></b>
                </div>
              </div>
              <div className="cardp">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <h4>Risk distribution</h4>
                    <small>By simulator</small>
                  </div>
                </div>
                <div className="donutw">
                  <svg
                    width="120"
                    height="120"
                    viewBox="0 0 42 42"
                    style={{ transform: "rotate(-90deg)" }}
                  >
                    <circle
                      cx="21"
                      cy="21"
                      r="15.9"
                      fill="none"
                      stroke="#141416"
                      strokeWidth="5"
                    />
                    <circle
                      cx="21"
                      cy="21"
                      r="15.9"
                      fill="none"
                      stroke="#6d4cf5"
                      strokeWidth="5"
                      pathLength="100"
                      strokeDasharray="42 58"
                      strokeDashoffset="0"
                    />
                    <circle
                      cx="21"
                      cy="21"
                      r="15.9"
                      fill="none"
                      stroke="#f87171"
                      strokeWidth="5"
                      pathLength="100"
                      strokeDasharray="18 82"
                      strokeDashoffset="-42"
                    />
                    <circle
                      cx="21"
                      cy="21"
                      r="15.9"
                      fill="none"
                      stroke="#fb923c"
                      strokeWidth="5"
                      pathLength="100"
                      strokeDasharray="16 84"
                      strokeDashoffset="-60"
                    />
                    <circle
                      cx="21"
                      cy="21"
                      r="15.9"
                      fill="none"
                      stroke="#facc15"
                      strokeWidth="5"
                      pathLength="100"
                      strokeDasharray="14 86"
                      strokeDashoffset="-76"
                    />
                    <circle
                      cx="21"
                      cy="21"
                      r="15.9"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="5"
                      pathLength="100"
                      strokeDasharray="10 90"
                      strokeDashoffset="-90"
                    />
                  </svg>
                  <div className="legend">
                    <div>
                      <i style={{ background: "#6d4cf5" }}></i>Token supply
                      <span>42%</span>
                    </div>
                    <div>
                      <i style={{ background: "#f87171" }}></i>Vesting
                      <span>18%</span>
                    </div>
                    <div>
                      <i style={{ background: "#fb923c" }}></i>Price impact
                      <span>16%</span>
                    </div>
                    <div>
                      <i style={{ background: "#facc15" }}></i>Monte Carlo
                      <span>14%</span>
                    </div>
                    <div>
                      <i style={{ background: "#38bdf8" }}></i>Presets
                      <span>10%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
