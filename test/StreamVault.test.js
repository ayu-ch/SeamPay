const { expect } = require("chai");
const { ethers } = require("hardhat");

// Helper: mine a block with a specific timestamp offset
async function increaseTime(seconds) {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine", []);
}

describe("StreamVault", function () {
  let owner, worker1, worker2, other;
  let token, vault;

  const ONE_USDT0    = 1_000_000n;          // 1 USDT0 (6 decimals)
  const RATE_PER_SEC = ONE_USDT0;           // 1 USDT0/second — fast for tests
  const DEPOSIT      = 1_000n * ONE_USDT0;  // 1000 USDT0

  beforeEach(async () => {
    [owner, worker1, worker2, other] = await ethers.getSigners();

    const Mock = await ethers.getContractFactory("MockUSDT0");
    token = await Mock.deploy();
    await token.waitForDeployment();

    const Vault = await ethers.getContractFactory("StreamVault");
    vault = await Vault.deploy(await token.getAddress());
    await vault.waitForDeployment();

    await token.mint(owner.address, DEPOSIT * 10n);
    await token.connect(owner).approve(await vault.getAddress(), ethers.MaxUint256);
  });

  // ── Deployment ─────────────────────────────────────────────────────────────

  it("sets owner and token correctly", async () => {
    expect(await vault.owner()).to.equal(owner.address);
    expect(await vault.token()).to.equal(await token.getAddress());
  });

  // ── Deposit ────────────────────────────────────────────────────────────────

  it("allows owner to deposit and emits Deposited", async () => {
    await expect(vault.deposit(DEPOSIT))
      .to.emit(vault, "Deposited")
      .withArgs(owner.address, DEPOSIT);
    expect(await vault.vaultBalance()).to.equal(DEPOSIT);
  });

  it("reverts deposit of zero", async () => {
    await expect(vault.deposit(0n)).to.be.revertedWith("zero amount");
  });

  it("reverts deposit from non-owner", async () => {
    await expect(vault.connect(worker1).deposit(DEPOSIT))
      .to.be.revertedWith("not owner");
  });

  // ── SetStream ──────────────────────────────────────────────────────────────

  it("creates a stream and emits StreamSet", async () => {
    await vault.deposit(DEPOSIT);
    await expect(vault.setStream(worker1.address, RATE_PER_SEC))
      .to.emit(vault, "StreamSet")
      .withArgs(worker1.address, RATE_PER_SEC);

    const s = await vault.streams(worker1.address);
    expect(s.ratePerSecond).to.equal(RATE_PER_SEC);
    expect(s.exists).to.be.true;
  });

  it("registers workers in the list", async () => {
    await vault.deposit(DEPOSIT);
    await vault.setStream(worker1.address, RATE_PER_SEC);
    await vault.setStream(worker2.address, RATE_PER_SEC);
    const workers = await vault.getWorkers();
    expect(workers).to.include(worker1.address);
    expect(workers).to.include(worker2.address);
  });

  it("reverts setStream from non-owner", async () => {
    await expect(
      vault.connect(worker1).setStream(worker1.address, RATE_PER_SEC)
    ).to.be.revertedWith("not owner");
  });

  it("reverts setStream with zero rate", async () => {
    await expect(vault.setStream(worker1.address, 0n))
      .to.be.revertedWith("zero rate");
  });

  // ── Accrual ────────────────────────────────────────────────────────────────

  it("accrues correctly after elapsed time", async () => {
    await vault.deposit(DEPOSIT);
    await vault.setStream(worker1.address, RATE_PER_SEC);
    await increaseTime(10);

    const acc = await vault.accrued(worker1.address);
    expect(acc).to.be.gte(9n * RATE_PER_SEC);
    expect(acc).to.be.lte(12n * RATE_PER_SEC);
  });

  it("caps accrued at vault balance", async () => {
    const small = 5n * ONE_USDT0;
    await vault.deposit(small);
    await vault.setStream(worker1.address, RATE_PER_SEC);
    await increaseTime(100); // would earn 100 USDT0 but vault only has 5

    const acc = await vault.accrued(worker1.address);
    expect(acc).to.equal(small);
  });

  it("returns zero for unknown worker", async () => {
    expect(await vault.accrued(other.address)).to.equal(0n);
  });

  // ── Withdraw ───────────────────────────────────────────────────────────────

  it("worker withdraws accrued balance", async () => {
    await vault.deposit(DEPOSIT);
    await vault.setStream(worker1.address, RATE_PER_SEC);
    await increaseTime(10);

    const acc = await vault.accrued(worker1.address);
    await expect(vault.connect(worker1).withdraw(acc))
      .to.emit(vault, "Withdrawn")
      .withArgs(worker1.address, acc);

    expect(await token.balanceOf(worker1.address)).to.equal(acc);
  });

  it("reverts withdraw exceeding accrued", async () => {
    await vault.deposit(DEPOSIT);
    await vault.setStream(worker1.address, RATE_PER_SEC);
    await increaseTime(1);

    await expect(vault.connect(worker1).withdraw(DEPOSIT))
      .to.be.revertedWith("not enough accrued");
  });

  it("reverts withdraw from non-worker", async () => {
    await expect(vault.connect(other).withdraw(ONE_USDT0))
      .to.be.revertedWith("no stream");
  });

  it("worker cannot double-withdraw same accrual", async () => {
    await vault.deposit(DEPOSIT);
    await vault.setStream(worker1.address, RATE_PER_SEC);
    await increaseTime(5);

    const acc = await vault.accrued(worker1.address);
    await vault.connect(worker1).withdraw(acc);

    // immediately try again — no new time has passed
    await expect(vault.connect(worker1).withdraw(acc))
      .to.be.revertedWith("not enough accrued");
  });

  // ── Stop stream ────────────────────────────────────────────────────────────

  it("stops a stream and preserves accrued balance", async () => {
    await vault.deposit(DEPOSIT);
    await vault.setStream(worker1.address, RATE_PER_SEC);
    await increaseTime(10);

    const accBefore = await vault.accrued(worker1.address);
    await vault.stopStream(worker1.address);

    // Should still be able to withdraw the earned amount
    const accAfter = await vault.accrued(worker1.address);
    // accAfter should be close to accBefore (±1 block)
    expect(accAfter).to.be.gte(accBefore - ONE_USDT0);
    expect(accAfter).to.be.lte(accBefore + ONE_USDT0);
  });

  it("reverts stopping an already-stopped stream", async () => {
    await vault.deposit(DEPOSIT);
    await vault.setStream(worker1.address, RATE_PER_SEC);
    await vault.stopStream(worker1.address);
    await expect(vault.stopStream(worker1.address))
      .to.be.revertedWith("already stopped");
  });

  it("worker can still withdraw after stream is stopped", async () => {
    await vault.deposit(DEPOSIT);
    await vault.setStream(worker1.address, RATE_PER_SEC);
    await increaseTime(10);
    await vault.stopStream(worker1.address);

    const acc = await vault.accrued(worker1.address);
    expect(acc).to.be.gt(0n);
    await vault.connect(worker1).withdraw(acc);
    expect(await token.balanceOf(worker1.address)).to.equal(acc);
  });

  // ── Rate update ────────────────────────────────────────────────────────────

  it("preserves earnings when rate is updated", async () => {
    await vault.deposit(DEPOSIT);
    await vault.setStream(worker1.address, RATE_PER_SEC);
    await increaseTime(10);

    const accBefore = await vault.accrued(worker1.address);
    await vault.setStream(worker1.address, RATE_PER_SEC * 2n);

    // Accrued should not drop after rate change
    const accAfter = await vault.accrued(worker1.address);
    expect(accAfter).to.be.gte(accBefore);
  });

  // ── Runway ─────────────────────────────────────────────────────────────────

  it("returns max uint256 runway when no streams active", async () => {
    await vault.deposit(DEPOSIT);
    const runway = await vault.runwayDays();
    expect(runway).to.equal(ethers.MaxUint256);
  });

  it("calculates runway in days", async () => {
    // 86400 USDT0 at 1 USDT0/s = exactly 1 day
    const oneDayDeposit = 86400n * ONE_USDT0;
    await token.mint(owner.address, oneDayDeposit * 2n);
    await vault.deposit(oneDayDeposit);
    await vault.setStream(worker1.address, RATE_PER_SEC);

    const days = await vault.runwayDays();
    expect(days).to.be.gte(0n);
    expect(days).to.be.lte(2n);
  });

  // ── Reclaim ────────────────────────────────────────────────────────────────

  it("owner reclaims unstreamed balance", async () => {
    await vault.deposit(DEPOSIT);
    const unstreamed = await vault.unstreamedBalance();
    expect(unstreamed).to.equal(DEPOSIT);

    const before = await token.balanceOf(owner.address);
    await expect(vault.reclaimUnstreamed(DEPOSIT))
      .to.emit(vault, "Reclaimed");
    const after = await token.balanceOf(owner.address);
    expect(after - before).to.equal(DEPOSIT);
  });

  it("reverts reclaim of more than unstreamed balance", async () => {
    await vault.deposit(DEPOSIT);
    await vault.setStream(worker1.address, RATE_PER_SEC);
    await increaseTime(10);

    await expect(vault.reclaimUnstreamed(DEPOSIT))
      .to.be.revertedWith("exceeds unstreamed balance");
  });

  // ── Total accrued + unstreamed ─────────────────────────────────────────────

  it("totalAccrued sums across multiple workers", async () => {
    await vault.deposit(DEPOSIT);
    await vault.setStream(worker1.address, RATE_PER_SEC);
    await vault.setStream(worker2.address, RATE_PER_SEC * 2n);
    await increaseTime(5);

    const total = await vault.totalAccrued();
    const acc1  = await vault.accrued(worker1.address);
    const acc2  = await vault.accrued(worker2.address);
    expect(total).to.equal(acc1 + acc2);
  });

  it("unstreamedBalance = vaultBalance - totalAccrued", async () => {
    await vault.deposit(DEPOSIT);
    await vault.setStream(worker1.address, RATE_PER_SEC);
    await increaseTime(5);

    const bal        = await vault.vaultBalance();
    const totalAcc   = await vault.totalAccrued();
    const unstreamed = await vault.unstreamedBalance();
    expect(unstreamed).to.equal(bal - totalAcc);
  });
});
