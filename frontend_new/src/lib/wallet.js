import { BrowserProvider } from "ethers";
import { CHAIN_ID, CHAIN_META } from "./contract.js";

export async function connectWallet() {
  if (!window.ethereum) throw new Error("MetaMask not found");
  const provider = new BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const net = await provider.getNetwork();
  return { provider, signer, address, chainId: Number(net.chainId) };
}

export async function switchToConflux() {
  const meta = CHAIN_META[CHAIN_ID];
  if (!meta) throw new Error(`Unknown CHAIN_ID ${CHAIN_ID}`);
  const hex = "0x" + CHAIN_ID.toString(16);
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: hex }],
    });
  } catch (err) {
    if (err.code === 4902) {
      await window.ethereum.request({
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
