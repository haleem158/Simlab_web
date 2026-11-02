"use client";

import { useState } from "react";
import type { Reading, ReadingTone } from "@/lib/types";

const TONE_LABEL: Record<ReadingTone, string> = {
  good: "Holds up",
  watch: "Watch",
  risk: "At risk",
  info: "Reading",
};

/** Plain-language reading of a finished run, built by the API from rules (no AI wording). */
export function ReadingPanel({ reading }: { reading?: Reading | null }) {
  const [copied, setCopied] = useState(false);
  if (!reading) return null;

  const defaults = reading.inputs.filter((i) => i.status === "default");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(reading, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard can be refused; nothing else to do */
    }
  };

  return (
    <div className="panel cp reading">
      <div className="cph">
        <div>
          <h3>Reading</h3>
          <div className="sub">
            What this run says, from the numbers above. Rules-based, same
            result every time.
          </div>
        </div>
        <button type="button" className="btn ghost rdcopy" onClick={copy}>
          {copied ? "Copied" : "Copy as JSON"}
        </button>
      </div>

      <div className={`rdhead ${reading.tone}`}>
        <span className="rdtag">{TONE_LABEL[reading.tone]}</span>
        <p>{reading.headline}</p>
      </div>

      <div className="rdgrid">
        {reading.sections
          .filter((sec) => sec.items.length > 0 && sec.key !== "inputs")
          .map((sec) => (
            <div key={sec.key} className="rdsec">
              <h4>{sec.title}</h4>
              <ul>
                {sec.items.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          ))}
      </div>

      {reading.inputs.length > 0 ? (
        <div className="rdsec rdinputs">
          <h4>
            Inputs{" "}
            {defaults.length > 0 ? (
              <small>
                {defaults.length} of {reading.inputs.length} still at page
                defaults
              </small>
            ) : null}
          </h4>
          <div className="rdchips">
            {reading.inputs.map((i) => (
              <span key={i.name} className={`rdchip ${i.status}`}>
                {i.name}: {i.value}
                {i.status === "default" ? " (default)" : ""}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {reading.next_test ? (
        <div className="rdnext">
          <b>Next test</b> {reading.next_test}
        </div>
      ) : null}

      {reading.caveats.length > 0 ? (
        <ul className="rdcav">
          {reading.caveats.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
