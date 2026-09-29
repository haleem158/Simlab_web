import Link from "next/link";
import { Icon } from "../Icon";
import { CountUp } from "../CountUp";

export function Sidebar() {
  return (
    <aside className="side">
      <div className="brand">
        <div>
          <div className="bl">
            <div className="bm">
              <Icon n="bars" style={{ width: "20px", height: "20px" }} />
            </div>
            <div>
              <div className="bn">
                Simlab<sup>®</sup>
              </div>
              <div className="bs">Tokenomics simulations</div>
            </div>
          </div>
        </div>
        <Icon n="cud" />
      </div>
      <div className="seg">
        <div className="on">Simulate</div>
        <div>Presets</div>
      </div>
      <Link className="ni on" href="/dashboard">
        <Icon n="dash" />
        Dashboard
      </Link>
      <Link className="ni" href="/token-supply">
        <Icon n="coins" />
        Token supply
      </Link>
      <Link className="ni" href="/vesting">
        <Icon n="cal" />
        Vesting
      </Link>
      <Link className="ni" href="/token-impact">
        <Icon n="down" />
        Price impact
      </Link>
      <Link
        className="ni"
        href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/docs`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Icon n="db" />
        API docs
        <Icon
          n="ur"
          style={{ width: "13px", height: "13px", marginLeft: "-4px" }}
        />
      </Link>
      <Link className="ni" href="/token-supply">
        <Icon n="flask" />
        Monte Carlo<span className="tag n">Beta</span>
      </Link>
      <Link className="ni" href="#">
        <Icon n="layers" />
        Saved runs<span className="tag">6</span>
        <Icon
          n="cu"
          style={{ marginLeft: "auto", width: "14px", height: "14px" }}
        />
      </Link>
      <div className="runs">
        <div className="run">
          <div className="rt" style={{ background: "#3b2f7a" }}>
            <Icon n="coins" />
          </div>
          <div>
            <small>Run: Token supply</small>
            <span>Final 1.24B</span>
          </div>
        </div>
        <div className="run">
          <div className="rt" style={{ background: "#7c2d2d" }}>
            <Icon n="tri" />
          </div>
          <div>
            <small>Run: Vesting</small>
            <span>Unlocked 38%</span>
          </div>
        </div>
        <div className="run">
          <div className="rt" style={{ background: "#5b35c9" }}>
            <Icon n="down" />
          </div>
          <div>
            <small>Run: Price impact</small>
            <span>Impact -14.8%</span>
          </div>
        </div>
        <div className="run f">
          <div className="rt" style={{ background: "#1f3a4a" }}>
            <Icon n="flask" />
          </div>
          <div>
            <small>Run: Monte Carlo</small>
            <span>1,000 scenarios</span>
          </div>
        </div>
      </div>
      <div className="pro">
        <Icon n="bolt" />
        <div>
          <b>Activate Pro</b>
          <small>Unlock all features on Simlab</small>
        </div>
      </div>
    </aside>
  );
}
