import { ethers } from "ethers";

export const VAULT_ADDRESS = import.meta.env.VITE_VAULT_ADDRESS;
export const USDT0_ADDRESS = import.meta.env.VITE_USDT0_ADDRESS;
export const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || 71);

export const CHAIN_META = {
  1030: {
    name: "Conflux eSpace",
    rpcUrl: "https://evm.confluxrpc.com",
    explorer: "https://evm.confluxscan.io",
    currency: { name: "CFX", symbol: "CFX", decimals: 18 },
  },
  71: {
    name: "Conflux eSpace Testnet",
    rpcUrl: "https://evmtestnet.confluxrpc.com",
    explorer: "https://evmtestnet.confluxscan.io",
    currency: { name: "CFX", symbol: "CFX", decimals: 18 },
  },
};

export const USDT0_DECIMALS = 6;

export const VAULT_ABI = [
  "function owner() view returns (address)",
  "function token() view returns (address)",
  "function vaultBalance() view returns (uint256)",
  "function totalAccrued() view returns (uint256)",
  "function unstreamedBalance() view returns (uint256)",
  "function runwayDays() view returns (uint256)",
  "function getWorkers() view returns (address[])",
  "function streams(address) view returns (uint256 ratePerSecond, uint256 startTime, uint256 credit, uint256 withdrawn, bool exists)",
  "function accrued(address worker) view returns (uint256)",
  "function deposit(uint256 amount)",
  "function setStream(address worker, uint256 ratePerSecond)",
  "function stopStream(address worker)",
  "function reclaimUnstreamed(uint256 amount)",
  "function withdraw(uint256 amount)",
  "event Deposited(address indexed by, uint256 amount)",
  "event StreamSet(address indexed worker, uint256 ratePerSecond)",
  "event StreamStopped(address indexed worker)",
  "event Withdrawn(address indexed worker, uint256 amount)",
  "event Reclaimed(address indexed by, uint256 amount)",
];

export const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

export function toUnits(amount) {
  return ethers.parseUnits(String(amount), USDT0_DECIMALS);
}

export function fromUnits(raw) {
  return Number(ethers.formatUnits(raw, USDT0_DECIMALS));
}

export function weeklyToRatePerSecond(weeklyUsdt0) {
  const weeklyWei = ethers.parseUnits(String(weeklyUsdt0), USDT0_DECIMALS);
  return weeklyWei / BigInt(7 * 86400);
}

export function ratePerSecondToDaily(ratePerSecond) {
  const perDay = BigInt(ratePerSecond) * 86400n;
  return fromUnits(perDay);
}

export function explorerTx(hash) {
  const meta = CHAIN_META[CHAIN_ID] ?? CHAIN_META[71];
  return `${meta.explorer}/tx/${hash}`;
}
