// ─── Network ──────────────────────────────────────────────────────────────────
export const NETWORKS = {
  mainnet: {
    chainId: "0x406", // 1030
    chainName: "Conflux eSpace",
    nativeCurrency: { name: "CFX", symbol: "CFX", decimals: 18 },
    rpcUrls: ["https://evm.confluxrpc.com"],
    blockExplorerUrls: ["https://evm.confluxscan.io"],
  },
  testnet: {
    chainId: "0x47", // 71
    chainName: "Conflux eSpace Testnet",
    nativeCurrency: { name: "CFX", symbol: "CFX", decimals: 18 },
    rpcUrls: ["https://evmtestnet.confluxrpc.com"],
    blockExplorerUrls: ["https://evmtestnet.confluxscan.io"],
  },
};

// Toggle here for testnet vs mainnet
export const ACTIVE_NETWORK = NETWORKS.testnet;
export const ACTIVE_CHAIN_ID = 71; // 1030 for mainnet

// ─── Token ────────────────────────────────────────────────────────────────────
// Mainnet USDT0: 0xaf37E8B6C9ED7f6318979f56Fc287d76c30847ff
// Set your deployed MockUSDT0 address here for testnet:
export const USDT0_ADDRESS = import.meta.env.VITE_USDT0_ADDRESS || "";
export const USDT0_DECIMALS = 6;

// ─── Contract ─────────────────────────────────────────────────────────────────
export const VAULT_ADDRESS = import.meta.env.VITE_VAULT_ADDRESS || "";

export const EXPLORER_URL = ACTIVE_NETWORK.blockExplorerUrls[0];

// ─── Rate helpers ──────────────────────────────────────────────────────────────
const SECONDS_PER_WEEK = 7n * 24n * 3600n;
const USDT0_WEI        = 10n ** BigInt(USDT0_DECIMALS); // 1_000_000n

/** Convert weekly USDT0 amount (human, e.g. "100") → wei/second BigInt */
export function weeklyToRate(weeklyUsdt0) {
  const weekly = BigInt(Math.round(parseFloat(weeklyUsdt0) * 1e6));
  return weekly / SECONDS_PER_WEEK;
}

/** Convert ratePerSecond (BigInt wei) → human USDT0/day string */
export function rateToDaily(rateWei) {
  const daily = (BigInt(rateWei) * 86400n * USDT0_WEI) / (USDT0_WEI * USDT0_WEI);
  return (Number(BigInt(rateWei) * 86400n) / 1e6).toFixed(4);
}

/** Format raw USDT0 wei (BigInt or string) to human string, e.g. "12.340000" */
export function formatUsdt0(raw) {
  const n = BigInt(raw);
  const whole = n / USDT0_WEI;
  const frac  = n % USDT0_WEI;
  return `${whole}.${frac.toString().padStart(6, "0")}`;
}
