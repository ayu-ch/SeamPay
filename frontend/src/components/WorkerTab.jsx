import React, { useState } from "react";
import { formatUsdt0, rateToDaily } from "../config.js";
import TxStatus from "./TxStatus.jsx";

export default function WorkerTab({ vault }) {
  const {
    workerAccrued, workerStream,
    txPending, lastTx, txError,
    withdraw,
  } = vault;

  const [withdrawAmt, setWithdrawAmt] = useState("");

  const hasStream  = workerStream?.exists;
  const isActive   = hasStream && workerStream?.ratePerSecond > 0n;
  const accruedNum = workerAccrued != null ? workerAccrued : 0n;

  const handleWithdrawAll = () => withdraw(accruedNum);

  const handleWithdrawCustom = () => {
    if (!withdrawAmt) return;
    const amt = BigInt(Math.round(parseFloat(withdrawAmt) * 1e6));
    withdraw(amt);
    setWithdrawAmt("");
  };

  return (
    <div className="space-y-6">

      {/* Accrued balance — hero card */}
      <div className="card text-center py-8 border-brand-500/30">
        <p className="text-gray-400 text-sm mb-2">Your accrued balance</p>
        <p className="text-4xl font-bold text-brand-400">
          {workerAccrued == null ? "—" : formatUsdt0(workerAccrued)}
        </p>
        <p className="text-gray-500 text-sm mt-1">USDT0</p>

        {isActive && (
          <p className="text-green-400 text-xs mt-3">
            ● Streaming at {rateToDaily(workerStream.ratePerSecond)} USDT0/day
          </p>
        )}
        {hasStream && !isActive && (
          <p className="text-yellow-400 text-xs mt-3">Stream paused</p>
        )}
        {!hasStream && (
          <p className="text-gray-500 text-xs mt-3">No stream configured for your address</p>
        )}
      </div>

      {/* Withdraw controls */}
      {hasStream && (
        <div className="card space-y-4">
          <h3 className="font-semibold text-white">Withdraw</h3>

          <button
            className="btn-primary w-full text-base py-3"
            onClick={handleWithdrawAll}
            disabled={txPending || accruedNum === 0n}>
            Withdraw All ({workerAccrued != null ? formatUsdt0(workerAccrued) : "0"} USDT0)
          </button>

          <div className="flex gap-2">
            <input className="input" type="number" min="0" step="0.000001"
              placeholder="Custom amount (USDT0)"
              value={withdrawAmt}
              onChange={e => setWithdrawAmt(e.target.value)} />
            <button className="btn-secondary whitespace-nowrap"
              onClick={handleWithdrawCustom}
              disabled={txPending || !withdrawAmt}>
              Withdraw
            </button>
          </div>

          <p className="text-xs text-gray-500">
            Funds are sent directly to your connected wallet on Conflux eSpace.
          </p>
        </div>
      )}

      {/* Stream info */}
      {hasStream && (
        <div className="card space-y-2">
          <h3 className="font-semibold text-white text-sm">Stream details</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-gray-500 text-xs">Rate</p>
              <p className="text-white">
                {isActive
                  ? `${rateToDaily(workerStream.ratePerSecond)} USDT0/day`
                  : "Stopped"}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Total withdrawn</p>
              <p className="text-white">{formatUsdt0(workerStream.withdrawn)} USDT0</p>
            </div>
          </div>
        </div>
      )}

      <TxStatus txPending={txPending} lastTx={lastTx} txError={txError} />
    </div>
  );
}
