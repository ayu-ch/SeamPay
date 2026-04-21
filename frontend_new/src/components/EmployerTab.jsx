import { useCallback, useEffect, useState } from "react";
import {
  USDT0_ADDRESS,
  VAULT_ADDRESS,
  fromUnits,
  toUnits,
  weeklyToRatePerSecond,
  ratePerSecondToDaily,
  explorerTx,
} from "../lib/contract.js";

export default function EmployerTab({ wallet, vault, token }) {
  const [vaultBal, setVaultBal] = useState(0n);
  const [ownerAddr, setOwnerAddr] = useState("");
  const [depAmount, setDepAmount] = useState("100");
  const [workerAddr, setWorkerAddr] = useState("");
  const [weekly, setWeekly] = useState("100");
  const [workers, setWorkers] = useState([]);
  const [pending, setPending] = useState(false);
  const [lastTx, setLastTx] = useState(null);
  const [err, setErr] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const [bal, own] = await Promise.all([vault.vaultBalance(), vault.owner()]);
      setVaultBal(bal);
      setOwnerAddr(own);
      const next = [];
      for (const w of workers) {
        const s = await vault.streams(w.address);
        next.push({
          address: w.address,
          rate: s[0],
          startTime: s[1],
          withdrawn: s[2],
        });
      }
      setWorkers(next);
    } catch (e) {
      setErr(e.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vault]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 10000);
    return () => clearInterval(id);
  }, [refresh]);

  const isOwner =
    ownerAddr && wallet?.address?.toLowerCase() === ownerAddr.toLowerCase();

  const totalRate = workers.reduce((acc, w) => acc + BigInt(w.rate || 0n), 0n);
  const dailyBurn = (Number(totalRate) * 86400) / 1e6;
  const runwayDays =
    totalRate > 0n ? Number(vaultBal) / Number(totalRate * 86400n) : Infinity;

  async function guard(fn) {
    setErr(null);
    setPending(true);
    setLastTx(null);
    try {
      const tx = await fn();
      setLastTx(tx.hash);
      await tx.wait();
      await refresh();
    } catch (e) {
      setErr(e.shortMessage || e.message);
    } finally {
      setPending(false);
    }
  }

  async function doDeposit() {
    const amount = toUnits(depAmount);
    const allowance = await token.allowance(wallet.address, VAULT_ADDRESS);
    if (allowance < amount) {
      await guard(() => token.approve(VAULT_ADDRESS, amount));
    }
    await guard(() => vault.deposit(amount));
  }

  async function doSetStream() {
    if (!workerAddr) return setErr("Enter worker address");
    const rate = weeklyToRatePerSecond(weekly);
    if (rate === 0n) return setErr("Rate would be zero — weekly too small");
    await guard(() => vault.setStream(workerAddr, rate));
    if (
      !workers.find(
        (w) => w.address.toLowerCase() === workerAddr.toLowerCase()
      )
    ) {
      setWorkers([
        ...workers,
        { address: workerAddr, rate, startTime: 0n, withdrawn: 0n },
      ]);
    }
  }

  return (
    <div className="space-y-6">
      {!isOwner && ownerAddr && (
        <div className="bg-white border border-ink-100 rounded-2xl px-5 py-3 text-sm text-ink-900/70">
          Connected wallet is not the vault owner. View-only. Owner:{" "}
          <span className="font-mono">{ownerAddr}</span>
        </div>
      )}

      <section className="grid grid-cols-3 gap-4">
        <BigStat
          label="Vault balance"
          value={fromUnits(vaultBal).toFixed(2)}
          suffix="USDT0"
          tone="dark"
        />
        <BigStat
          label="Daily burn"
          value={dailyBurn.toFixed(2)}
          suffix="USDT0/day"
        />
        <BigStat
          label="Runway"
          value={
            totalRate === 0n
              ? "—"
              : Number.isFinite(runwayDays)
              ? runwayDays.toFixed(1)
              : "∞"
          }
          suffix={totalRate === 0n ? "no streams" : "days"}
        />
      </section>

      <section className="bg-white rounded-3xl border border-ink-100 p-6">
        <h2 className="font-bold text-lg tracking-tight">Deposit USDT0</h2>
        <p className="text-sm text-ink-900/60 mt-1">
          Funds go to the vault; workers' streams draw from this balance.
        </p>
        <div className="flex gap-2 mt-4">
          <input
            value={depAmount}
            onChange={(e) => setDepAmount(e.target.value)}
            className="bg-ink-50 border border-ink-100 px-4 py-3 rounded-full flex-1 outline-none focus:border-lime-400"
            placeholder="Amount"
          />
          <button
            disabled={pending || !isOwner}
            onClick={doDeposit}
            className="bg-ink-900 text-white disabled:opacity-30 rounded-full px-6 py-3 font-semibold"
          >
            {pending ? "…" : "Approve + Deposit"}
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
            value={weekly}
            onChange={(e) => setWeekly(e.target.value)}
            className="bg-ink-50 border border-ink-100 px-4 py-3 rounded-full flex-1 outline-none focus:border-lime-400"
            placeholder="Weekly USDT0"
          />
          <button
            disabled={pending || !isOwner}
            onClick={doSetStream}
            className="bg-ink-900 text-white disabled:opacity-30 rounded-full px-6 py-3 font-semibold"
          >
            {pending ? "…" : "Set stream"}
          </button>
        </div>
        <p className="text-xs text-ink-900/50">
          Setting or changing a stream resets accrual for that worker.
        </p>
      </section>

      {workers.length > 0 && (
        <section className="bg-white rounded-3xl border border-ink-100 p-6">
          <h2 className="font-bold text-lg tracking-tight mb-4">Streams</h2>
          <table className="w-full text-sm">
            <thead className="text-ink-900/50">
              <tr className="text-left">
                <th className="font-medium pb-2">Worker</th>
                <th className="text-right font-medium pb-2">Rate</th>
                <th className="text-right font-medium pb-2">Withdrawn</th>
              </tr>
            </thead>
            <tbody>
              {workers.map((w) => (
                <tr key={w.address} className="border-t border-ink-100">
                  <td className="py-3 font-mono text-xs">
                    {w.address.slice(0, 10)}…{w.address.slice(-6)}
                  </td>
                  <td className="py-3 text-right">
                    {ratePerSecondToDaily(w.rate).toFixed(4)} /day
                  </td>
                  <td className="py-3 text-right">
                    {fromUnits(w.withdrawn).toFixed(2)} USDT0
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

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
      <div className="mt-2 display text-4xl ticker">{value}</div>
      <div className={"text-xs mt-1 " + (dark ? "text-white/60" : "text-ink-900/50")}>
        {suffix}
      </div>
    </div>
  );
}
