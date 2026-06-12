// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "../base/OSMSEchoNFTBase.t.sol";

/**
 * @title OSMSEchoNFTSecurity
 * @dev Threat modeling for OSMSEchoNFT. Targets pricing exploits, oracle staleness,
 * mint overflows, and demonstrates the zero-amount transfer tracking flaw.
 */
contract OSMSEchoNFTSecurity is OSMSEchoNFTBase {

    // Note: Re-declarations of custom errors were deleted to fix compiler shadowing warnings.
    // Errors are imported directly from the source contract file-level scope.

    // Standard OpenZeppelin Pausable error
    error EnforcedPause();

    /**
     * @dev Ensure attempts to mint non-existent Echo IDs fail.
     */
    function test_Revert_MintNonExistentId() public {
        vm.expectRevert(abi.encodeWithSelector(InvalidEchoId.selector, 0));
        vm.prank(alice);
        echoNFT.mintEcho(0);
    }

    /**
     * @dev Ensure normal users cannot bypass whitelist-only constraints.
     */
    function test_Revert_WhitelistOnlyBypass() public {
        vm.prank(owner);
        echoNFT.addEcho(0, 50, true); // ID 0: Whitelist only

        vm.expectRevert(abi.encodeWithSelector(WhitelistOnlyMint.selector, 0));
        vm.prank(alice);
        echoNFT.mintEcho(0);
    }

    /**
     * @dev Ensure transactions with insufficient ETH payment revert.
     */
    function test_Revert_InsufficientPayment() public {
        vm.prank(owner);
        echoNFT.addEcho(30 * 10**18, 50, false); // ID 0: $30 USD (0.01 ETH)

        uint256 calculatedPrice = echoNFT.usdToEth(30 * 10**18); // 0.01 ether

        // Alice tries to pay 0.009 ETH
        vm.expectRevert(
            abi.encodeWithSelector(
                InsufficientPayment.selector,
                calculatedPrice,
                0.009 ether
            )
        );
        vm.prank(alice);
        echoNFT.mintEcho{value: 0.009 ether}(0);
    }

    /**
     * @dev Ensure minting ceases immediately once maxMint allocation is reached.
     */
    function test_Revert_MintLimitExceeded() public {
        vm.prank(owner);
        echoNFT.addEcho(30 * 10**18, 1, false); // ID 0: Max mint limit of 1

        uint256 price = echoNFT.usdToEth(30 * 10**18);

        // Alice mints the only available spot
        vm.prank(alice);
        echoNFT.mintEcho{value: price}(0);

        // Bob tries to mint but limit is reached
        vm.expectRevert(abi.encodeWithSelector(MintLimitExceeded.selector, 0));
        vm.prank(bob);
        echoNFT.mintEcho{value: price}(0);
    }

    /**
     * @dev Ensure the contract rejects pricing if Chainlink's update timestamp is stale.
     */
    function test_Revert_PriceFeedStalenessThreshold() public {
        vm.prank(owner);
        echoNFT.addEcho(30 * 10**18, 50, false);

        uint256 price = echoNFT.usdToEth(30 * 10**18);

        // Fast-forward time by 1 hour and 1 second (beyond threshold)
        vm.warp(block.timestamp + 1 hours + 1 seconds);

        vm.expectRevert(
            abi.encodeWithSelector(
                PriceFeedDataTooOld.selector,
                block.timestamp - (1 hours + 1 seconds)
            )
        );
        vm.prank(alice);
        echoNFT.mintEcho{value: price}(0);
    }

    /**
     * @dev Ensure the contract rejects pricing if the oracle reports negative or zero price.
     */
    function test_Revert_OracleInvalidPrice() public {
        vm.prank(owner);
        echoNFT.addEcho(30 * 10**18, 50, false);

        // Set oracle price to 0
        mockPriceFeed.updatePrice(0);

        vm.expectRevert(PriceFeedIsInvalid.selector);
        vm.prank(alice);
        echoNFT.mintEcho{value: 0.01 ether}(0);
    }

    /**
     * @dev SECURITY VALIDATION:
     * Verifies that the fixed contract correctly ignores transfers of 0 amount
     * and does NOT increment the uniqueTokensOwned state for the recipient.
     */
    function test_Security_ZeroAmountTransferDoesNotIncrementUniqueTokens() public {
        vm.startPrank(owner);
        echoNFT.addEcho(10 * 10**18, 100, false); // ID 0
        echoNFT.addEcho(10 * 10**18, 100, false); // ID 1
        vm.stopPrank();

        uint256 price = echoNFT.usdToEth(10 * 10**18);

        // 1. Alice mints ID 0
        vm.prank(alice);
        echoNFT.mintEcho{value: price}(0);

        assertEq(echoNFT.balanceOf(alice, 0), 1);
        assertEq(echoNFT.uniqueTokensOwned(alice), 1);

        // 2. Bob currently owns exactly 0 unique tokens
        assertEq(echoNFT.balanceOf(bob, 1), 0);
        assertEq(echoNFT.uniqueTokensOwned(bob), 0);
        assertFalse(echoNFT.hasAnyToken(bob));

        // 3. Alice executes a standard ERC1155 transfer of 0 tokens of ID 1 to Bob
        vm.prank(alice);
        echoNFT.safeTransferFrom(alice, bob, 1, 0, "");

        // Bob still owns 0 tokens of ID 1
        assertEq(echoNFT.balanceOf(bob, 1), 0);

        // SECURED: Bob's uniqueTokensOwned remains 0, and hasAnyToken is false
        assertEq(echoNFT.uniqueTokensOwned(bob), 0);
        assertFalse(echoNFT.hasAnyToken(bob)); // Bob does NOT get false clearance state
    }
}