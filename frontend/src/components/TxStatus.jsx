import React from "react";

export default function TxStatus({ txPending, lastTx, txError }) {
  if (!txPending && !lastTx && !txError) return null;

  return (
    <div className="mt-4">
      {txPending && (
        <div className="flex items-center gap-2 text-sm text-yellow-400 bg-yellow-900/20 border border-yellow-800 rounded-lg px-4 py-3">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          Transaction pending…
        </div>
      )}
      {lastTx && !txPending && (
        <div className="text-sm text-green-400 bg-green-900/20 border border-green-800 rounded-lg px-4 py-3">
          ✓ Transaction confirmed —{" "}
          <a href={lastTx.url} target="_blank" rel="noreferrer"
             className="underline hover:text-green-300">
            View on ConfluxScan
          </a>
        </div>
      )}
      {txError && (
        <div className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-4 py-3">
          ✗ {txError}
        </div>
      )}
    </div>
  );
}
