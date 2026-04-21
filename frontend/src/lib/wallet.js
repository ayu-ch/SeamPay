import { BrowserProvider } from "ethers";
import { CHAIN_ID, CHAIN_META } from "./contract.js";

/**
 * Pick the MetaMask provider when multiple wallets are injected (EIP-5749).
 * Falls back to window.ethereum if no providers list.
 */
function getEthereumProvider() {
  if (!window.ethereum) return null;
  if (window.ethereum.providers?.length) {
    const mm = window.ethereum.providers.find((p) => p.isMetaMask && !p.isOKXWallet);
    if (mm) return mm;
    return window.ethereum.providers[0];
  }
  return window.ethereum;
}

export function getEth() {
  return getEthereumProvider();
}

export async function connectWallet() {
  const eth = getEthereumProvider();
  if (!eth) throw new Error("No wallet found. Install MetaMask.");
  const provider = new BrowserProvider(eth);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const net = await provider.getNetwork();
  return { provider, signer, address, chainId: Number(net.chainId) };
}

export async function switchToConflux() {
  const eth = getEthereumProvider();
  if (!eth) return;
  const meta = CHAIN_META[CHAIN_ID];
  if (!meta) throw new Error(`Unknown CHAIN_ID ${CHAIN_ID}`);
  const hex = "0x" + CHAIN_ID.toString(16);
  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: hex }],
    });
  } catch (err) {
    if (err.code === 4902) {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: hex,
            chainName: meta.name,
            rpcUrls: [meta.rpcUrl],
            nativeCurrency: meta.currency,
            blockExplorerUrls: [meta.explorer],
          },
        ],
      });
    } else {
      throw err;
    }
  }
}
