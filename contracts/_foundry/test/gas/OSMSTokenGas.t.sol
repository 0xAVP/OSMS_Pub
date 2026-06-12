// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "../base/OSMSTokenBase.t.sol";

/**
 * @title OSMSTokenGas
 * @dev Computational efficiency benchmarks and fuzzing mechanics validating invariant bounds.
 */
contract OSMSTokenGas is OSMSTokenBase {

    /**
     * @dev Fuzz testing validating that mints within bounds always succeed regardless of sizes.
     */
    function testFuzz_MintUnderCap(uint256 maxSupply, uint256 mintAmount) public {
        // Restricting values to realistic bounds (below 10^30) to prevent absurd memory allocations
        maxSupply = bound(maxSupply, 1, 10**30);
        mintAmount = bound(mintAmount, 0, maxSupply);

        vm.prank(owner);
        token.setMaxSupply(maxSupply);

        vm.prank(minter);
        token.mint(alice, mintAmount);

        assertEq(token.totalSupply(), mintAmount);
        assertEq(token.balanceOf(alice), mintAmount);
    }

    /**
     * @dev Fuzz testing verification of totalBurned invariant calculation.
     */
    function testFuzz_BurnTracking(uint256 mintAmount, uint256 burnAmount) public {
        mintAmount = bound(mintAmount, 1, 10**30);
        burnAmount = bound(burnAmount, 0, mintAmount);

        vm.prank(minter);
        token.mint(alice, mintAmount);

        vm.prank(alice);
        token.burn(burnAmount);

        assertEq(token.totalBurned(), burnAmount);
        assertEq(token.totalSupply(), mintAmount - burnAmount);
    }

    /**
     * @dev Gas profiling simulation of fundamental token routines.
     */
    function test_GasProfiling() public {
        uint256 mintAmount = 1000 * 10**18;

        // Measure exact gas taken for minting execution
        uint256 gasStart = gasleft();
        vm.prank(minter);
        token.mint(alice, mintAmount);
        uint256 gasUsedMint = gasStart - gasleft();
        emit log_named_uint("Gas cost for Minting raw ERC20", gasUsedMint);

        // Measure exact gas taken for transfers execution
        gasStart = gasleft();
        vm.prank(alice);
        token.transfer(bob, 100 * 10**18);
        uint256 gasUsedTransfer = gasStart - gasleft();
        emit log_named_uint("Gas cost for Transfer", gasUsedTransfer);

        // Measure exact gas taken for burning execution
        gasStart = gasleft();
        vm.prank(alice);
        token.burn(100 * 10**18);
        uint256 gasUsedBurn = gasStart - gasleft();
        emit log_named_uint("Gas cost for Burning", gasUsedBurn);
    }
}