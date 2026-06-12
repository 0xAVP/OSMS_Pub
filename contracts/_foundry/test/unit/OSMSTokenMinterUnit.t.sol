// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "../base/OSMSTokenMinterBase.t.sol";

/**
 * @title OSMSTokenMinterUnit
 * @dev Verifies claim allocation correctness, epoch accounting transitions,
 * and status queries when operations execute smoothly.
 */
contract OSMSTokenMinterUnit is OSMSTokenMinterBase {

    /**
     * @dev Verify initial minter settings are applied correctly from deployment.
     */
    function test_InitialState() public view {
        assertEq(address(minter.token()), address(token));
        assertEq(minter.signer(), signer);
        assertEq(minter.treasury(), treasury);
        assertEq(minter.maxMintAmount(), INITIAL_MAX_MINT);
        assertEq(minter.mintCooldown(), INITIAL_COOLDOWN);
        assertEq(minter.mintingEpoch(), 1);
        assertEq(minter.cumulativeMinted(), 0);
    }

    /**
     * @dev Verify a standard successful claim transfers 90% to the claimant and 10% to treasury.
     */
    function test_ClaimTokensSuccess() public {
        uint256 claimAmount = 10_000 * 10**18;
        bytes32 claimId = keccak256("claim_01");
        uint256 deadline = block.timestamp + 1 minutes;
        uint256 nonce = 0;

        bytes memory signature = getTokenClaimSignature(
            signerPrivateKey,
            alice,
            claimAmount,
            claimId,
            nonce,
            deadline
        );

        // Expected emitted event logic check
        vm.expectEmit(true, true, true, true);
        emit OSMSTokenMinter.TokensClaimed(
            alice,
            claimAmount,
            claimAmount * 90 / 100, // User amount
            claimAmount * 10 / 100, // Fee amount
            claimId
        );

        vm.prank(alice);
        minter.claimTokens(claimAmount, claimId, deadline, signature);

        // Assert balances are correctly allocated
        assertEq(token.balanceOf(alice), claimAmount * 90 / 100);
        assertEq(token.balanceOf(treasury), claimAmount * 10 / 100);
        assertEq(minter.cumulativeMinted(), claimAmount);
        assertEq(minter.nonces(alice), 1);
        assertEq(minter.lastMintTime(alice), block.timestamp);
    }

    /**
     * @dev Verify epoch increments correctly when cumulative claims cross 1,000,000 tokens limit.
     */
    function test_EpochIncrease() public {
        // Since we need to cross 1M token epoch step, we first increase maxMintAmount limits to fit a large test claim
        vm.startPrank(owner);
        minter.queueMintConstraints(2_000_000 * 10**18, 0);
        vm.warp(block.timestamp + 48 hours + 1 seconds);
        minter.applyMintConstraints();
        vm.stopPrank();

        // Perform a claim of 1.1M tokens to cross the EPOCH_STEP boundary
        uint256 bigClaimAmount = 1_100_000 * 10**18;
        bytes32 claimId = keccak256("epoch_crossing_claim");
        uint256 deadline = block.timestamp + 1 minutes;

        bytes memory signature = getTokenClaimSignature(
            signerPrivateKey,
            alice,
            bigClaimAmount,
            claimId,
            0,
            deadline
        );

        vm.expectEmit(true, true, true, true);
        emit OSMSTokenMinter.EpochIncreased(2); // Crossing 1M should trigger Epoch 2

        vm.prank(alice);
        minter.claimTokens(bigClaimAmount, claimId, deadline, signature);

        assertEq(minter.mintingEpoch(), 2);
    }

    /**
     * @dev Verify status reader outputs values accurately.
     */
    function test_GetMintingStatus() public {
        uint256 claimAmount = 5000 * 10**18;
        bytes32 claimId = keccak256("status_check");
        uint256 deadline = block.timestamp + 1 minutes;

        bytes memory signature = getTokenClaimSignature(
            signerPrivateKey,
            alice,
            claimAmount,
            claimId,
            0,
            deadline
        );

        vm.prank(alice);
        minter.claimTokens(claimAmount, claimId, deadline, signature);

        (
            uint256 currentNonce,
            uint256 maxMint,
            uint256 cooldown,
            uint256 lastMint,
            uint256 currentEpoch
        ) = minter.getMintingStatus(alice);

        assertEq(currentNonce, 1);
        assertEq(maxMint, INITIAL_MAX_MINT);
        assertEq(cooldown, INITIAL_COOLDOWN);
        assertEq(lastMint, block.timestamp);
        assertEq(currentEpoch, 1);
    }
}