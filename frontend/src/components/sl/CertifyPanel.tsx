"use client";

import { useState } from "react";
import {
  useAttestation,
  type AttestationStatus,
  type SimulationType,
} from "@/lib/useAttestation";
import { Icon } from "./Icon";

const LABELS: Record<AttestationStatus, string> = {
  idle: "Certify on Mantle",
  hashing: "Hashing simulation…",
  awaiting_wallet: "Confirm in your wallet…",
  pending: "Recording on Mantle…",
  confirmed: "Certified on Mantle",
  error: "Try again",
};

/**
 * Records a hash of the finished simulation on the Mantle Sepolia testnet through the user's wallet.
 * The contract, hashing and wallet logic are the original ones (lib/useAttestation.ts), unchanged.
 */
export function CertifyPanel({
  simulationType,
  inputs,
  survivalScore,
}: {
  simulationType: SimulationType;
  inputs: Record<string, unknown>;
  survivalScore: number;
}) {
  const [projectName, setProjectName] = useState("My Project");
  const { certify, status, result, error, reset } = useAttestation();
  const busy =
    status === "hashing" ||
    status === "awaiting_wallet" ||
    status === "pending";
  const done = status === "confirmed";

  const onClick = () => {
    if (busy || done) return;
    if (status === "error") return reset();
    certify({
      projectName: projectName.trim() || "My Project",
      simulationType,
      inputs,
      survivalScore,
    });
  };

  return (
    <div className="panel cp cert">
      <div className="cph">
        <div>
          <h3>Certify this simulation</h3>
          <div className="sub">
            Record a tamper-proof fingerprint of these results on the Mantle
            Sepolia testnet. Needs a browser wallet such as MetaMask.
          </div>
        </div>
      </div>
      <div className="certrow">
        <div className="fld" style={{ marginTop: 0 }}>
          <label htmlFor="cert-name">Project name</label>
          <div className="inp">
            <input
              id="cert-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              disabled={busy || done}
              maxLength={60}
            />
          </div>
        </div>
        <div className="certscore">
          <span>Survival score</span>
          <b>
            {survivalScore}
            <small> / 100</small>
          </b>
        </div>
      </div>
      <button
        type="button"
        className={`btn lavb certbtn${done ? " ok" : ""}`}
        onClick={onClick}
        disabled={busy || done}
      >
        {done ? (
          <Icon n="check" style={{ width: 18, height: 18 }} />
        ) : (
          <Icon n="shield" style={{ width: 18, height: 18 }} />
        )}
        {LABELS[status]}
      </button>
      {error ? (
        <div
          className="errb"
          role="alert"
          style={{ marginTop: 14, marginBottom: 0 }}
        >
          <span>{error}</span>
        </div>
      ) : null}
      {done && result ? (
        <div className="certok">
          <div className="t">Simulation certified on Mantle</div>
          <a
            href={result.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="tx"
          >
            Tx: {result.txHash}
          </a>
          <a
            href={result.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn ghost"
          >
            View on Mantle Explorer
            <Icon n="ur" style={{ width: 14, height: 14 }} />
          </a>
        </div>
      ) : null}
    </div>
  );
}
