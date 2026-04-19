require("dotenv").config();
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const network = hre.network.name;
  console.log("Network:", network);

  let usdt0Address = process.env.USDT0_ADDRESS;

  // On testnet, deploy a MockUSDT0 if no address is provided
  if (!usdt0Address || usdt0Address === "") {
    if (network === "espaceTestnet" || network === "hardhat" || network === "localhost") {
      console.log("No USDT0_ADDRESS set — deploying MockUSDT0...");
      const Mock = await hre.ethers.getContractFactory("MockUSDT0");
      const mock = await Mock.deploy();
      await mock.waitForDeployment();
      usdt0Address = await mock.getAddress();
      console.log("MockUSDT0 deployed to:", usdt0Address);

      // Mint 10,000 USDT0 to deployer for demo
      const mintTx = await mock.mint(deployer.address, 10_000n * 1_000_000n);
      await mintTx.wait();
      console.log("Minted 10,000 mUSDT0 to deployer");
    } else {
      throw new Error("USDT0_ADDRESS must be set for mainnet deployment");
    }
  }

  console.log("Using USDT0 at:", usdt0Address);

  const Vault = await hre.ethers.getContractFactory("StreamVault");
  const vault = await Vault.deploy(usdt0Address);
  await vault.waitForDeployment();

  const vaultAddress = await vault.getAddress();
  console.log("StreamVault deployed to:", vaultAddress);

  console.log("\n--- Post-deploy setup ---");
  console.log("1. Approve the vault to spend your USDT0:");
  console.log(`   token.approve("${vaultAddress}", amount)`);
  console.log("2. Deposit USDT0 into the vault:");
  console.log(`   vault.deposit(amount)`);
  console.log("3. Set a worker stream:");
  console.log(`   vault.setStream(workerAddress, ratePerSecond)`);
  console.log("\nRate reference:");
  console.log("  100 USDT0/week = 165 wei/s");
  console.log("  1 USDT0/second = 1_000_000 wei/s  (good for demo)");

  console.log("\n--- Verify command ---");
  console.log(
    `npx hardhat verify --network ${network} ${vaultAddress} "${usdt0Address}"`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
