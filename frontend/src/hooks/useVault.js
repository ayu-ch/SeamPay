import { useState, useEffect, useCallback } from "react";
import { Contract, MaxUint256 } from "ethers";
import { VAULT_ADDRESS, USDT0_ADDRESS, EXPLORER_URL } from "../config.js";
import { VAULT_ABI, ERC20_ABI } from "../abi.js";

export function useVault(signer, address) {
  const [vaultBalance,   setVaultBalance]   = useState(null);
  const [totalAccrued,   setTotalAccrued]   = useState(null);
  const [unstreamedBal,  setUnstreamedBal]  = useState(null);
  const [runwayDays,     setRunwayDays]     = useState(null);
  const [workerAccrued,  setWorkerAccrued]  = useState(null);
  const [workerStream,   setWorkerStream]   = useState(null);
  const [workers,        setWorkers]        = useState([]);
  const [ownerAddress,   setOwnerAddress]   = useState(null);
  const [loading,        setLoading]        = useState(false);
  const [txPending,      setTxPending]      = useState(false);
  const [lastTx,         setLastTx]         = useState(null);
  const [txError,        setTxError]        = useState(null);

  const vault = signer ? new Contract(VAULT_ADDRESS, VAULT_ABI, signer) : null;
  const token = signer ? new Contract(USDT0_ADDRESS, ERC20_ABI, signer) : null;

  const refresh = useCallback(async () => {
    if (!vault || !address) return;
    setLoading(true);
    try {
      const [bal, tot, uns, run, wAcc, wStream, wList, owner] = await Promise.all([
        vault.vaultBalance(),
        vault.totalAccrued(),
        vault.unstreamedBalance(),
        vault.runwayDays(),
        vault.accrued(address),
        vault.streams(address),
        vault.getWorkers(),
        vault.owner(),
      ]);
      setVaultBalance(bal);
      setTotalAccrued(tot);
      setUnstreamedBal(uns);
      setRunwayDays(run);
      setWorkerAccrued(wAcc);
      setWorkerStream(wStream);
      setWorkers(wList);
      setOwnerAddress(owner);
    } catch (e) {
      console.error("refresh error", e);
    } finally {
      setLoading(false);
    }
  }, [vault, address]);

  // Poll every 10 seconds
  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 10_000);
    return () => clearInterval(id);
  }, [refresh]);

  const sendTx = useCallback(async (fn) => {
    setTxError(null);
    setLastTx(null);
    setTxPending(true);
    try {
      const tx = await fn();
      setLastTx({ hash: tx.hash, url: `${EXPLORER_URL}/tx/${tx.hash}` });
      await tx.wait();
      await refresh();
    } catch (e) {
      setTxError(e.reason || e.message || "Transaction failed");
    } finally {
      setTxPending(false);
    }
  }, [refresh]);

  // ── Employer actions ────────────────────────────────────────────────────────

  const deposit = useCallback(async (amount) => {
    await sendTx(async () => {
      const allowance = await token.allowance(address, VAULT_ADDRESS);
      if (allowance < amount) {
        const approveTx = await token.approve(VAULT_ADDRESS, MaxUint256);
        await approveTx.wait();
      }
      return vault.deposit(amount);
    });
  }, [sendTx, vault, token, address]);

  const setStream = useCallback((worker, rate) =>
    sendTx(() => vault.setStream(worker, rate)), [sendTx, vault]);

  const stopStream = useCallback((worker) =>
    sendTx(() => vault.stopStream(worker)), [sendTx, vault]);

  const reclaimUnstreamed = useCallback((amount) =>
    sendTx(() => vault.reclaimUnstreamed(amount)), [sendTx, vault]);

  // ── Worker actions ──────────────────────────────────────────────────────────

  const withdraw = useCallback((amount) =>
    sendTx(() => vault.withdraw(amount)), [sendTx, vault]);

  return {
    vaultBalance, totalAccrued, unstreamedBal, runwayDays,
    workerAccrued, workerStream, workers, ownerAddress,
    loading, txPending, lastTx, txError,
    refresh, deposit, setStream, stopStream, reclaimUnstreamed, withdraw,
  };
}
