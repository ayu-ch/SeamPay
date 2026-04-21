import { useEffect, useState, useCallback } from "react";
import { Contract } from "ethers";
import { connectWallet, switchToConflux } from "./lib/wallet.js";
import {
  VAULT_ADDRESS,
  USDT0_ADDRESS,
  CHAIN_ID,
  CHAIN_META,
  VAULT_ABI,
  ERC20_ABI,
} from "./lib/contract.js";
import EmployerTab from "./components/EmployerTab.jsx";
import WorkerTab from "./components/WorkerTab.jsx";
import Landing from "./components/Landing.jsx";

export default function App() {
  const [view, setView] = useState("landing");
  const [wallet, setWallet] = useState(null);
  const [tab, setTab] = useState("worker");
  const [err, setErr] = useState(null);

  const connect = useCallback(async () => {
    setErr(null);
    try {
      const w = await connectWallet();
      setWallet(w);
      setView("app");
    } catch (e) {
      setErr(e.message);
    }
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;
    const onAccounts = (accs) => {
      if (accs.length === 0) setWallet(null);
      else connect();
    };
    const onChain = () => connect();
    window.ethereum.on?.("accountsChanged", onAccounts);
    window.ethereum.on?.("chainChanged", onChain);
    return () => {
      window.ethereum.removeListener?.("accountsChanged", onAccounts);
      window.ethereum.removeListener?.("chainChanged", onChain);
    };
  }, [connect]);

  if (view === "landing") {
    return <Landing onLaunch={() => setView("app")} />;
  }

  const wrongNetwork = wallet && wallet.chainId !== CHAIN_ID;
  const configured = VAULT_ADDRESS && USDT0_ADDRESS;

  let vault = null;
  let token = null;
  if (wallet && !wrongNetwork && configured) {
    vault = new Contract(VAULT_ADDRESS, VAULT_ABI, wallet.signer);
    token = new Contract(USDT0_ADDRESS, ERC20_ABI, wallet.signer);
  }

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
              RemitStream
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
          {wallet ? (
            <span className="bg-ink-900 text-white rounded-full px-5 py-2.5 text-sm font-mono">
              {wallet.address.slice(0, 6)}…{wallet.address.slice(-4)}
            </span>
          ) : (
            <button
              onClick={connect}
              className="bg-ink-900 text-white rounded-full px-5 py-2.5 font-semibold text-sm hover:bg-ink-950"
            >
              Connect wallet
            </button>
          )}
        </div>
      </header>

      {err && (
        <div className="max-w-6xl mx-auto mt-4 px-6 text-sm text-red-600">
          {err}
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
              Wrong network. Expected {CHAIN_META[CHAIN_ID]?.name} (chainId{" "}
              {CHAIN_ID}).
            </span>
            <button
              onClick={switchToConflux}
              className="bg-ink-900 text-white rounded-full px-4 py-1.5 font-semibold text-sm"
            >
              Switch
            </button>
          </div>
        </Banner>
      )}

      <main className="mx-auto max-w-5xl px-6 py-10">
        {!wallet ? (
          <div className="bg-white rounded-3xl border border-ink-100 p-10 text-center">
            <h2 className="display text-3xl">Connect to continue</h2>
            <p className="mt-3 text-ink-900/60">
              RemitStream needs a wallet on Conflux eSpace to read your stream
              and sign withdrawals.
            </p>
            <button
              onClick={connect}
              className="mt-6 bg-ink-900 text-white rounded-full px-6 py-3 font-semibold"
            >
              Connect wallet
            </button>
          </div>
        ) : wrongNetwork || !configured ? (
          <div className="text-ink-900/60">Fix the banner above first.</div>
        ) : tab === "worker" ? (
          <WorkerTab wallet={wallet} vault={vault} token={token} />
        ) : (
          <EmployerTab wallet={wallet} vault={vault} token={token} />
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-xs text-ink-900/50">
        USDT0 · 6 decimals · Built on Conflux eSpace · MIT
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
    <div className={`max-w-6xl mx-auto mt-4 px-6`}>
      <div className={`rounded-2xl border px-5 py-3 text-sm ${color}`}>
        {children}
      </div>
    </div>
  );
}
