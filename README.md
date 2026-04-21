# SeamPay

**Real-time USDT0 payroll streaming on Conflux eSpace.**

---

## The problem

Cross-border payroll is broken. A remote worker in Southeast Asia or Latin America working for a company in the US or Europe faces a painful reality every month:

- **3 to 5 day delays** between when work is done and when pay arrives
- **3 to 5% cut** taken by banks, payment processors, and SWIFT intermediaries
- **No visibility** into when money will actually land in their account
- **Currency conversion losses** on top of transfer fees
- **Minimum transfer thresholds** that make small or frequent payments impractical

Traditional payroll systems were designed for a world of local employees, monthly pay cycles, and centralized banks. They are fundamentally incompatible with the global, remote, async nature of modern work.

For workers living paycheck to paycheck, a 5-day delay is not an inconvenience. It is a financial emergency.

---

## The solution

SeamPay replaces the payroll batch cycle with a continuous stream.

An employer deposits USDT0 into a non-custodial vault contract on Conflux eSpace. They set a per-second salary rate for each worker. From that moment, the worker's balance starts accruing every second, on-chain, transparently. The worker can withdraw what they have earned at any time, with no intermediary, no approval required, and no minimum amount.

There is no payday. There is no cutoff date. The work happens every second, and so does the pay.

**For employers:** fund once, stream indefinitely. Full visibility into runway, burn rate, and every active worker stream on one screen.

**For workers:** your earned balance is always yours. Pull it on day 1, day 7, or let it accumulate. The contract enforces it, not a promise.

---

## How it works

| Step | Who | What happens |
|------|-----|--------------|
| 1 | Employer | Deposits USDT0 into the `StreamVault` contract |
| 2 | Employer | Calls `setStream(worker, ratePerSecond)` to start streaming |
| 3 | Worker | Accrues USDT0 every second, withdraws anytime via the UI |
| 4 | Employer | Can stop a stream or reclaim unstreamed balance at any time |

Rate reference (6-decimal USDT0):

```
100 USDT0/week  =>  ~165 wei/second
1 USDT0/second  =>  1,000,000 wei/second
```

---

## Why Conflux eSpace and USDT0

**Conflux eSpace** gives us EVM compatibility with 3-second finality and transaction fees that are fractions of a cent. This matters enormously for payroll streaming. A worker withdrawing $2 of earned wages should not pay $1.50 in gas. On Conflux, the economics actually work at any salary level.

**USDT0** is the most credible US dollar asset on Conflux. It is backed 1:1 by USDT held on Ethereum and bridged to Conflux via LayerZero's Omnichain Fungible Token standard. Workers receive a stable, recognizable dollar asset that they can hold or convert, not a volatile token or an IOU.

Together, these two choices make SeamPay practical for real cross-border payroll, not just as a proof of concept.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Smart contract | Solidity 0.8.24 · OpenZeppelin |
| Network | Conflux eSpace (testnet chainId 71 / mainnet 1030) |
| Token | USDT0 (LayerZero OFT, 6 decimals) |
| Frontend | React 18 · Vite · Tailwind CSS · Framer Motion |
| Wallet | MetaMask (ethers.js v6) |

---

## Project structure

```
seampay/
├── contracts/
│   ├── StreamVault.sol     # Core payroll streaming contract
│   └── MockUSDT0.sol       # ERC-20 mock for local/testnet use
├── scripts/                # Hardhat deploy scripts
├── test/                   # Contract unit tests
├── frontend/               # React app (SeamPay UI)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── Landing.jsx
│   │   │   ├── EmployerTab.jsx
│   │   │   └── WorkerTab.jsx
│   │   ├── hooks/
│   │   │   ├── useWallet.js
│   │   │   └── useVault.js
│   │   ├── abi.js
│   │   └── config.js
│   └── .env.example
└── hardhat.config.js
```

---

## Getting started

### 1. Install dependencies

```bash
# Contract deps
cd seampay
yarn install

# Frontend deps
cd frontend
yarn install
```

### 2. Configure environment

```bash
# Root -- for deploying contracts
cp .env.example .env
# Fill in PRIVATE_KEY

# Frontend -- after deploying
cp frontend/.env.example frontend/.env
# Fill in VITE_VAULT_ADDRESS and VITE_USDT0_ADDRESS
```

### 3. Deploy contracts

```bash
cd seampay

# Testnet
npx hardhat run scripts/deploy.js --network confluxTestnet

# Mainnet
npx hardhat run scripts/deploy.js --network confluxMainnet
```

Copy the deployed `StreamVault` address into `frontend/.env`.

### 4. Run the frontend

```bash
cd frontend
yarn dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Deploying to Vercel

1. Push the repo to GitHub.
2. Go to [vercel.com](https://vercel.com) and create a new project from your repo.
3. Set the **Root Directory** to `seampay/frontend`.
4. Add environment variables in the Vercel dashboard:
   - `VITE_VAULT_ADDRESS`
   - `VITE_USDT0_ADDRESS`
5. Click **Deploy**.

Or via CLI:

```bash
cd seampay/frontend
npx vercel --prod \
  -e VITE_VAULT_ADDRESS=0x... \
  -e VITE_USDT0_ADDRESS=0x...
```

---

## Smart contract reference

### `StreamVault`

| Function | Access | Description |
|----------|--------|-------------|
| `deposit(uint256 amount)` | Owner | Deposit USDT0 into the vault (approve first) |
| `setStream(address worker, uint256 ratePerSecond)` | Owner | Start or update a worker's stream |
| `stopStream(address worker)` | Owner | Stop a stream (earnings remain withdrawable) |
| `reclaimUnstreamed(uint256 amount)` | Owner | Withdraw unallocated vault balance |
| `withdraw(uint256 amount)` | Worker | Withdraw accrued USDT0 |
| `accrued(address worker)` | View | Current withdrawable balance for a worker |
| `vaultBalance()` | View | Total USDT0 in the vault |
| `runwayDays()` | View | Days of runway at current burn rate |
| `getWorkers()` | View | All registered worker addresses |

### Accounting model

```
accrued = credit + (ratePerSecond x elapsed) - withdrawn
```

`credit` snapshots a worker's earnings whenever their stream is updated or stopped. This ensures workers never lose accrued funds when an employer changes a rate or pauses a stream.

---

## Networks

| Network | Chain ID | RPC | Explorer |
|---------|----------|-----|----------|
| Conflux eSpace Testnet | 71 | `https://evmtestnet.confluxrpc.com` | [evmtestnet.confluxscan.io](https://evmtestnet.confluxscan.io) |
| Conflux eSpace Mainnet | 1030 | `https://evm.confluxrpc.com` | [evm.confluxscan.io](https://evm.confluxscan.io) |

Testnet faucet: [efaucet.confluxnetwork.org](https://efaucet.confluxnetwork.org/)

---

## Deployed contracts (Conflux eSpace Testnet)

| Contract | Address |
|----------|---------|
| StreamVault | [`0x43Bf701B987f0FaC72F0a88a7d30fDa12E449636`](https://evmtestnet.confluxscan.io/address/0x43Bf701B987f0FaC72F0a88a7d30fDa12E449636) |
| MockUSDT0 | [`0x478F70645367DbEc0B8Dc6e88921B9c602cFf351`](https://evmtestnet.confluxscan.io/address/0x478F70645367DbEc0B8Dc6e88921B9c602cFf351) |
