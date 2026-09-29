import Link from "next/link";
import { Icon } from "../Icon";
import { CountUp } from "../CountUp";

export function Topbar() {
  return (
    <div className="tb">
      <div className="usr">
        <div className="av">H</div>
        <div>
          <small>
            @haleem158 <span className="kyc">PRO</span>
          </small>
          <b>Haleem Taiwo</b>
        </div>
        <Icon n="cd" style={{ width: "14px", height: "14px" }} />
      </div>
      <Link
        className="btn lavb"
        style={{ height: "46px", borderRadius: "14px", padding: "0 20px" }}
        href="/token-supply"
      >
        New run
        <Icon n="plus" style={{ width: "16px", height: "16px" }} />
      </Link>
      <div className="r">
        <div className="ib">
          <Icon n="bell" />
          <em>2</em>
        </div>
        <div className="sb">
          Search
          <Icon n="refresh" style={{ width: "16px", height: "16px" }} />
        </div>
        <div className="sb2">
          Settings
          <Icon n="grid" style={{ width: "16px", height: "16px" }} />
        </div>
      </div>
    </div>
  );
}
