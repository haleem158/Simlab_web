"use client";

import { useAttestation, SimulationType } from "@/lib/useAttestation";

interface CertifyButtonProps {
  projectName: string;
  simulationType: SimulationType;
  inputs: Record<string, unknown>;
  survivalScore: number;
}

const STATUS_LABELS: Record<string, string> = {
  idle: "🔗 Certify on Mantle",
  hashing: "⏳ Hashing simulation...",
  awaiting_wallet: "🦊 Confirm in wallet...",
  pending: "⏳ Recording on Mantle...",
  confirmed: "✓ Certified on Mantle",
  error: "↺ Try again",
};

export function CertifyButton({
  projectName,
  simulationType,
  inputs,
  survivalScore,
}: CertifyButtonProps) {
  const { certify, status, result, error, reset } = useAttestation();

  const isLoading = ["hashing", "awaiting_wallet", "pending"].includes(status);
  const isConfirmed = status === "confirmed";

  function handleClick() {
    if (isLoading || isConfirmed) return;
    if (status === "error") { reset(); return; }
    certify({ projectName, simulationType, inputs, survivalScore });
  }

  return (
    <div className="flex flex-col gap-3 mt-6">

      <button
        onClick={handleClick}
        disabled={isLoading || isConfirmed}
        className={`
          px-6 py-3 rounded-lg border font-mono text-sm tracking-wide transition-all
          ${isConfirmed
            ? "bg-green-500 text-black border-green-500 cursor-default"
            : "bg-transparent text-green-400 border-green-400 hover:bg-green-400 hover:text-black cursor-pointer"
          }
          ${isLoading ? "opacity-60 cursor-not-allowed" : ""}
        `}
      >
        {STATUS_LABELS[status]}
      </button>

      {error && (
        <p className="text-red-400 text-xs font-mono">✗ {error}</p>
      )}

      {isConfirmed && result && (
        <div className="bg-green-950 border border-green-800 rounded-lg p-4 flex flex-col gap-2">
          <p className="text-green-400 text-xs font-mono tracking-widest uppercase">
            Simulation Certified on Mantle
          </p>
          <a
            href={result.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 text-xs font-mono break-all hover:text-green-400 transition-colors"
          >
            Tx: {result.txHash}
          </a>
          <a
            href={result.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-center text-green-400 text-xs font-mono border border-green-800 rounded px-3 py-2 hover:bg-green-900 transition-colors"
          >
            View on Mantle Explorer →
          </a>
        </div>
      )}

    </div>
  );
}