// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Minimal mock for USDT0 (6 decimals) used in local tests only.
contract MockUSDT0 is ERC20 {
    constructor() ERC20("Mock USDT0", "mUSDT0") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
