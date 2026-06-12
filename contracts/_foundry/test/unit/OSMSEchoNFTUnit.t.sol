// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "../base/OSMSEchoNFTBase.t.sol";

/**
 * @title OSMSEchoNFTUnit
 * @dev Validates successful initialization sequences, oracle USD-to-ETH price
 * conversions, and standard mint validations (with refund processing).
 */
contract OSMSEchoNFTUnit is OSMSEchoNFTBase {

    /**
     * @dev Verify initial state is applied correctly.
     */
    function test_InitialState() public view {
        assertEq(address(echoNFT.priceFeed()), address(mockPriceFeed));
        assertEq(echoNFT.serverURI(), SERVER_URI);
        assertEq(echoNFT.treasury(), treasury);
        assertEq(echoNFT.echoCount(), 0);
    }

    /**
     * @dev Verify initializeEchoes setup works and registers all 10 predefined echoes.
     */
    function test_InitializeEchoesSuccess() public {
        vm.prank(owner);
        echoNFT.initializeEchoes();

        assertEq(echoNFT.echoCount(), 10);

        // Check ID 0: $1 USD, Max 500, WhitelistOnly = false
        assertEq(echoNFT.usdPricesById(0), 1 * 10**18);
        assertEq(echoNFT.maxMints(0), 500);
        assertFalse(echoNFT.whitelistOnlyById(0));

        // Check ID 8: $0 USD, Max 5, WhitelistOnly = true
        assertEq(echoNFT.usdPricesById(8), 0);
        assertEq(echoNFT.maxMints(8), 5);
        assertTrue(echoNFT.whitelistOnlyById(8));
    }

    /**
     * @dev Verify math logic of usdToEth. At $3000/ETH, $30 Echo should cost exactly 0.01 ETH.
     */
    function test_UsdToEthMath() public view {
        uint256 usdAmount = 30 * 10**18; // $30 USD
        uint256 expectedEth = 0.01 ether; // 0.01 ETH

        uint256 calculatedEth = echoNFT.usdToEth(usdAmount);
        assertEq(calculatedEth, expectedEth);
    }

    /**
     * @dev Verify a standard mint takes correct payment and returns surplus refunds.
     */
    function test_MintEchoSuccess_PaidAndRefunded() public {
        vm.prank(owner);
        echoNFT.addEcho(30 * 10**18, 100, false); // ID 0: $30 USD

        uint256 requiredEth = echoNFT.usdToEth(30 * 10**18); // 0.01 ETH
        uint256 sentEth = 0.05 ether; // Excess payment sent

        uint256 aliceBalanceBefore = alice.balance;
        uint256 treasuryBalanceBefore = treasury.balance;

        vm.expectEmit(true, true, true, true);
        emit OSMSEchoNFT.EchoMinted(alice, 0);

        vm.prank(alice);
        echoNFT.mintEcho{value: sentEth}(0);

        // Verify NFT balance and ownership states
        assertEq(echoNFT.balanceOf(alice, 0), 1);
        assertTrue(echoNFT.hasAnyToken(alice));
        assertTrue(echoNFT.isEchoMinter(alice));

        // Check exact pricing settlement
        assertEq(treasury.balance, treasuryBalanceBefore + requiredEth);
        assertEq(alice.balance, aliceBalanceBefore - requiredEth); // Exact change refunded
    }

    /**
     * @dev Verify whitelist-only mints work for whitelisted users for free (0 payment).
     */
    function test_MintEchoSuccess_Whitelist() public {
        vm.startPrank(owner);
        echoNFT.addEcho(0, 10, true); // ID 0: Whitelist only
        address[] memory users = new address[](1);
        users[0] = alice;
        wlManager.addAddressesToEchoWhitelist(0, users, 1);
        vm.stopPrank();

        // Alice mints without sending any ETH payment
        vm.prank(alice);
        echoNFT.mintEcho{value: 0}(0);

        assertEq(echoNFT.balanceOf(alice, 0), 1);
        assertFalse(wlManager.isWhitelistedForEcho(0, alice)); // Whitelist consumed
    }
}