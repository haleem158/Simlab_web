import Link from "next/link";
import { ApiDot } from "../ApiStatus";
import { Icon } from "../Icon";
import { Logo } from "../Logo";
import { NewRunMenu } from "../NewRunMenu";

export function Topbar() {
  return (
    <div className="tb">
      <Link className="mbrand" href="/" aria-label="Simlab home">
        <Logo height={26} />
        <span>Simlab</span>
      </Link>
      <NewRunMenu />
      <div className="r">
        <Link className="helpbtn" href="/guide" aria-label="How to use Simlab">
          <Icon n="book" style={{ width: 18, height: 18 }} />
        </Link>
        <ApiDot />
        <Link className="sb2 homelink" href="/">
          Home
          <Icon n="dash" style={{ width: 16, height: 16 }} />
        </Link>
      </div>
    </div>
  );
}
