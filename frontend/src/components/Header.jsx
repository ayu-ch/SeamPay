import React from "react";
import { ACTIVE_NETWORK } from "../config.js";

export default function Header({ address, chainId, isCorrectChain, connecting, onConnect, onSwitch }) {
  const short = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : null;

  return (
    <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-brand-500 text-xl font-bold">RemitStream</span>
          <span className="text-gray-500 text-sm hidden sm:block">
            USDT0 payroll on Conflux
          </span>
        </div>

        <div className="flex items-center gap-3">
          {address && (
            <span className={`text-xs px-2 py-1 rounded-full font-mono ${
              isCorrectChain ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"
            }`}>
              {isCorrectChain ? ACTIVE_NETWORK.chainName : `Wrong network (${chainId})`}
            </span>
          )}

          {!address ? (
            <button className="btn-primary text-sm" onClick={onConnect} disabled={connecting}>
              {connecting ? "Connecting…" : "Connect Wallet"}
            </button>
          ) : !isCorrectChain ? (
            <button className="btn-primary text-sm" onClick={onSwitch}>
              Switch to {ACTIVE_NETWORK.chainName}
            </button>
          ) : (
            <span className="text-sm font-mono text-gray-300 bg-gray-800 px-3 py-1.5 rounded-lg">
              {short}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
