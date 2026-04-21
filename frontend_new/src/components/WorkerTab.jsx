import { useCallback, useEffect, useState } from "react";
import { fromUnits, ratePerSecondToDaily, explorerTx } from "../lib/contract.js";

export default function WorkerTab({ wallet, vault }) {
  const [accrued, setAccrued] = useState(0n);
  const [rate, setRate] = useState(0n);
  const [withdrawn, setWithdrawn] = useState(0n);
  const [pending, setPending] = useState(false);
  const [lastTx, setLastTx] = useState(null);
  const [err, setErr] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const [a, s] = await Promise.all([
        vault.accrued(wallet.address),
        vault.streams(wallet.address),
      ]);
      setAccrued(a);
      setRate(s[0]);
      setWithdrawn(s[2]);
    } catch (e) {
      setErr(e.message);
    }
  }, [vault, wallet.address]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [refresh]);

  async function doWithdraw() {
    if (accrued === 0n) return;
    setErr(null);
    setPending(true);
    setLastTx(null);
    try {
      const tx = await vault.withdraw(accrued);
      setLastTx(tx.hash);
      await tx.wait();
      await refresh();
    } catch (e) {
      setErr(e.shortMessage || e.message);
    } finally {
      setPending(false);
    }
  }

  const dailyRate = ratePerSecondToDaily(rate);
  const hasStream = rate > 0n;

  return (
    <div className="space-y-6">
      <section className="bg-forest-950 rounded-3xl p-10 text-white overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none opacity-50"
             style={{ background: 'radial-gradient(700px 300px at 70% 0%, rgba(163,230,53,0.25), transparent 60%)' }} />
        <div className="relative">
          <div className="text-sm uppercase tracking-[0.25em] text-lime-400 font-semibold">
            You've earned
          </div>
          <div className="display text-7xl md:text-8xl mt-4 ticker">
            {fromUnits(accrued).toFixed(6)}
            <span className="text-2xl text-white/50 ml-3">USDT0</span>
          </div>
          <div className="mt-4 text-xs text-white/60 font-mono">
            Polls on-chain every 5 seconds
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4">
        <Stat
          label="Stream rate"
          value={hasStream ? `${dailyRate.toFixed(4)}` : "—"}
          suffix={hasStream ? "USDT0/day" : "No stream yet"}
        />
        <Stat
          label="Total withdrawn"
          value={fromUnits(withdrawn).toFixed(2)}
          suffix="USDT0"
        />
      </div>

      <button
        disabled={pending || accrued === 0n}
        onClick={doWithdraw}
        className="w-full bg-ink-900 text-white hover:bg-ink-950 disabled:opacity-30 rounded-full py-5 font-bold text-lg transition"
      >
        {pending
          ? "Withdrawing…"
          : `Withdraw ${fromUnits(accrued).toFixed(4)} USDT0 →`}
      </button>

      {lastTx && (
        <a
          href={explorerTx(lastTx)}
          target="_blank"
          rel="noreferrer"
          className="block text-sm text-lime-600 underline break-all"
        >
          View tx on ConfluxScan →
        </a>
      )}
      {err && <div className="text-sm text-red-600">{err}</div>}

      {!hasStream && (
        <div className="bg-white border border-ink-100 rounded-2xl p-6 text-ink-900/70 text-sm">
          No stream is configured for this address yet. Ask your employer to
          call <code className="font-mono">setStream</code> with your address.
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, suffix }) {
  return (
    <div className="bg-white rounded-2xl border border-ink-100 p-5">
      <div className="text-xs uppercase tracking-wider text-ink-900/50 font-semibold">
        {label}
      </div>
      <div className="mt-2 text-3xl font-bold tracking-tight ticker">
        {value}
      </div>
      <div className="text-xs text-ink-900/50 mt-1">{suffix}</div>
    </div>
  );
}
