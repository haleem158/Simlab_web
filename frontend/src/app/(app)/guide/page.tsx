import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Guide - Simlab" };

type Item = { name: string; what: ReactNode; tip?: string };

function List({ items }: { items: Item[] }) {
  return (
    <div className="gl">
      {items.map((i) => (
        <div className="gi" key={i.name}>
          <div className="gn">{i.name}</div>
          <div className="gd">{i.what}</div>
          {i.tip ? <div className="gt">{i.tip}</div> : null}
        </div>
      ))}
    </div>
  );
}

function Example({ children }: { children: ReactNode }) {
  return (
    <div className="gex">
      <b>Try this</b>
      <p>{children}</p>
    </div>
  );
}

function Section({
  id,
  kicker,
  title,
  answers,
  children,
  link,
  linkLabel,
}: {
  id: string;
  kicker: string;
  title: string;
  answers: string;
  children: ReactNode;
  link: string;
  linkLabel: string;
}) {
  return (
    <section className="panel gsec" id={id}>
      <div className="rec">{kicker}</div>
      <h3 className="gh">{title}</h3>
      <p className="ganswer">{answers}</p>
      {children}
      <Link className="btn ghost gopen" href={link}>
        {linkLabel}
      </Link>
    </section>
  );
}

export default function GuidePage() {
  return (
    <div className="pgi guide">
      <div className="rec">Guide</div>
      <h2 className="gtitle">How to use Simlab</h2>
      <p className="gintro">
        Pick a simulator, change a few numbers, press Run, and read the results.
        Everything you run is saved in your own browser, so you can come back to
        it on the dashboard.
      </p>
      <nav className="gjump" aria-label="Guide sections">
        <a href="#quick-start">Quick start</a>
        <a href="#token-supply">Token supply</a>
        <a href="#vesting">Vesting</a>
        <a href="#price-impact">Price impact</a>
        <a href="#dashboard">Dashboard</a>
        <a href="#certify">Certify</a>
        <a href="#words">Words explained</a>
      </nav>

      <section className="panel gsec" id="quick-start">
        <h3 className="gh">Quick start</h3>
        <div className="gsteps">
          <div className="gstep">
            <span>1</span>
            <h4>Choose a simulator</h4>
            <p>
              <b>Token supply:</b> how many tokens will exist over time, and
              does the price hold up?
              <br />
              <b>Vesting:</b> when do the team and investors unlock tokens, and
              how much reaches the market?
              <br />
              <b>Price impact:</b> how could demand and supply changes move the
              price, using your own data?
            </p>
          </div>
          <div className="gstep">
            <span>2</span>
            <h4>Set your numbers</h4>
            <p>
              Start from a preset button to fill in sensible numbers, then
              change what you want. Change one thing at a time, so you can see
              what each number does.
            </p>
          </div>
          <div className="gstep">
            <span>3</span>
            <h4>Run and read</h4>
            <p>
              Press Run. Read the four cards at the top first, then the charts.
              Change a number and run again to compare. On a phone, results open
              on the Results tab.
            </p>
          </div>
        </div>
        <p className="gnote">
          Simlab models are simplified. Use them to compare designs against each
          other, not to predict real prices or as financial advice.
        </p>
      </section>

      <Section
        id="token-supply"
        kicker="Supply model"
        title="Token Supply Simulator"
        answers="How does the number of tokens change over the years, and how might the price react?"
        link="/token-supply"
        linkLabel="Open Token Supply"
      >
        <h4 className="gsub">Settings</h4>
        <List
          items={[
            {
              name: "Load preset scenario",
              what: "A ready-made set of numbers based on a common token design: Bitcoin-style, PoS staking protocol, or Deflationary DeFi. Press one, then adjust anything you like.",
            },
            {
              name: "Total supply",
              what: "The most tokens that can ever exist (the cap). New tokens stop being created when the cap is reached.",
            },
            {
              name: "Initial supply",
              what: "How many tokens are in circulation on day one.",
            },
            {
              name: "Years to simulate",
              what: "How far ahead to look.",
              tip: "Try 5 to 10 years",
            },
            {
              name: "Annual inflation rate",
              what: "How fast new tokens are created at the start, as a percent per year. It slowly falls toward the floor below as time passes.",
              tip: "New protocols: 3 to 10%",
            },
            {
              name: "Minimum inflation floor",
              what: "The lowest the inflation rate can fall to in the long run.",
              tip: "Often 0.5 to 2%",
            },
            {
              name: "Staking participation rate",
              what: "The share of circulating tokens that holders lock up in staking. Stakers receive most of the new tokens (75%) as rewards.",
              tip: "Mature chains: 30 to 70%",
            },
            {
              name: "Annual burn rate",
              what: "The share of tokens that are not staked and get destroyed each year. Burned tokens are gone for good.",
              tip: "Often 0.1 to 3%",
            },
            {
              name: "Enable stochastic mode",
              what: "Adds a little randomness to inflation each month and repeats the run many times. You then see an average and a range instead of one line.",
            },
            {
              name: "Number of runs",
              what: "How many times to repeat the run in stochastic mode. More runs give a smoother picture but take longer.",
              tip: "50 to 200",
            },
          ]}
        />
        <h4 className="gsub">Buttons</h4>
        <List
          items={[
            {
              name: "Run simulation",
              what: "Calculates the results with your settings.",
            },
            {
              name: "Export CSV",
              what: "Downloads the results as a spreadsheet file. It is greyed out until you have run a simulation.",
            },
            {
              name: "Parameters / Results (phones)",
              what: "Switches between the settings and the results. A green dot on Results means a run is ready.",
            },
          ]}
        />
        <h4 className="gsub">Reading the results</h4>
        <List
          items={[
            {
              name: "Final circulating",
              what: "Tokens in circulation at the end. The line under it shows the change from the start.",
            },
            {
              name: "Final burned",
              what: "Total tokens destroyed over the whole run, and what share of the total supply that is.",
            },
            {
              name: "Final staked",
              what: "Tokens locked in staking at the end, as a share of circulating supply.",
            },
            {
              name: "Final price",
              what: "An indicative price. It is demand divided by supply, on an arbitrary scale, so the number itself can look tiny. Look at the change instead (for example +25% vs. start).",
            },
            {
              name: "Supply dynamics chart",
              what: "Circulating, staked and burned tokens over time. Hover (or touch) the chart to read values.",
            },
            {
              name: "Price trajectory chart",
              what: "The price over time. In stochastic mode the line is the average and the shaded band is one standard deviation either side, showing how uncertain the path is.",
            },
          ]}
        />
        <Example>
          Load the PoS staking protocol preset and run it. Then raise the annual
          burn rate from 1% to 3% and run again. Compare Final circulating and
          the supply chart: more burning means fewer tokens left, and usually a
          stronger price line.
        </Example>
      </Section>

      <Section
        id="vesting"
        kicker="Unlock model"
        title="Vesting Schedule Simulator"
        answers="When do team, investors and others unlock their tokens, and how many actually reach the market?"
        link="/vesting"
        linkLabel="Open Vesting"
      >
        <h4 className="gsub">The roles table</h4>
        <p className="gp">
          Each row is a group of holders. On a phone each role is its own card.
        </p>
        <List
          items={[
            {
              name: "Role",
              what: "A name for the group, such as Team, Investors or Community. You can rename it.",
            },
            {
              name: "Allocation %",
              what: "The share of the total supply that group receives. All roles together must not go over 100%; the total is shown at the top of the table and Run is blocked above 100%.",
            },
            {
              name: "Cliff (months)",
              what: "A waiting period. Nothing unlocks until the cliff ends.",
              tip: "Team: 6 to 12",
            },
            {
              name: "Vesting (months)",
              what: "After the cliff, tokens unlock in equal monthly amounts over this many months.",
              tip: "Team: 24 to 48",
            },
            {
              name: "Activation",
              what: "The share of unlocked tokens that really reach the market. The rest stay in holders’ wallets.",
              tip: "100% = everything unlocked is available",
            },
            {
              name: "Governance lock",
              what: "The share of unlocked tokens kept for voting, so they are not sold.",
              tip: "0% = none held back",
            },
          ]}
        />
        <h4 className="gsub">Other settings and buttons</h4>
        <List
          items={[
            {
              name: "Standard startup / DAO governance",
              what: "Presets that fill the table with a typical set of roles.",
            },
            {
              name: "Add role  /  ×",
              what: "Adds a row (up to 10) or removes one.",
            },
            {
              name: "Total supply, Simulation months",
              what: "The size of the token and how many months to model (12 to 240).",
            },
            {
              name: "Add random noise to unlocks",
              what: "Adds small random changes to each month’s unlock, to test how sensitive the schedule is.",
            },
            {
              name: "Annual discount rate",
              what: "Used for Present value. A higher rate makes later unlocks count for less.",
              tip: "Default 10%",
            },
            {
              name: "Save profile / Load profile",
              what: "Saves the current table under a name so you can load it later. Profiles are stored in this browser only; nobody else can see them.",
            },
            {
              name: "Run simulation / Export CSV",
              what: "Calculates the schedule, and downloads it as a spreadsheet.",
            },
          ]}
        />
        <h4 className="gsub">Reading the results</h4>
        <List
          items={[
            {
              name: "Total unlocked",
              what: "All tokens that have unlocked by the end, and their share of total supply.",
            },
            {
              name: "Circulating",
              what: "Unlocked tokens that reach the market after the governance lock and activation are applied.",
            },
            {
              name: "Gov locked",
              what: "Unlocked tokens held back for governance.",
            },
            {
              name: "Present value",
              what: "The unlocks added up, with later months counted for less using the discount rate.",
            },
            {
              name: "Cumulative unlocks by role",
              what: "Stacked areas showing how much each group has unlocked over time. A cliff shows up as a flat start, then a climb.",
            },
            {
              name: "Monthly inflation rate",
              what: "New circulating tokens each month as a share of total supply. Tall bars are months when a lot of supply hits the market, often right after a cliff.",
            },
          ]}
        />
        <Example>
          Give Team 15% with a 12 month cliff and 36 months of vesting. In the
          stacked chart, Team is flat for the whole first year, then climbs. Now
          set the cliff to 24: the quiet period doubles, and the month right
          after the cliff has the tall bar in the inflation chart.
        </Example>
      </Section>

      <Section
        id="price-impact"
        kicker="Market model"
        title="Token Price Impact Model"
        answers="How could changes in demand and supply move the price, based on your own month-by-month data?"
        link="/token-impact"
        linkLabel="Open Price Impact"
      >
        <h4 className="gsub">Your data (CSV)</h4>
        <p className="gp">
          This page needs a spreadsheet saved as CSV, with one row per month and
          these columns: <b>Month</b>, <b>Unlocked Tokens</b>, <b>Emission</b>,{" "}
          <b>Transaction Volume Growth (%)</b>,{" "}
          <b>Staking Participation Growth (%)</b>, and optionally <b>Locked</b>{" "}
          and <b>Staked</b>.
        </p>
        <List
          items={[
            {
              name: "Upload CSV",
              what: "Choose your file. The page tells you how many months it loaded.",
            },
            {
              name: "Load sample CSV",
              what: "Fills in example data so you can try the page straight away.",
            },
            {
              name: "Download template",
              what: "Gives you an empty file with the right column names to fill in.",
            },
          ]}
        />
        <h4 className="gsub">Settings</h4>
        <List
          items={[
            {
              name: "Initial circulating supply",
              what: "How many tokens were already circulating before the first month in your file.",
            },
            {
              name: "Transaction base / Staking base",
              what: "The starting level of transaction and staking activity. Your growth percentages are applied on top of these month by month.",
            },
            {
              name: "Transaction weight (α)",
              what: "How much demand follows transactions versus staking. 1 means only transactions count; 0 means only staking counts.",
              tip: "0.6 is a balanced start",
            },
            {
              name: "Enable price calibration",
              what: "Without it, prices are on an arbitrary scale and only useful for comparing months. With it, you tie the model to a real price.",
            },
            {
              name: "Calibration method",
              what: "Known price: type today’s token price. Market cap: type the market cap instead. Either one sets the price in the first month.",
            },
            {
              name: "Supply elasticity (ε)",
              what: "How strongly the price reacts when the tokens available to trade change. At 1, doubling the supply halves the price when demand stays the same. Higher means a stronger reaction.",
              tip: "Start at 1, try 0.5 and 1.5",
            },
            {
              name: "Run uncertainty analysis",
              what: "Repeats the run many times with random price shocks. You get a median line and a band showing the middle 50% of outcomes (25th to 75th percentile).",
            },
            {
              name: "Number of runs",
              what: "How many repeats for the uncertainty analysis.",
              tip: "100 to 500",
            },
          ]}
        />
        <h4 className="gsub">Reading the results</h4>
        <List
          items={[
            {
              name: "Final supply",
              what: "Tokens actually available to trade at the end, after locked and staked tokens are removed.",
            },
            {
              name: "Demand index",
              what: "A single number for demand. Above 1 means demand grew compared with the start.",
            },
            {
              name: "Final price",
              what: "The estimated price in the last month. Turn on calibration to read it as a real price.",
            },
            {
              name: "Supply & demand dynamics",
              what: "Both measured against month 0, so 1.0 means “same as the start”. When the demand line rises faster than the supply line, the price tends to rise.",
            },
          ]}
        />
        <Example>
          Load the sample CSV, turn on price calibration with a known price of
          $0.50, and run. Then change the supply elasticity from 1 to 1.5 and
          run again. The price path moves more strongly whenever supply changes.
        </Example>
      </Section>

      <section className="panel gsec" id="dashboard">
        <h3 className="gh">Dashboard and saved runs</h3>
        <List
          items={[
            {
              name: "The three cards",
              what: "Your latest result for each simulator. Press a card to open that simulator. A card says “No run yet” until you have run it.",
            },
            {
              name: "Your latest run",
              what: "Shows the most recent run and the settings used. Use the menu at the top right to look at an earlier run.",
            },
            {
              name: "Re-run",
              what: "Opens the simulator with the same settings filled in, ready to change and run again. For Price Impact you load your CSV again.",
            },
            {
              name: "New run",
              what: "The button at the top left. Choose which simulator to start.",
            },
            {
              name: "Where runs are kept",
              what: "In this browser only, newest 20. Clearing your browser data or using another device starts fresh.",
            },
            {
              name: "The green dot",
              what: "Green means the calculation server is reachable. Red means it is not. If the server has been idle, the first run can take up to a minute while it wakes up.",
            },
          ]}
        />
      </section>

      <section className="panel gsec" id="certify">
        <h3 className="gh">Certify on Mantle</h3>
        <p className="gp">
          After a Token Supply run, the Certify panel at the bottom of the
          results can record a fingerprint of that run on the Mantle Sepolia
          test network.
        </p>
        <List
          items={[
            {
              name: "What gets recorded",
              what: "A fingerprint (hash) of your settings and results, together with the project name and the survival score. It proves later that these results existed and were not changed. The full numbers are not published.",
            },
            {
              name: "Survival score",
              what: "A rough 0 to 100 number the app calculates from the run’s burned and circulating supply. Treat it as a label, not a prediction.",
            },
            {
              name: "What you need",
              what: "A browser wallet such as MetaMask, set up for the Mantle Sepolia test network, with a little test currency for fees. It is a test network, so no real money is involved.",
            },
            {
              name: "Project name",
              what: "The name stored with the record. You can edit it before you press Certify.",
            },
          ]}
        />
      </section>

      <section className="panel gsec" id="words">
        <h3 className="gh">Words explained</h3>
        <List
          items={[
            {
              name: "Circulating supply",
              what: "Tokens that exist and are free to move, as opposed to tokens still locked.",
            },
            {
              name: "Staked",
              what: "Tokens locked by holders to help run the network, in return for rewards.",
            },
            {
              name: "Burned",
              what: "Tokens sent to nowhere so they can never be used again.",
            },
            {
              name: "Inflation",
              what: "New tokens being created, shown as a percent of the supply per year.",
            },
            {
              name: "Cliff and vesting",
              what: "A cliff is a waiting period with no unlocks. Vesting is the period after it when tokens unlock gradually.",
            },
            {
              name: "Activation",
              what: "The share of unlocked tokens that actually reach the market.",
            },
            {
              name: "Governance lock",
              what: "Unlocked tokens kept for voting rather than trading.",
            },
            {
              name: "Present value",
              what: "A way to count later amounts as worth less than the same amount today.",
            },
            {
              name: "Monte Carlo",
              what: "Running the same model many times with small random changes, to see a range of outcomes instead of one guess.",
            },
            {
              name: "±1 std dev",
              what: "A band one standard deviation either side of the average. Roughly two out of three outcomes fall inside it.",
            },
            {
              name: "P25 to P75",
              what: "The band holding the middle half of the outcomes. A quarter of results were lower and a quarter higher.",
            },
            {
              name: "Demand index",
              what: "A single number for how much demand there is, compared with the starting point.",
            },
            {
              name: "vs. start",
              what: "The change compared with the first month of the run.",
            },
          ]}
        />
      </section>
    </div>
  );
}
