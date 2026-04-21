import { useState } from "react";
import { parseUnits } from "ethers";
import {
  formatUsdt0,
  weeklyToRate,
  rateToDaily,
  USDT0_DECIMALS,
  VAULT_ADDRESS,
  USDT0_ADDRESS,
  EXPLORER_URL,
} from "../config.js";

export default function EmployerTab({ vault, wallet }) {
  const {
    vaultBalance,
    totalAccrued,
    unstreamedBal,
    runwayDays,
    workers,
    ownerAddress,
    txPending,
    lastTx,
    txError,
    deposit,
    setStream,
    stopStream,
    reclaimUnstreamed,
  } = vault;

  const [depositAmt, setDepositAmt] = useState("100");
  const [workerAddr, setWorkerAddr] = useState("");
  const [weeklyAmt, setWeeklyAmt] = useState("100");
  const [reclaimAmt, setReclaimAmt] = useState("");

  const isOwner =
    wallet?.address &&
    ownerAddress &&
    wallet.address.toLowerCase() === ownerAddress.toLowerCase();

  const handleDeposit = async () => {
    if (!depositAmt) return;
    await deposit(parseUnits(depositAmt, USDT0_DECIMALS));
  };

  const handleSetStream = async () => {
    if (!workerAddr || !weeklyAmt) return;
    const rate = weeklyToRate(weeklyAmt);
    if (rate === 0n) return;
    await setStream(workerAddr, rate);
  };

  const handleReclaim = async () => {
    if (!reclaimAmt) return;
    await reclaimUnstreamed(parseUnits(reclaimAmt, USDT0_DECIMALS));
    setReclaimAmt("");
  };

  const dailyBurnDisplay = (() => {
    if (vaultBalance == null || runwayDays == null) return "—";
    if (runwayDays > 9999n) return "0.00";
    // daily burn = vaultBalance / runwayDays (wei) → format to USDT0
    if (runwayDays === 0n) return "—";
    const daily = BigInt(vaultBalance) / runwayDays;
    return formatUsdt0(daily);
  })();

  const runwayDisplay =
    runwayDays == null
      ? "—"
      : runwayDays > 9999n
      ? "∞"
      : runwayDays.toString();

  return (
    <div className="space-y-6">
      {!isOwner && ownerAddress && (
        <div className="bg-white border border-ink-100 rounded-2xl px-5 py-3 text-sm text-ink-900/70">
          Connected wallet is not the vault owner. View-only. Owner:{" "}
          <span className="font-mono">{ownerAddress}</span>
        </div>
      )}

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <BigStat
          label="Vault balance"
          value={vaultBalance == null ? "—" : formatUsdt0(vaultBalance)}
          suffix="USDT0"
          tone="dark"
        />
        <BigStat
          label="Total accrued"
          value={totalAccrued == null ? "—" : formatUsdt0(totalAccrued)}
          suffix="USDT0"
        />
        <BigStat
          label="Daily burn"
          value={dailyBurnDisplay}
          suffix="USDT0/day"
        />
        <BigStat
          label="Runway"
          value={runwayDisplay}
          suffix={runwayDisplay === "∞" ? "no streams" : "days"}
        />
      </section>

      <section className="bg-white rounded-3xl border border-ink-100 p-6">
        <h2 className="font-bold text-lg tracking-tight">Deposit USDT0</h2>
        <p className="text-sm text-ink-900/60 mt-1">
          Funds go to the vault; workers' streams draw from this balance.
          Approval is handled automatically on first deposit.
        </p>
        <div className="flex gap-2 mt-4">
          <input
            value={depositAmt}
            onChange={(e) => setDepositAmt(e.target.value)}
            className="bg-ink-50 border border-ink-100 px-4 py-3 rounded-full flex-1 outline-none focus:border-lime-400"
            placeholder="Amount"
            type="number"
            min="0"
            step="0.000001"
          />
          <button
            disabled={txPending || !isOwner || !depositAmt}
            onClick={handleDeposit}
            className="bg-ink-900 text-white disabled:opacity-30 rounded-full px-6 py-3 font-semibold"
          >
            {txPending ? "…" : "Approve + Deposit"}
          </button>
        </div>
      </section>

      <section className="bg-white rounded-3xl border border-ink-100 p-6 space-y-3">
        <h2 className="font-bold text-lg tracking-tight">Set stream</h2>
        <input
          value={workerAddr}
          onChange={(e) => setWorkerAddr(e.target.value)}
          className="bg-ink-50 border border-ink-100 px-4 py-3 rounded-full w-full font-mono text-sm outline-none focus:border-lime-400"
          placeholder="Worker address (0x…)"
        />
        <div className="flex gap-2">
          <input
            value={weeklyAmt}
            onChange={(e) => setWeeklyAmt(e.target.value)}
            className="bg-ink-50 border border-ink-100 px-4 py-3 rounded-full flex-1 outline-none focus:border-lime-400"
            placeholder="Weekly USDT0"
            type="number"
            min="0"
            step="0.01"
          />
          <button
            disabled={txPending || !isOwner || !workerAddr || !weeklyAmt}
            onClick={handleSetStream}
            className="bg-ink-900 text-white disabled:opacity-30 rounded-full px-6 py-3 font-semibold"
          >
            {txPending ? "…" : "Set stream"}
          </button>
        </div>
        {weeklyAmt && parseFloat(weeklyAmt) > 0 && (
          <p className="text-xs text-ink-900/60">
            ≈ {rateToDaily(weeklyToRate(weeklyAmt))} USDT0/day
          </p>
        )}
        <p className="text-xs text-ink-900/50">
          Setting or changing a stream snapshots existing earnings and resets
          the rate from now.
        </p>
      </section>

      {workers && workers.length > 0 && (
        <section className="bg-white rounded-3xl border border-ink-100 p-6">
          <h2 className="font-bold text-lg tracking-tight mb-4">
            Active workers
          </h2>
          <div className="space-y-2">
            {workers.map((w) => (
              <div
                key={w}
                className="flex items-center justify-between bg-ink-50 rounded-2xl px-4 py-3 border border-ink-100"
              >
                <span className="font-mono text-xs text-ink-900/80 truncate">
                  {w}
                </span>
                <button
                  onClick={() => stopStream(w)}
                  disabled={txPending || !isOwner}
                  className="bg-ink-900 text-white disabled:opacity-30 rounded-full px-4 py-1.5 font-semibold text-xs ml-2"
                >
                  Stop
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="bg-white rounded-3xl border border-ink-100 p-6 space-y-3">
        <h2 className="font-bold text-lg tracking-tight">
          Reclaim unstreamed balance
        </h2>
        <p className="text-sm text-ink-900/60">
          Only USDT0 not yet accrued by any worker can be reclaimed. Available:{" "}
          {unstreamedBal == null ? "—" : `${formatUsdt0(unstreamedBal)} USDT0`}
        </p>
        <div className="flex gap-2">
          <input
            value={reclaimAmt}
            onChange={(e) => setReclaimAmt(e.target.value)}
            className="bg-ink-50 border border-ink-100 px-4 py-3 rounded-full flex-1 outline-none focus:border-lime-400"
            placeholder="Amount"
            type="number"
            min="0"
            step="0.000001"
          />
          <button
            disabled={txPending || !isOwner || !reclaimAmt}
            onClick={handleReclaim}
            className="bg-ink-900 text-white disabled:opacity-30 rounded-full px-6 py-3 font-semibold"
          >
            Reclaim
          </button>
        </div>
      </section>

      {txPending && (
        <div className="text-sm text-ink-900/60">Transaction pending…</div>
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
      <p className="text-xs text-ink-900/40 font-mono break-all">
        Vault: {VAULT_ADDRESS} · Token: {USDT0_ADDRESS}
      </p>
    </div>
  );
}

function BigStat({ label, value, suffix, tone }) {
  const dark = tone === "dark";
  return (
    <div
      className={
        "rounded-3xl p-6 " +
        (dark
          ? "bg-forest-950 text-white border border-forest-900"
          : "bg-white border border-ink-100")
      }
    >
      <div
        className={
          "text-xs uppercase tracking-wider font-semibold " +
          (dark ? "text-lime-400" : "text-ink-900/50")
        }
      >
        {label}
      </div>
      <div className="mt-2 display text-3xl md:text-4xl ticker break-all">
        {value}
      </div>
      <div
        className={
          "text-xs mt-1 " + (dark ? "text-white/60" : "text-ink-900/50")
        }
      >
        {suffix}
      </div>
    </div>
  );
}
