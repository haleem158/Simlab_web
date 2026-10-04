import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import "../../styles/landing.css";
import { CountUp } from "../sl/CountUp";
import { Logo } from "../sl/Logo";
import { ScaleStage } from "./ScaleStage";

const Svg = ({
  size = 20,
  children,
}: {
  size?: number;
  children: ReactNode;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const I = {
  x: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9l6 6M15 9l-6 6" />
    </>
  ),
  line: <path d="M3 3v18h18M7 15l4-4 3 3 5-6" />,
  flask: (
    <path d="M9 3h6M10 3v6l-5 9a1.5 1.5 0 001.3 2.2h11.4A1.5 1.5 0 0019 18l-5-9V3" />
  ),
  dl: <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />,
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  warn: (
    <>
      <path d="M12 4l9 16H3z" />
      <path d="M12 10v4M12 17h.01" />
    </>
  ),
  skull: (
    <>
      <circle cx="12" cy="11" r="8" />
      <path d="M9 20v-2M15 20v-2M9 11h.01M15 11h.01" />
    </>
  ),
  coin: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M9.5 9.5a2.5 2 0 015 0c0 2-5 1.5-5 3.5a2.5 2 0 005 0" />
    </>
  ),
  arrow: <path d="M7 17L17 7M8 7h9v9" />,
};

const STATS = [
  {
    to: 90,
    pre: "",
    suf: "%",
    label: "Startup failure rate",
    note: "Poor tokenomics is a leading cause",
    icon: I.warn,
  },
  {
    to: 4000,
    pre: "",
    suf: "+",
    label: "Dead coins tracked",
    note: "65% from broken incentive models",
    icon: I.skull,
  },
  {
    to: 790,
    pre: "$",
    suf: "M",
    label: "Lost in 2022 alone",
    note: "From tokenomics-related failures",
    icon: I.coin,
  },
];

const FAILS = [
  {
    title: "Misaligned Incentives",
    text: "Unsustainable yields attract mercenary capital. Teams and VCs dump at unlock.",
  },
  {
    title: "Hyperinflation",
    text: "Excessive emissions and farming rewards create runaway supply growth.",
  },
  {
    title: "Broken Token Design",
    text: "No utility, weak burns, over-reliance on airdrops create boom-bust cycles.",
  },
  {
    title: "No Stress Testing",
    text: "Founders don't model edge cases or test sustainability under different scenarios.",
  },
];

const FEATS = [
  {
    icon: I.line,
    title: "Visual Analytics",
    text: "Interactive charts showing supply curves, inflation rates, and price trajectories.",
  },
  {
    icon: I.flask,
    title: "Monte Carlo Simulation",
    text: "Run stochastic models with confidence intervals for uncertainty analysis.",
  },
  {
    icon: I.dl,
    title: "CSV Import/Export",
    text: "Upload your own data or download results for deeper analysis.",
  },
  {
    icon: I.target,
    title: "Preset Scenarios",
    text: "Start with Bitcoin, Ethereum, or DeFi templates and customize.",
  },
];

function Cards({
  items,
}: {
  items: { icon: ReactNode; title: string; text: string }[];
}) {
  return (
    <div className="cards">
      {items.map((c, i) => (
        <div className={`card${i === 0 ? " first" : ""}`} key={c.title}>
          <div className="cic">
            <Svg>{c.icon}</Svg>
          </div>
          <h4>{c.title}</h4>
          <p>{c.text}</p>
        </div>
      ))}
    </div>
  );
}

function MobileLanding() {
  return (
    <div className="mob">
      <section className="m-l1">
        <div className="m-c1" />
        <div className="m-c2" />
        <div className="m-logo">
          <Logo height={32} />
        </div>
        <h1 className="m-giant">Simlab</h1>
        <div className="m-dev">
          <div className="bezel">
            <Image
              src="/landing/simulator-screen.webp"
              alt="The Simlab Token Supply Simulator showing supply, staking and burn results"
              width={1858}
              height={788}
              unoptimized
            />
          </div>
        </div>
        <div className="m-cta">
          <Link className="btn main" href="/dashboard">
            Open dashboard
            <Svg size={18}>{I.arrow}</Svg>
          </Link>
          <a className="btn out" href="#why-m">
            Learn why it matters
          </a>
        </div>
      </section>

      <section className="m-l2" id="why-m">
        <span className="m-badge">
          <i />
          Why it matters
        </span>
        <h2 className="m-big">
          Design token economies <span className="hl">that last</span>
        </h2>
        <p className="m-lead">
          Most protocols fail not from technology, but from broken incentives.
          Simlab helps you model supply, demand, and participant behavior before
          deployment, turning guesswork into evidence-based design.
        </p>
        <div className="m-stats">
          {STATS.map((st, i) => (
            <div className={`m-stat${i === 0 ? " first" : ""}`} key={st.label}>
              <div className="m-pic">
                <Svg size={22}>{st.icon}</Svg>
              </div>
              <div>
                <div className="m-pnum">
                  <CountUp to={st.to} dec={0} pre={st.pre} suf={st.suf} />
                </div>
                <div className="m-plab">{st.label}</div>
                <div className="m-pnote">{st.note}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="m-panel">
          <h2>
            Why protocols <span className="hl">fail</span>
          </h2>
          <p className="sub">
            Token economies are <b>complex, non-deterministic systems</b> where
            supply, demand, user behavior, and governance interact dynamically.
            Most founders launch with assumptions that collapse under real-world
            stress.
          </p>
          <MobileCards items={FAILS.map((f) => ({ ...f, icon: I.x }))} />
        </div>

        <div className="m-panel">
          <h2>
            Built for <span className="hl">serious</span> teams
          </h2>
          <p className="sub">
            Everything you need to model, test, and trust your token design
            before it goes live.
          </p>
          <MobileCards items={FEATS} />
        </div>

        <div className="m-strip">
          <h4>Model before you deploy</h4>
          <p>
            Simlab turns complex token dynamics into testable, visual
            simulations, so you can design for sustainability, not speculation.
          </p>
          <div className="m-brand">
            <Logo height={30} />
            Simlab
          </div>
          <div className="m-tag">Evidence-based token design</div>
          <div className="m-copy">
            &copy; {new Date().getFullYear()} Simlab. Empowering data-driven
            token design.
          </div>
        </div>
      </section>
    </div>
  );
}

function MobileCards({
  items,
}: {
  items: { icon: ReactNode; title: string; text: string }[];
}) {
  return (
    <div className="m-cards">
      {items.map((c, i) => (
        <div className={`m-card${i === 0 ? " first" : ""}`} key={c.title}>
          <div className="m-cic">
            <Svg>{c.icon}</Svg>
          </div>
          <div>
            <h4>{c.title}</h4>
            <p>{c.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Landing() {
  return (
    <div className="lp">
      <div className="dsk">
        <ScaleStage>
          <section className="s1" id="top">
            <div className="c1" />
            <div className="c2" />
            <div className="logo">
              <Logo height={40} />
            </div>
            <h1 className="giant">Simlab</h1>
            <div className="cta">
              <Link className="btn main" href="/dashboard">
                Open dashboard
                <Svg size={18}>{I.arrow}</Svg>
              </Link>
              <a className="btn out" href="#why">
                Learn why it matters
              </a>
            </div>
            <div className="dev">
              <div className="bezel">
                <Image
                  src="/landing/simulator-screen.webp"
                  alt="The Simlab Token Supply Simulator showing supply, staking and burn results"
                  width={1858}
                  height={788}
                  priority
                  unoptimized
                />
              </div>
            </div>
          </section>

          <section className="s2" id="why">
            <div className="hero2">
              <div>
                <span className="badge">
                  <i />
                  Why it matters
                </span>
                <h2 className="big">
                  Design token economies <span className="hl">that last</span>
                </h2>
                <p className="lead">
                  Most protocols fail not from technology, but from broken
                  incentives. Simlab helps you model supply, demand, and
                  participant behavior before deployment, turning guesswork into
                  evidence-based design.
                </p>
              </div>
              <div className="pills">
                {STATS.map((s, i) => (
                  <div className={`pill${i + 1}`} key={s.label}>
                    <div className="pic">
                      <Svg size={22}>{s.icon}</Svg>
                    </div>
                    <div className="pnum">
                      <CountUp to={s.to} dec={0} pre={s.pre} suf={s.suf} />
                    </div>
                    <div className="plab">{s.label}</div>
                    <div className="pnote">{s.note}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <h2>
                Why protocols <span className="hl">fail</span>
              </h2>
              <p className="sub">
                Token economies are <b>complex, non-deterministic systems</b>{" "}
                where supply, demand, user behavior, and governance interact
                dynamically. Most founders launch with assumptions that collapse
                under real-world stress.
              </p>
              <Cards items={FAILS.map((f) => ({ ...f, icon: I.x }))} />
            </div>

            <div className="panel" style={{ marginTop: 40 }}>
              <h2>
                Built for <span className="hl">serious</span> teams
              </h2>
              <p className="sub">
                Everything you need to model, test, and trust your token design
                before it goes live.
              </p>
              <Cards items={FEATS} />
            </div>

            <div className="strip">
              <div>
                <h4>Model before you deploy</h4>
                <p>
                  Simlab turns complex token dynamics into testable, visual
                  simulations, so you can design for sustainability, not
                  speculation.
                </p>
              </div>
              <div>
                <div className="brandrow">
                  <Logo height={34} />
                  Simlab
                </div>
                <div className="tag">Evidence-based token design</div>
              </div>
              <div className="copy">
                &copy; {new Date().getFullYear()} Simlab. Empowering data-driven
                token design.
              </div>
            </div>
          </section>
        </ScaleStage>
      </div>
      <MobileLanding />
    </div>
  );
}
