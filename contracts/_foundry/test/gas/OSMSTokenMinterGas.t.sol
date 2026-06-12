// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "../base/OSMSTokenMinterBase.t.sol";

/**
 * @title OSMSTokenMinterGas
 * @dev Computational benchmarks and fuzz testing verifying signature validation and fee allocations.
 */
contract OSMSTokenMinterGas is OSMSTokenMinterBase {

    /**
     * @dev Fuzz tests that claims are allocated precisely and fee structures always yield 90/10 split.
     */
    function testFuzz_ClaimTokens(uint256 amount) public {
        // Limit amounts within bounds (up to the maximum claim allowance)
        amount = bound(amount, 10, INITIAL_MAX_MINT);

        bytes32 claimId = keccak256(abi.encodePacked("fuzzed_claim", amount));
        uint256 deadline = block.timestamp + 1 minutes;

        bytes memory signature = getTokenClaimSignature(
            signerPrivateKey,
            alice,
            amount,
            claimId,
            0,
            deadline
        );

        vm.prank(alice);
        minter.claimTokens(amount, claimId, deadline, signature);

        // Confirm 90/10 math logic holds
        uint256 expectedFee = (amount * 10) / 100;
        uint256 expectedUser = amount - expectedFee;

        assertEq(token.balanceOf(alice), expectedUser);
        assertEq(token.balanceOf(treasury), expectedFee);
    }

    /**
     * @dev Profiles direct execution gas consumption of the claim function including signature verification.
     */
    function test_GasProfiling() public {
        uint256 amount = 1000 * 10**18;
        bytes32 claimId = keccak256("gas_test_claim");
        uint256 deadline = block.timestamp + 1 minutes;

        bytes memory signature = getTokenClaimSignature(
            signerPrivateKey,
            alice,
            amount,
            claimId,
            0,
            deadline
        );

        uint256 gasStart = gasleft();
        vm.prank(alice);
        minter.claimTokens(amount, claimId, deadline, signature);
        uint256 gasUsed = gasStart - gasleft();

        emit log_named_uint("Gas cost for claimTokens with signature recovery", gasUsed);
    }
}