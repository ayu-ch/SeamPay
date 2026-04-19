// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title StreamVault
 * @notice Recurring USDT0 payroll streaming on Conflux eSpace.
 *
 * An employer deposits USDT0, sets a per-second rate for each worker,
 * and workers accrue tokens linearly. Workers can withdraw any time.
 *
 * Accounting model (per worker):
 *   accrued = credit + (ratePerSecond * elapsed) - withdrawn
 *   where `credit` captures earnings snapshotted on rate-change or stream stop.
 *
 * Rate reference (6-decimal USDT0):
 *   100 USDT0/week  →  100_000_000 / 604_800  ≈ 165 wei/s
 *   1 USDT0/second  →  1_000_000 wei/s  (good for demo)
 */
contract StreamVault is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─────────────────────────────────────────────────────────────────────────
    // Types
    // ─────────────────────────────────────────────────────────────────────────

    struct Stream {
        uint256 ratePerSecond; // USDT0 wei accrued per second (0 when stopped)
        uint256 startTime;     // block.timestamp of last rate-change
        uint256 credit;        // snapshotted earnings carried across rate changes
        uint256 withdrawn;     // total amount the worker has already pulled out
        bool    exists;        // true once setStream has been called
    }

    // ─────────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────────

    address public owner;
    IERC20  public token;

    mapping(address => Stream) public streams;
    address[] public workerList;

    // ─────────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────────

    event Deposited(address indexed by, uint256 amount);
    event StreamSet(address indexed worker, uint256 ratePerSecond);
    event StreamStopped(address indexed worker);
    event Withdrawn(address indexed worker, uint256 amount);
    event Reclaimed(address indexed by, uint256 amount);

    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────

    constructor(address _token) {
        require(_token != address(0), "invalid token");
        owner = msg.sender;
        token = IERC20(_token);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Modifiers
    // ─────────────────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Employer actions
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Deposit USDT0 into the vault. Caller must approve this contract first.
     */
    function deposit(uint256 amount) external onlyOwner {
        require(amount > 0, "zero amount");
        token.safeTransferFrom(msg.sender, address(this), amount);
        emit Deposited(msg.sender, amount);
    }

    /**
     * @notice Create or update a worker stream.
     *         Any earnings accrued under the old rate are snapshotted before
     *         the new rate takes effect, so workers never lose earnings.
     * @param worker         Worker wallet address.
     * @param ratePerSecond  USDT0 wei accrued per second.
     */
    function setStream(address worker, uint256 ratePerSecond) external onlyOwner {
        require(worker != address(0), "invalid worker");
        require(ratePerSecond > 0, "zero rate");

        Stream storage s = streams[worker];

        if (!s.exists) {
            workerList.push(worker);
            s.exists = true;
        } else {
            // Snapshot earnings under the current rate before changing it
            s.credit += _streamGross(s);
        }

        s.ratePerSecond = ratePerSecond;
        s.startTime     = block.timestamp;

        emit StreamSet(worker, ratePerSecond);
    }

    /**
     * @notice Stop a worker stream. Accrued balance remains withdrawable.
     */
    function stopStream(address worker) external onlyOwner {
        Stream storage s = streams[worker];
        require(s.exists, "no stream");
        require(s.ratePerSecond > 0, "already stopped");

        s.credit       += _streamGross(s);
        s.ratePerSecond = 0;
        s.startTime     = block.timestamp;

        emit StreamStopped(worker);
    }

    /**
     * @notice Return unstreamed vault balance to the owner.
     *         Only the portion not yet accrued by any worker can be reclaimed.
     */
    function reclaimUnstreamed(uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0, "zero amount");
        uint256 available = _unstreamedBalance();
        require(amount <= available, "exceeds unstreamed balance");
        token.safeTransfer(owner, amount);
        emit Reclaimed(owner, amount);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Worker actions
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Withdraw accrued USDT0.
     * @param amount Amount in USDT0 wei (6 decimals) to withdraw.
     */
    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "zero amount");
        Stream storage s = streams[msg.sender];
        require(s.exists, "no stream");

        uint256 available = _accrued(s);
        require(available >= amount, "not enough accrued");

        s.withdrawn += amount;
        token.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // View functions
    // ─────────────────────────────────────────────────────────────────────────

    /** @notice Withdrawable accrued balance for a worker. */
    function accrued(address worker) external view returns (uint256) {
        return _accrued(streams[worker]);
    }

    /** @notice Total USDT0 held in the vault. */
    function vaultBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }

    /** @notice Total accrued (undrawn) across all workers. */
    function totalAccrued() external view returns (uint256) {
        uint256 sum;
        for (uint256 i; i < workerList.length; i++) {
            sum += _accrued(streams[workerList[i]]);
        }
        return sum;
    }

    /** @notice Vault balance not yet accrued by anyone — safe to reclaim. */
    function unstreamedBalance() external view returns (uint256) {
        return _unstreamedBalance();
    }

    /**
     * @notice Days of runway at current aggregate burn rate.
     *         Returns type(uint256).max when no active streams.
     */
    function runwayDays() external view returns (uint256) {
        uint256 rate = _totalRatePerSecond();
        if (rate == 0) return type(uint256).max;
        uint256 bal = token.balanceOf(address(this));
        // rate is in USDT0 wei/s; divide balance by (rate * seconds_per_day)
        return bal / (rate * 86400);
    }

    /** @notice All registered worker addresses. */
    function getWorkers() external view returns (address[] memory) {
        return workerList;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internal helpers
    // ─────────────────────────────────────────────────────────────────────────

    /** Gross elapsed earnings for an active stream (no cap, no credit). */
    function _streamGross(Stream storage s) internal view returns (uint256) {
        if (s.ratePerSecond == 0) return 0;
        return (block.timestamp - s.startTime) * s.ratePerSecond;
    }

    /** Net withdrawable balance for a stream. */
    function _accrued(Stream storage s) internal view returns (uint256) {
        uint256 gross = s.credit + _streamGross(s);
        // Cap to vault balance so we never report more than exists
        uint256 bal = token.balanceOf(address(this));
        if (gross > bal) gross = bal;
        return gross > s.withdrawn ? gross - s.withdrawn : 0;
    }

    function _totalRatePerSecond() internal view returns (uint256 total) {
        for (uint256 i; i < workerList.length; i++) {
            total += streams[workerList[i]].ratePerSecond;
        }
    }

    function _unstreamedBalance() internal view returns (uint256) {
        uint256 bal = token.balanceOf(address(this));
        uint256 allocated;
        for (uint256 i; i < workerList.length; i++) {
            allocated += _accrued(streams[workerList[i]]);
        }
        return bal > allocated ? bal - allocated : 0;
    }
}
