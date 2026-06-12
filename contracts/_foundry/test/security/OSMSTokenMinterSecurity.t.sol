// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "../base/OSMSTokenMinterBase.t.sol";

/**
 * @title OSMSTokenMinterSecurity
 * @dev Targets cryptographic integrity, double-spend vulnerabilities,
 * timing attacks, and timelocked constraint manipulation risks.
 */
contract OSMSTokenMinterSecurity is OSMSTokenMinterBase {

    /**
     * @dev Ensure claims with expired deadlines revert.
     */
    function test_Revert_ClaimExpiredDeadline() public {
        uint256 claimAmount = 1000 * 10**18;
        bytes32 claimId = keccak256("expired");
        uint256 deadline = block.timestamp - 1 seconds; // Expired

        bytes memory signature = getTokenClaimSignature(
            signerPrivateKey,
            alice,
            claimAmount,
            claimId,
            0,
            deadline
        );

        vm.expectRevert(InvalidDeadline.selector);
        vm.prank(alice);
        minter.claimTokens(claimAmount, claimId, deadline, signature);
    }

    /**
     * @dev Ensure claims with futuristic deadlines (> block.timestamp + 5 mins) revert.
     */
    function test_Revert_ClaimFuturisticDeadline() public {
        uint256 claimAmount = 1000 * 10**18;
        bytes32 claimId = keccak256("futuristic");
        uint256 deadline = block.timestamp + 5 minutes + 1 seconds; // Too far in the future

        bytes memory signature = getTokenClaimSignature(
            signerPrivateKey,
            alice,
            claimAmount,
            claimId,
            0,
            deadline
        );

        vm.expectRevert(InvalidDeadline.selector);
        vm.prank(alice);
        minter.claimTokens(claimAmount, claimId, deadline, signature);
    }

    /**
     * @dev Ensure requesting more than maxMintAmount fails.
     */
    function test_Revert_ClaimExceedingMaxAmount() public {
        uint256 claimAmount = INITIAL_MAX_MINT + 1; // Exceeds limit
        bytes32 claimId = keccak256("too_high");
        uint256 deadline = block.timestamp + 1 minutes;

        bytes memory signature = getTokenClaimSignature(
            signerPrivateKey,
            alice,
            claimAmount,
            claimId,
            0,
            deadline
        );

        vm.expectRevert(
            abi.encodeWithSelector(
                MintLimitExceeded.selector,
                claimAmount,
                INITIAL_MAX_MINT
            )
        );
        vm.prank(alice);
        minter.claimTokens(claimAmount, claimId, deadline, signature);
    }

    /**
     * @dev Ensure user cannot claim twice within cooldown period.
     */
    function test_Revert_ClaimCooldownNotMet() public {
        uint256 claimAmount = 1000 * 10**18;
        bytes32 claimId1 = keccak256("claim_01");
        bytes32 claimId2 = keccak256("claim_02");
        uint256 deadline = block.timestamp + 1 minutes;

        // Perform first claim
        bytes memory signature1 = getTokenClaimSignature(
            signerPrivateKey,
            alice,
            claimAmount,
            claimId1,
            0,
            deadline
        );
        vm.prank(alice);
        minter.claimTokens(claimAmount, claimId1, deadline, signature1);

        // Attempt second claim immediately
        bytes memory signature2 = getTokenClaimSignature(
            signerPrivateKey,
            alice,
            claimAmount,
            claimId2,
            1, // Nonce increased
            deadline
        );

        vm.expectRevert(
            abi.encodeWithSelector(
                MintCooldownNotMet.selector,
                block.timestamp + INITIAL_COOLDOWN
            )
        );
        vm.prank(alice);
        minter.claimTokens(claimAmount, claimId2, deadline, signature2);
    }

    /**
     * @dev Verify tampered parameters or unauthorized signers cause failure.
     */
    function test_Revert_ClaimInvalidSignature() public {
        uint256 claimAmount = 1000 * 10**18;
        bytes32 claimId = keccak256("valid_claim");
        uint256 deadline = block.timestamp + 1 minutes;

        // 1. Invalid Signer (Signed with user's key, not the minter's key)
        bytes memory badSignature = getTokenClaimSignature(
            alicePrivateKey,
            alice,
            claimAmount,
            claimId,
            0,
            deadline
        );
        vm.expectRevert(InvalidSignature.selector);
        vm.prank(alice);
        minter.claimTokens(claimAmount, claimId, deadline, badSignature);

        // 2. Tampered Amount (Signed for 1000, but trying to claim 2000)
        bytes memory signature = getTokenClaimSignature(
            signerPrivateKey,
            alice,
            claimAmount,
            claimId,
            0,
            deadline
        );
        vm.expectRevert(InvalidSignature.selector);
        vm.prank(alice);
        minter.claimTokens(2000 * 10**18, claimId, deadline, signature);
    }

    /**
     * @dev Double spend check. Ensure a single signature cannot be reused (nonce protection).
     * Since the default minter has a 1-hour cooldown which is larger than the 5-minute deadline limit,
     * a replay is naturally prevented on the production configuration.
     * To explicitly test that the contract's nonce incrementation blocks replay attacks,
     * we deploy a temporary minter with 0 cooldown.
     */
    function test_Revert_ClaimDoubleSpendReplay() public {
        // Deploy a temporary minter with 0 cooldown for this isolated test
        vm.startPrank(owner);
        OSMSTokenMinter zeroCooldownMinter = new OSMSTokenMinter(
            address(token),
            signer,
            treasury,
            0,
            INITIAL_MAX_MINT,
            0 // Cooldown is 0
        );
        token.grantRole(token.MINTER_ROLE(), address(zeroCooldownMinter));
        vm.stopPrank();

        uint256 claimAmount = 1000 * 10**18;
        bytes32 claimId = keccak256("reusable_claim");
        uint256 deadline = block.timestamp + 1 minutes;

        // Generate signature targeting the new zero-cooldown minter
        bytes32 messageHash = keccak256(abi.encodePacked(
            address(zeroCooldownMinter),
            alice,
            claimAmount,
            claimId,
            uint256(0), // Initial nonce is 0
            deadline
        ));
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerPrivateKey, ethSignedMessageHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        // First claim succeeds
        vm.prank(alice);
        zeroCooldownMinter.claimTokens(claimAmount, claimId, deadline, signature);

        // Second claim fails with InvalidSignature because Alice's nonce on the contract
        // has incremented to 1, while the provided signature was signed for nonce 0.
        vm.expectRevert(InvalidSignature.selector);
        vm.prank(alice);
        zeroCooldownMinter.claimTokens(claimAmount, claimId, deadline, signature);
    }

    /**
     * @dev Tests timelocked constraint modifications.
     */
    function test_TimeLockedConstraintsUpdate() public {
        uint256 newMax = 50_000 * 10**18;
        uint256 newCooldown = 30 minutes;

        // 1. Non-owner cannot queue constraints
        vm.expectRevert(
            abi.encodeWithSelector(
                bytes4(keccak256("OwnableUnauthorizedAccount(address)")),
                alice
            )
        );
        vm.prank(alice);
        minter.queueMintConstraints(newMax, newCooldown);

        // 2. Owner queues constraints successfully
        vm.startPrank(owner);
        vm.expectEmit(true, true, true, true);
        emit OSMSTokenMinter.LimitsUpdateQueued(newMax, newCooldown, block.timestamp + 48 hours);
        minter.queueMintConstraints(newMax, newCooldown);

        // 3. Attempting to apply before timelock expiry must revert
        vm.expectRevert(
            abi.encodeWithSelector(
                TimeLockNotExpired.selector,
                block.timestamp + 48 hours
            )
        );
        minter.applyMintConstraints();

        // 4. Successful application after 48-hour delay
        vm.warp(block.timestamp + 48 hours + 1 seconds);

        vm.expectEmit(true, true, true, true);
        emit OSMSTokenMinter.LimitsUpdated(newMax, newCooldown);
        minter.applyMintConstraints();

        assertEq(minter.maxMintAmount(), newMax);
        assertEq(minter.mintCooldown(), newCooldown);

        // 5. Subsequent immediate execution must fail (no pending updates left)
        vm.expectRevert(NoPendingUpdate.selector);
        minter.applyMintConstraints();
        vm.stopPrank();
    }
}