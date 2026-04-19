export const VAULT_ABI = [
  // Owner actions
  "function deposit(uint256 amount) external",
  "function setStream(address worker, uint256 ratePerSecond) external",
  "function stopStream(address worker) external",
  "function reclaimUnstreamed(uint256 amount) external",
  // Worker actions
  "function withdraw(uint256 amount) external",
  // Views
  "function accrued(address worker) external view returns (uint256)",
  "function vaultBalance() external view returns (uint256)",
  "function totalAccrued() external view returns (uint256)",
  "function unstreamedBalance() external view returns (uint256)",
  "function runwayDays() external view returns (uint256)",
  "function getWorkers() external view returns (address[])",
  "function streams(address) external view returns (uint256 ratePerSecond, uint256 startTime, uint256 credit, uint256 withdrawn, bool exists)",
  "function owner() external view returns (address)",
  // Events
  "event Deposited(address indexed by, uint256 amount)",
  "event StreamSet(address indexed worker, uint256 ratePerSecond)",
  "event StreamStopped(address indexed worker)",
  "event Withdrawn(address indexed worker, uint256 amount)",
  "event Reclaimed(address indexed by, uint256 amount)",
];

export const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
];
