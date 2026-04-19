require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-chai-matchers");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x" + "0".repeat(64);

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    espaceTestnet: {
      url: "https://evmtestnet.confluxrpc.com",
      chainId: 71,
      accounts: [PRIVATE_KEY],
    },
    espaceMainnet: {
      url: "https://evm.confluxrpc.com",
      chainId: 1030,
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      espaceTestnet: "no-api-key-needed",
      espaceMainnet: "no-api-key-needed",
    },
    customChains: [
      {
        network: "espaceTestnet",
        chainId: 71,
        urls: {
          apiURL: "https://evmapi-testnet.confluxscan.io/api",
          browserURL: "https://evmtestnet.confluxscan.io",
        },
      },
      {
        network: "espaceMainnet",
        chainId: 1030,
        urls: {
          apiURL: "https://evmapi.confluxscan.io/api",
          browserURL: "https://evm.confluxscan.io",
        },
      },
    ],
  },
};
