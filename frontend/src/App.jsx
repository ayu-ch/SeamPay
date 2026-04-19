import React, { useState } from "react";
import { useWallet } from "./hooks/useWallet.js";
import { useVault }  from "./hooks/useVault.js";
import Header       from "./components/Header.jsx";
import EmployerTab  from "./components/EmployerTab.jsx";
import WorkerTab    from "./components/WorkerTab.jsx";
import { VAULT_ADDRESS, USDT0_ADDRESS } from "./config.js";

const TABS = ["Employer", "Worker"];

export default function App() {
  const wallet = useWallet();
  const vault  = useVault(wallet.signer, wallet.address);
  const [tab, setTab] = useState("Worker");

  const isOwner = wallet.address && vault.ownerAddress &&
    wallet.address.toLowerCase() === vault.ownerAddress.toLowerCase();

  const missingConfig = !VAULT_ADDRESS || !USDT0_ADDRESS;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Header
        address={wallet.address}
        chainId={wallet.chainId}
        isCorrectChain={wallet.isCorrectChain}
        connecting={wallet.connecting}
        onConnect={wallet.connect}
        onSwitch={wallet.switchChain}
      />

      <main className="max-w-2xl mx-auto px-4 py-8">

        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Payroll that streams in real time
          </h1>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Employers fund a vault with USDT0. Workers accrue earnings every second
            and withdraw anytime — no bank wires, no wait.
          </p>
        </div>

        {/* Setup warning */}
        {missingConfig && (
          <div className="card border-yellow-800 bg-yellow-900/10 text-yellow-300 text-sm mb-6">
            <p className="font-semibold mb-1">⚠ Contract not configured</p>
            <p>
              Set <code className="bg-gray-800 px-1 rounded">VITE_VAULT_ADDRESS</code> and{" "}
              <code className="bg-gray-800 px-1 rounded">VITE_USDT0_ADDRESS</code> in{" "}
              <code className="bg-gray-800 px-1 rounded">frontend/.env</code> then restart the dev server.
            </p>
          </div>
        )}

        {/* Connect prompt */}
        {!wallet.address && (
          <div className="card text-center py-10 mb-6">
            <p className="text-gray-400 mb-4">Connect your wallet to get started</p>
            <button className="btn-primary" onClick={wallet.connect} disabled={wallet.connecting}>
              {wallet.connecting ? "Connecting…" : "Connect Wallet"}
            </button>
            {wallet.error && (
              <p className="text-red-400 text-sm mt-3">{wallet.error}</p>
            )}
          </div>
        )}

        {/* Wrong network */}
        {wallet.address && !wallet.isCorrectChain && (
          <div className="card text-center py-8 mb-6 border-red-800">
            <p className="text-red-400 mb-4">Please switch to Conflux eSpace to continue</p>
            <button className="btn-primary" onClick={wallet.switchChain}>
              Switch Network
            </button>
          </div>
        )}

        {/* Main UI */}
        {wallet.address && wallet.isCorrectChain && (
          <>
            {/* Tab bar */}
            <div className="flex bg-gray-900 rounded-xl p-1 mb-6 gap-1">
              {TABS.map(t => (
                <button key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                    tab === t
                      ? "bg-brand-500 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}>
                  {t}
                  {t === "Employer" && isOwner && (
                    <span className="ml-1 text-xs bg-brand-700 text-brand-200 px-1.5 py-0.5 rounded-full">
                      you
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {tab === "Employer" && <EmployerTab vault={vault} />}
            {tab === "Worker"   && <WorkerTab   vault={vault} />}
          </>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center text-xs text-gray-600 space-y-1">
          <p>
            Built on{" "}
            <a href="https://doc.confluxnetwork.org/" target="_blank" rel="noreferrer"
               className="hover:text-gray-400 underline">Conflux eSpace</a>
            {" "}·{" "}
            <a href="https://evm.confluxscan.io" target="_blank" rel="noreferrer"
               className="hover:text-gray-400 underline">ConfluxScan</a>
            {" "}·{" "}
            <a href="https://github.com" target="_blank" rel="noreferrer"
               className="hover:text-gray-400 underline">GitHub</a>
          </p>
          <p>RemitStream — Global Hackfest 2026 · MIT License</p>
        </footer>
      </main>
    </div>
  );
}
