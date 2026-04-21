import { useState } from "react";
import { formatUsdt0, rateToDaily, EXPLORER_URL } from "../config.js";

export default function WorkerTab({ vault }) {
  const {
    workerAccrued,
    workerStream,
    txPending,
    lastTx,
    txError,
    withdraw,
  } = vault;

  const [withdrawAmt, setWithdrawAmt] = useState("");

  const hasStream = workerStream?.exists;
  const rate = workerStream?.ratePerSecond ?? 0n;
  const isActive = hasStream && rate > 0n;
  const accrued = workerAccrued ?? 0n;
  const withdrawn = workerStream?.withdrawn ?? 0n;

  const handleWithdrawAll = () => {
    if (accrued === 0n) return;
    withdraw(accrued);
  };

  const handleWithdrawCustom = () => {
    if (!withdrawAmt) return;
    const amt = BigInt(Math.round(parseFloat(withdrawAmt) * 1e6));
    withdraw(amt);
    setWithdrawAmt("");
  };

  return (
    <div className="space-y-6">
      <section className="bg-forest-950 rounded-3xl p-10 text-white overflow-hidden relative">
        <div
          className="absolute inset-0 pointer-events-none opacity-50"
          style={{
            background:
              "radial-gradient(700px 300px at 70% 0%, rgba(163,230,53,0.25), transparent 60%)",
          }}
        />
        <div className="relative">
          <div className="text-sm uppercase tracking-[0.25em] text-lime-400 font-semibold">
            You've earned
          </div>
          <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <span className="display text-6xl md:text-8xl ticker break-all">
              {workerAccrued == null ? "—" : formatUsdt0(workerAccrued)}
            </span>
            <span className="text-2xl font-semibold tracking-normal text-white/60">
              USDT0
            </span>
          </div>
          <div className="mt-4 text-xs text-white/60 font-mono">
            {isActive
              ? "Polls on-chain every 10 seconds"
              : hasStream
              ? "Stream paused"
              : "No stream configured for your address"}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4">
        <Stat
          label="Stream rate"
          value={isActive ? rateToDaily(rate) : "—"}
          suffix={isActive ? "USDT0/day" : hasStream ? "Stream paused" : "No stream yet"}
        />
        <Stat
          label="Total withdrawn"
          value={formatUsdt0(withdrawn)}
          suffix="USDT0"
        />
      </div>

      {hasStream && (
        <>
          <button
            disabled={txPending || accrued === 0n}
            onClick={handleWithdrawAll}
            className="w-full bg-ink-900 text-white hover:bg-ink-950 disabled:opacity-30 rounded-full py-5 font-bold text-lg transition"
          >
            {txPending
              ? "Withdrawing…"
              : `Withdraw ${formatUsdt0(accrued)} USDT0 →`}
          </button>

          <section className="bg-white rounded-3xl border border-ink-100 p-6 space-y-3">
            <h3 className="font-bold text-lg tracking-tight">
              Withdraw a custom amount
            </h3>
            <div className="flex gap-2">
              <input
                value={withdrawAmt}
                onChange={(e) => setWithdrawAmt(e.target.value)}
                className="bg-ink-50 border border-ink-100 px-4 py-3 rounded-full flex-1 outline-none focus:border-lime-400"
                placeholder="Amount (USDT0)"
                type="number"
                min="0"
                step="0.000001"
              />
              <button
                onClick={handleWithdrawCustom}
                disabled={txPending || !withdrawAmt}
                className="bg-ink-900 text-white disabled:opacity-30 rounded-full px-6 py-3 font-semibold"
              >
                Withdraw
              </button>
            </div>
            <p className="text-xs text-ink-900/50">
              Funds are sent directly to your connected wallet on Conflux
              eSpace.
            </p>
          </section>
        </>
      )}

      {lastTx && !txPending && (
        <a
          href={lastTx.url || `${EXPLORER_URL}/tx/${lastTx.hash}`}
          target="_blank"
          rel="noreferrer"
          className="block text-sm text-lime-600 underline break-all"
        >
          View tx on ConfluxScan →
        </a>
      )}
      {txError && <div className="text-sm text-red-600">{txError}</div>}

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
      <div className="mt-2 text-3xl font-bold tracking-tight ticker break-all">
        {value}
      </div>
      <div className="text-xs text-ink-900/50 mt-1">{suffix}</div>
    </div>
  );
}
