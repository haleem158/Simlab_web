"use client";

import { useState } from "react";
import { ethers } from "ethers";

declare global {
  interface Window {
    // MetaMask and other browser wallets
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ethereum?: any;
  }
}

const CONTRACT_ADDRESS = "0x8Bd60BD871b68F160694e6CeDf5014d6CBB85185";

const ABI = [
  "function certify(bytes32 simulationHash, string projectName, string simulationType, uint8 survivalScore) external",
  "function verify(bytes32 simulationHash) external view returns (bool)",
];

const MANTLE_TESTNET = {
  chainId: "0x138B",
  chainName: "Mantle Sepolia Testnet",
  rpcUrls: ["https://rpc.sepolia.mantle.xyz"],
  nativeCurrency: { name: "MNT", symbol: "MNT", decimals: 18 },
  blockExplorerUrls: ["https://explorer.sepolia.mantle.xyz"],
};

export type SimulationType = "token-supply" | "vesting" | "token-impact";

export interface AttestationPayload {
  projectName: string;
  simulationType: SimulationType;
  inputs: Record<string, unknown>;
  survivalScore: number;
}

export interface AttestationResult {
  txHash: string;
  explorerUrl: string;
}

export type AttestationStatus =
  "idle" | "hashing" | "awaiting_wallet" | "pending" | "confirmed" | "error";

export function useAttestation() {
  const [status, setStatus] = useState<AttestationStatus>("idle");
  const [result, setResult] = useState<AttestationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function certify(payload: AttestationPayload) {
    setError(null);
    setResult(null);

    try {
      // Check wallet
      if (!window.ethereum) {
        throw new Error("No wallet found. Please install MetaMask.");
      }

      // Switch to Mantle Testnet
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: MANTLE_TESTNET.chainId }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [MANTLE_TESTNET],
          });
        } else {
          throw switchError;
        }
      }

      // Hash the simulation payload
      setStatus("hashing");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const canonical = JSON.stringify({
        projectName: payload.projectName,
        simulationType: payload.simulationType,
        survivalScore: payload.survivalScore,
        inputs: payload.inputs,
        timestamp: new Date().toISOString(),
      });

      const simulationHash = ethers.keccak256(ethers.toUtf8Bytes(canonical));

      // Submit to contract
      setStatus("awaiting_wallet");
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

      const tx = await contract.certify(
        simulationHash,
        payload.projectName,
        payload.simulationType,
        payload.survivalScore,
      );

      // Wait for confirmation
      setStatus("pending");
      const receipt = await tx.wait();

      setStatus("confirmed");
      setResult({
        txHash: receipt.hash,
        explorerUrl: `https://explorer.sepolia.mantle.xyz/tx/${receipt.hash}`,
      });
    } catch (err: any) {
      setStatus("error");
      if (err.code === 4001) {
        setError("Wallet signature rejected. Try again.");
      } else {
        setError(err.message || "Certification failed.");
      }
    }
  }

  function reset() {
    setStatus("idle");
    setResult(null);
    setError(null);
  }

  return { certify, status, result, error, reset };
}
