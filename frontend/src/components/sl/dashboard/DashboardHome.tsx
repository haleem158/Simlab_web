import Link from "next/link";
import { Icon } from "../Icon";
import { CountUp } from "../CountUp";

export function DashboardHome() {
  return (
    <div className="cnt">
      <div>
        <div className="hd">
          <div>
            <div className="rec">
              Recommended models for 24 hours
              <Icon n="clock" style={{ width: "14px", height: "14px" }} />
              <b>3 Models</b>
            </div>
            <h2>Top Simulators</h2>
          </div>
          <div className="flt">
            <div className="fl">
              <Icon n="cd" style={{ width: "12px", height: "12px" }} />
              24H
            </div>
            <div className="fl">
              <Icon n="cd" style={{ width: "12px", height: "12px" }} />
              All types
            </div>
            <div className="fl">
              <Icon n="cd" style={{ width: "12px", height: "12px" }} />
              Desc
            </div>
          </div>
        </div>
        <div className="cards">
          <div className="ac">
            <div className="t">
              <div className="ic" style={{ background: "#3b2f7a" }}>
                <Icon n="coins" />
              </div>
              <div>
                <small>Supply model</small>
                <div className="nm">Token supply</div>
              </div>
              <div className="go">
                <Icon n="ur" style={{ width: "15px", height: "15px" }} />
              </div>
            </div>
            <div className="lb">Emission rate</div>
            <div className="big">
              <CountUp to={13.62} dec={2} pre="" suf="%" />
            </div>
            <div className="chip" style={{ color: "#34d399" }}>
              <i style={{ background: "#34d399" }}></i>6.26%
            </div>
            <svg
              className="ch"
              viewBox="0 0 300 100"
              preserveAspectRatio="none"
            >
              <line
                x1="0"
                x2="300"
                y1="72"
                y2="72"
                stroke="#2a2a2e"
                strokeDasharray="2 4"
              />
              <path
                className="ln go"
                pathLength="1"
                d="M0 88 C22 62 38 54 56 74 C74 94 92 90 110 70 C128 50 146 60 166 70 C186 80 204 52 226 34 L250 24"
                fill="none"
                stroke="#a78bfa"
                strokeWidth="2.5"
              />
              <circle
                cx="110"
                cy="70"
                r="5"
                fill="#0a0a0a"
                stroke="#a78bfa"
                strokeWidth="2"
              />
              <circle
                cx="250"
                cy="24"
                r="5"
                fill="#0a0a0a"
                stroke="#a78bfa"
                strokeWidth="2"
              />
              <rect
                x="118"
                y="34"
                width="62"
                height="20"
                rx="10"
                fill="#0a0a0a"
                stroke="#2a2a2e"
              />
              <text
                x="149"
                y="48"
                textAnchor="middle"
                fontSize="11"
                fill="#e4e4e7"
              >
                +2,956
              </text>
            </svg>
          </div>
          <div className="ac">
            <div className="t">
              <div className="ic" style={{ background: "#7c2d2d" }}>
                <Icon n="cal" />
              </div>
              <div>
                <small>Unlock model</small>
                <div className="nm">Vesting</div>
              </div>
              <div className="go">
                <Icon n="ur" style={{ width: "15px", height: "15px" }} />
              </div>
            </div>
            <div className="lb">Unlock rate</div>
            <div className="big">
              <CountUp to={12.72} dec={2} pre="" suf="%" />
            </div>
            <div className="chip" style={{ color: "#34d399" }}>
              <i style={{ background: "#34d399" }}></i>6.67%
            </div>
            <svg
              className="ch"
              viewBox="0 0 300 100"
              preserveAspectRatio="none"
            >
              <line
                x1="0"
                x2="300"
                y1="72"
                y2="72"
                stroke="#2a2a2e"
                strokeDasharray="2 4"
              />
              <path
                className="ln go"
                pathLength="1"
                d="M0 84 C24 84 34 70 60 74 C86 78 100 96 128 82 C156 68 168 60 190 64 C212 68 222 44 246 32 L262 30"
                fill="none"
                stroke="#a78bfa"
                strokeWidth="2.5"
              />
              <circle
                cx="128"
                cy="82"
                r="5"
                fill="#0a0a0a"
                stroke="#a78bfa"
                strokeWidth="2"
              />
              <circle
                cx="262"
                cy="30"
                r="5"
                fill="#0a0a0a"
                stroke="#a78bfa"
                strokeWidth="2"
              />
              <rect
                x="176"
                y="34"
                width="62"
                height="20"
                rx="10"
                fill="#0a0a0a"
                stroke="#2a2a2e"
              />
              <text
                x="207"
                y="48"
                textAnchor="middle"
                fontSize="11"
                fill="#e4e4e7"
              >
                +2,009
              </text>
            </svg>
          </div>
          <div className="ac">
            <div className="t">
              <div className="ic" style={{ background: "#5b35c9" }}>
                <Icon n="down" />
              </div>
              <div>
                <small>Market model</small>
                <div className="nm">Price impact</div>
              </div>
              <div className="go">
                <Icon n="ur" style={{ width: "15px", height: "15px" }} />
              </div>
            </div>
            <div className="lb">Impact rate</div>
            <div className="big">
              <CountUp to={6.29} dec={2} pre="" suf="%" />
            </div>
            <div className="chip" style={{ color: "#f87171" }}>
              <i style={{ background: "#f87171" }}></i>1.89%
            </div>
            <svg
              className="ch"
              viewBox="0 0 300 100"
              preserveAspectRatio="none"
            >
              <line
                x1="0"
                x2="300"
                y1="72"
                y2="72"
                stroke="#2a2a2e"
                strokeDasharray="2 4"
              />
              <path
                className="ln go"
                pathLength="1"
                d="M0 78 C20 50 40 30 64 34 C88 38 104 58 124 72 C144 86 166 92 200 96"
                fill="none"
                stroke="#f87171"
                strokeWidth="2.5"
              />
              <circle
                cx="124"
                cy="72"
                r="5"
                fill="#0a0a0a"
                stroke="#f87171"
                strokeWidth="2"
              />
              <circle
                cx="200"
                cy="96"
                r="5"
                fill="#0a0a0a"
                stroke="#f87171"
                strokeWidth="2"
              />
              <rect
                x="196"
                y="54"
                width="60"
                height="20"
                rx="10"
                fill="#0a0a0a"
                stroke="#2a2a2e"
              />
              <text
                x="226"
                y="68"
                textAnchor="middle"
                fontSize="11"
                fill="#e4e4e7"
              >
                -987
              </text>
            </svg>
          </div>
        </div>
      </div>
      <div className="feat">
        <div className="fh">
          <div className="bl">
            <div
              className="bm"
              style={{ width: "26px", height: "26px", borderRadius: "7px" }}
            >
              <Icon n="bars" style={{ width: "15px", height: "15px" }} />
            </div>
            Simlab<sup style={{ fontSize: "9px" }}>®</sup>
          </div>
          <span className="nw">New</span>
        </div>
        <h3>Monte Carlo Engine</h3>
        <p>
          An all-in-one engine that helps you stress-test token economies across
          1,000 randomized scenarios.
        </p>
        <svg
          width="90"
          height="60"
          viewBox="0 0 90 60"
          style={{
            position: "absolute",
            right: "20px",
            top: "120px",
            opacity: ".5",
          }}
        >
          <path d="M4 56 L86 6" stroke="#8b7be0" strokeWidth="1" />
        </svg>
        <div className="fb">
          <Link className="btn lavb" href="/token-supply">
            Run 1,000 Scenarios
            <Icon n="flask" style={{ width: "16px", height: "16px" }} />
          </Link>
          <Link className="btn o" href="/vesting">
            Upload Token Data (CSV)
            <Icon n="up" style={{ width: "16px", height: "16px" }} />
          </Link>
        </div>
      </div>
      <div className="act">
        <div className="ah">
          <span>Your active simulations</span>
          <div className="ic4">
            <Icon n="line" />
            <Icon n="target" />
            <Icon n="refresh" />
            <Icon n="filter" />
          </div>
        </div>
        <div className="inn">
          <div>
            <div className="lu">
              Last update · 45 minutes ago
              <Icon n="clock" style={{ width: "14px", height: "14px" }} />
            </div>
            <div className="ttl">
              <h3>Token Supply Simulation</h3>
              <div className="ic">
                <Icon n="coins" />
              </div>
              <div className="sm">
                <Icon n="link" style={{ width: "15px", height: "15px" }} />
              </div>
              <div className="sm">
                <Icon n="share" style={{ width: "15px", height: "15px" }} />
              </div>
              <Link className="vp" href="/token-supply">
                View Run
                <Icon n="ur" style={{ width: "14px", height: "14px" }} />
              </Link>
            </div>
            <div className="cb">Projected supply, year 5</div>
            <div className="bal">
              <div className="n">
                <CountUp to={1.24} dec={2} pre="" suf="B" />
              </div>
              <Link className="btn lavb" href="/token-supply">
                Re-run
              </Link>
              <a className="btn ghost">Reset</a>
            </div>
          </div>
          <div className="per">
            <div className="r1">
              <div>
                <h4>Simulation Horizon</h4>
                <small>Projection period (months)</small>
              </div>
              <span className="cm">60 Months</span>
            </div>
            <div className="sl">
              <div className="tt">48 Months</div>
              <div className="tk"></div>
              <div className="hn"></div>
            </div>
          </div>
        </div>
        <div className="tabs">
          <div>
            <span>
              <b>Momentum</b>
              <small>Growth dynamics</small>
            </span>
            <Icon n="cud" style={{ width: "14px", height: "14px" }} />
          </div>
          <div>
            <span>
              <b>General</b>
              <small>Overview</small>
            </span>
            <Icon n="cud" style={{ width: "14px", height: "14px" }} />
          </div>
          <div>
            <span>
              <b>Risk</b>
              <small>Stress assessment</small>
            </span>
            <Icon n="cud" style={{ width: "14px", height: "14px" }} />
          </div>
          <div>
            <span>
              <b>Outcome</b>
              <small>Expected result</small>
            </span>
            <Icon n="cud" style={{ width: "14px", height: "14px" }} />
          </div>
        </div>
        <div className="mets">
          <div className="mc">
            <div className="h">
              Supply trend<em>24H</em>
            </div>
            <div className="v">
              -<CountUp to={0.82} dec={2} pre="" suf="%" />
            </div>
          </div>
          <div className="mc">
            <div className="h">
              Price<em>24H</em>
            </div>
            <div className="v">
              <CountUp to={41.99} dec={2} pre="$" suf="" />
              <small>-1.09%</small>
            </div>
          </div>
          <div className="mc">
            <div className="h">
              Staked ratio<em>24H</em>
            </div>
            <div className="v">
              <CountUp to={60.6} dec={1} pre="" suf="%" />
            </div>
          </div>
          <div className="mc">
            <div className="h">Emission rate</div>
            <div className="rb">
              <i style={{ width: "120px" }}></i>223%<span>Year 2</span>
            </div>
            <div className="rb">
              <i style={{ width: "80px", opacity: ".7" }}></i>146%
              <span>Year 4</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
