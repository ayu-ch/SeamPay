import { useState, useCallback, useEffect } from "react";
import { BrowserProvider } from "ethers";
import { ACTIVE_CHAIN_ID, ACTIVE_NETWORK } from "../config.js";

/**
 * Pick the MetaMask provider specifically when multiple wallets are injected.
 * Falls back to window.ethereum if MetaMask isn't found in the providers list.
 */
function getEthereumProvider() {
  if (!window.ethereum) return null;
  // EIP-5749: multiple injected providers list
  if (window.ethereum.providers?.length) {
    const mm = window.ethereum.providers.find((p) => p.isMetaMask && !p.isOKXWallet);
    if (mm) return mm;
    // fallback: first provider that isn't OKX/Coinbase aggregator
    return window.ethereum.providers[0];
  }
  return window.ethereum;
}

export function useWallet() {
  const [provider,  setProvider]  = useState(null);
  const [signer,    setSigner]    = useState(null);
  const [address,   setAddress]   = useState(null);
  const [chainId,   setChainId]   = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error,     setError]     = useState(null);

  const isCorrectChain = chainId === ACTIVE_CHAIN_ID;

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      // Prefer MetaMask directly if multiple wallets are injected
      const eth = getEthereumProvider();
      if (!eth) {
        setError("No wallet found. Please install MetaMask.");
        return;
      }
      await eth.request({ method: "eth_requestAccounts" });
      const p = new BrowserProvider(eth);
      const s = await p.getSigner();
      const a = await s.getAddress();
      const net = await p.getNetwork();

      setProvider(p);
      setSigner(s);
      setAddress(a);
      setChainId(Number(net.chainId));
    } catch (e) {
      setError(e.message || "Connection failed");
    } finally {
      setConnecting(false);
    }
  }, []);

  const switchChain = useCallback(async () => {
    const eth = getEthereumProvider();
    if (!eth) return;
    try {
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ACTIVE_NETWORK.chainId }],
      });
    } catch (e) {
      if (e.code === 4902) {
        await eth.request({
          method: "wallet_addEthereumChain",
          params: [ACTIVE_NETWORK],
        });
      }
    }
  }, []);

  // Sync on account / chain changes
  useEffect(() => {
    const eth = getEthereumProvider();
    if (!eth) return;

    const onAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setAddress(null);
        setSigner(null);
      } else {
        setAddress(accounts[0]);
        connect();
      }
    };

    const onChainChanged = (hexChain) => {
      setChainId(parseInt(hexChain, 16));
      connect();
    };

    eth.on("accountsChanged", onAccountsChanged);
    eth.on("chainChanged", onChainChanged);
    return () => {
      eth.removeListener("accountsChanged", onAccountsChanged);
      eth.removeListener("chainChanged", onChainChanged);
    };
  }, [connect]);

  return { provider, signer, address, chainId, isCorrectChain, connecting, error, connect, switchChain };
}
