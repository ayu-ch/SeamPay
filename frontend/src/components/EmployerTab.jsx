import React, { useState } from "react";
import { parseUnits } from "ethers";
import { formatUsdt0, weeklyToRate, rateToDaily, USDT0_DECIMALS } from "../config.js";
import TxStatus from "./TxStatus.jsx";

export default function EmployerTab({ vault }) {
  const {
    vaultBalance, totalAccrued, unstreamedBal, runwayDays,
    workers, txPending, lastTx, txError,
    deposit, setStream, stopStream, reclaimUnstreamed,
  } = vault;

  const [depositAmt,    setDepositAmt]    = useState("");
  const [workerAddr,    setWorkerAddr]    = useState("");
  const [weeklyAmt,     setWeeklyAmt]     = useState("");
  const [reclaimAmt,    setReclaimAmt]    = useState("");

  const handleDeposit = async () => {
    if (!depositAmt) return;
    await deposit(parseUnits(depositAmt, USDT0_DECIMALS));
    setDepositAmt("");
  };

  const handleSetStream = async () => {
    if (!workerAddr || !weeklyAmt) return;
    const rate = weeklyToRate(weeklyAmt);
    if (rate === 0n) return;
    await setStream(workerAddr, rate);
    setWorkerAddr(""); setWeeklyAmt("");
  };

  const handleReclaim = async () => {
    if (!reclaimAmt) return;
    await reclaimUnstreamed(parseUnits(reclaimAmt, USDT0_DECIMALS));
    setReclaimAmt("");
  };

  const runwayDisplay = runwayDays == null ? "—"
    : runwayDays > 9999n ? "∞"
    : `${runwayDays.toString()} days`;

  return (
    <div className="space-y-6">

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Vault Balance",     value: vaultBalance  == null ? "—" : `${formatUsdt0(vaultBalance)} USDT0`  },
          { label: "Total Accrued",     value: totalAccrued  == null ? "—" : `${formatUsdt0(totalAccrued)} USDT0`  },
          { label: "Unstreamed",        value: unstreamedBal == null ? "—" : `${formatUsdt0(unstreamedBal)} USDT0` },
          { label: "Runway",            value: runwayDisplay },
        ].map(({ label, value }) => (
          <div key={label} className="card text-center">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="text-lg font-bold text-white break-all">{value}</p>
          </div>
        ))}
      </div>

      {/* Deposit */}
      <div className="card space-y-3">
        <h3 className="font-semibold text-white">Deposit USDT0</h3>
        <p className="text-xs text-gray-500">
          Approval is handled automatically on first deposit.
        </p>
        <div className="flex gap-2">
          <input className="input" type="number" min="0" step="0.000001"
            placeholder="Amount (e.g. 1000)"
            value={depositAmt} onChange={e => setDepositAmt(e.target.value)} />
          <button className="btn-primary whitespace-nowrap"
            onClick={handleDeposit} disabled={txPending || !depositAmt}>
            Deposit
          </button>
        </div>
      </div>

      {/* Set stream */}
      <div className="card space-y-3">
        <h3 className="font-semibold text-white">Set Worker Stream</h3>
        <p className="text-xs text-gray-500">
          Enter a weekly salary — the contract stores the per-second rate.
        </p>
        <div className="space-y-2">
          <div>
            <label className="label">Worker address</label>
            <input className="input font-mono text-sm" type="text"
              placeholder="0x…"
              value={workerAddr} onChange={e => setWorkerAddr(e.target.value)} />
          </div>
          <div>
            <label className="label">Weekly salary (USDT0)</label>
            <input className="input" type="number" min="0" step="0.01"
              placeholder="e.g. 100"
              value={weeklyAmt} onChange={e => setWeeklyAmt(e.target.value)} />
            {weeklyAmt && parseFloat(weeklyAmt) > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                ≈ {rateToDaily(weeklyToRate(weeklyAmt))} USDT0/day
              </p>
            )}
          </div>
          <button className="btn-primary w-full"
            onClick={handleSetStream} disabled={txPending || !workerAddr || !weeklyAmt}>
            Set Stream
          </button>
        </div>
      </div>

      {/* Active workers */}
      {workers && workers.length > 0 && (
        <div className="card space-y-3">
          <h3 className="font-semibold text-white">Active Workers</h3>
          <div className="space-y-2">
            {workers.map(w => (
              <div key={w} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
                <span className="font-mono text-sm text-gray-300 truncate max-w-[200px]">{w}</span>
                <button className="btn-secondary text-xs ml-2"
                  onClick={() => stopStream(w)} disabled={txPending}>
                  Stop
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reclaim */}
      <div className="card space-y-3">
        <h3 className="font-semibold text-white">Reclaim Unstreamed Balance</h3>
        <p className="text-xs text-gray-500">
          Only USDT0 not yet accrued by any worker can be reclaimed.
          Available: {unstreamedBal == null ? "—" : `${formatUsdt0(unstreamedBal)} USDT0`}
        </p>
        <div className="flex gap-2">
          <input className="input" type="number" min="0" step="0.000001"
            placeholder="Amount"
            value={reclaimAmt} onChange={e => setReclaimAmt(e.target.value)} />
          <button className="btn-secondary whitespace-nowrap"
            onClick={handleReclaim} disabled={txPending || !reclaimAmt}>
            Reclaim
          </button>
        </div>
      </div>

      <TxStatus txPending={txPending} lastTx={lastTx} txError={txError} />
    </div>
  );
}
