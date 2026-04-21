import { useEffect, useRef, useState } from "react";
import { useWallet } from "./hooks/useWallet.js";
import { useVault } from "./hooks/useVault.js";
import EmployerTab from "./components/EmployerTab.jsx";
import WorkerTab from "./components/WorkerTab.jsx";
import Landing from "./components/Landing.jsx";
import { VAULT_ADDRESS, USDT0_ADDRESS, ACTIVE_NETWORK, ACTIVE_CHAIN_ID } from "./config.js";

export default function App() {
  const [view, setView] = useState("landing");
  const [tab, setTab] = useState("worker");
  const wallet = useWallet();
  const vault = useVault(wallet.signer, wallet.address);

  // Auto-select the Employer tab if the connected wallet is the vault owner.
  // Only runs once per (address, owner) pair so the user can still switch.
  const autoPickedRef = useRef(null);
  useEffect(() => {
    const addr = wallet.address?.toLowerCase();
    const owner = vault.ownerAddress?.toLowerCase();
    if (!addr || !owner) return;
    const key = `${addr}:${owner}`;
    if (autoPickedRef.current === key) return;
    autoPickedRef.current = key;
    setTab(addr === owner ? "employer" : "worker");
  }, [wallet.address, vault.ownerAddress]);

  if (view === "landing") {
    return <Landing onLaunch={() => setView("app")} />;
  }

  const wrongNetwork = wallet.address && !wallet.isCorrectChain;
  const configured = VAULT_ADDRESS && USDT0_ADDRESS;

  return (
    <div className="min-h-full bg-ink-50 text-ink-900">
      <header className="sticky top-4 z-30 px-4">
        <div className="mx-auto max-w-6xl bg-white rounded-full shadow-[0_6px_24px_rgba(10,15,12,0.08)] border border-ink-100 flex items-center justify-between pl-6 pr-2 py-2">
          <button
            onClick={() => setView("landing")}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-ink-900 grid place-items-center">
              <div className="w-2.5 h-2.5 rounded-full bg-lime-400 pulse-dot" />
            </div>
            <span className="font-extrabold tracking-tight text-lg">
              SeamPay
            </span>
          </button>
          <div className="hidden md:flex items-center gap-2 bg-ink-50 rounded-full p-1">
            <TabButton active={tab === "worker"} onClick={() => setTab("worker")}>
              Worker
            </TabButton>
            <TabButton
              active={tab === "employer"}
              onClick={() => setTab("employer")}
            >
              Employer
            </TabButton>
          </div>
          {wallet.address ? (
            <span className="bg-ink-900 text-white rounded-full px-5 py-2.5 text-sm font-mono">
              {wallet.address.slice(0, 6)}…{wallet.address.slice(-4)}
            </span>
          ) : (
            <button
              onClick={wallet.connect}
              disabled={wallet.connecting}
              className="bg-ink-900 text-white rounded-full px-5 py-2.5 font-semibold text-sm hover:bg-ink-950 disabled:opacity-50"
            >
              {wallet.connecting ? "Connecting…" : "Connect wallet"}
            </button>
          )}
        </div>
      </header>

      {wallet.error && (
        <div className="max-w-6xl mx-auto mt-4 px-6 text-sm text-red-600">
          {wallet.error}
        </div>
      )}

      {!configured && (
        <Banner tone="amber">
          Set <code className="font-mono">VITE_VAULT_ADDRESS</code> and{" "}
          <code className="font-mono">VITE_USDT0_ADDRESS</code> in{" "}
          <code className="font-mono">frontend/.env</code> after deploying.
        </Banner>
      )}

      {wrongNetwork && (
        <Banner tone="amber">
          <div className="flex items-center justify-between gap-4">
            <span>
              Wrong network. Expected {ACTIVE_NETWORK.chainName} (chainId{" "}
              {ACTIVE_CHAIN_ID}).
            </span>
            <button
              onClick={wallet.switchChain}
              className="bg-ink-900 text-white rounded-full px-4 py-1.5 font-semibold text-sm"
            >
              Switch
            </button>
          </div>
        </Banner>
      )}

      <main className="mx-auto max-w-5xl px-6 py-10">
        {!wallet.address ? (
          <div className="bg-white rounded-3xl border border-ink-100 p-10 text-center">
            <h2 className="display text-3xl">Connect to continue</h2>
            <p className="mt-3 text-ink-900/60">
              SeamPay needs a wallet on Conflux eSpace to read your stream
              and sign withdrawals.
            </p>
            <button
              onClick={wallet.connect}
              disabled={wallet.connecting}
              className="mt-6 bg-ink-900 text-white rounded-full px-6 py-3 font-semibold disabled:opacity-50"
            >
              {wallet.connecting ? "Connecting…" : "Connect wallet"}
            </button>
          </div>
        ) : wrongNetwork || !configured ? (
          <div className="text-ink-900/60">Fix the banner above first.</div>
        ) : tab === "worker" ? (
          <WorkerTab vault={vault} wallet={wallet} />
        ) : (
          <EmployerTab vault={vault} wallet={wallet} />
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-xs text-ink-900/50">
        USDT0 · Built on Conflux eSpace
      </footer>
    </div>
  );
}

function TabButton({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={
        "px-4 py-1.5 rounded-full font-semibold text-sm transition " +
        (active
          ? "bg-ink-900 text-white"
          : "text-ink-900/70 hover:text-ink-900")
      }
    >
      {children}
    </button>
  );
}

function Banner({ tone = "amber", children }) {
  const color =
    tone === "amber"
      ? "bg-lime-50 text-forest-900 border-lime-200"
      : "bg-red-50 text-red-900 border-red-200";
  return (
    <div className="max-w-6xl mx-auto mt-4 px-6">
      <div className={`rounded-2xl border px-5 py-3 text-sm ${color}`}>
        {children}
      </div>
    </div>
  );
}
