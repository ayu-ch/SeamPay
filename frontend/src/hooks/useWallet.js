import { useState, useCallback, useEffect } from "react";
import { BrowserProvider } from "ethers";
import { ACTIVE_CHAIN_ID, ACTIVE_NETWORK } from "../config.js";

export function useWallet() {
  const [provider,  setProvider]  = useState(null);
  const [signer,    setSigner]    = useState(null);
  const [address,   setAddress]   = useState(null);
  const [chainId,   setChainId]   = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error,     setError]     = useState(null);

  const isCorrectChain = chainId === ACTIVE_CHAIN_ID;

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError("MetaMask not found. Please install it.");
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const p = new BrowserProvider(window.ethereum);
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
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ACTIVE_NETWORK.chainId }],
      });
    } catch (e) {
      if (e.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [ACTIVE_NETWORK],
        });
      }
    }
  }, []);

  // Sync on account / chain changes
  useEffect(() => {
    if (!window.ethereum) return;

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

    window.ethereum.on("accountsChanged", onAccountsChanged);
    window.ethereum.on("chainChanged", onChainChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", onAccountsChanged);
      window.ethereum.removeListener("chainChanged", onChainChanged);
    };
  }, [connect]);

  return { provider, signer, address, chainId, isCorrectChain, connecting, error, connect, switchChain };
}
