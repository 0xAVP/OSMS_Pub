// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "../base/OSMSWLManagerBase.t.sol";

/**
 * @title OSMSWLManagerUnit
 * @dev Validates correct whitelist additions, removals, status view outputs,
 * and standard whitelist state updates.
 */
contract OSMSWLManagerUnit is OSMSWLManagerBase {

    /**
     * @dev Verify deployment parameters match initialization values.
     */
    function test_InitialState() public view {
        assertEq(wlManager.echoNFTContract(), mockEchoNFT);
        assertEq(wlManager.shipNFTContract(), mockShipNFT);
        assertEq(wlManager.owner(), owner);
    }

    /**
     * @dev Verify batch address insertion to Echo whitelist.
     */
    function test_AddAddressesToEchoWhitelistSuccess() public {
        address[] memory users = new address[](2);
        users[0] = alice;
        users[1] = bob;
        uint256 quantity = 3;

        // Expect individual events to be emitted for each user
        vm.expectEmit(true, true, true, true);
        emit OSMSWLManager.WhitelistUpdated(alice, 1, true, true);
        vm.expectEmit(true, true, true, true);
        emit OSMSWLManager.WhitelistUpdated(bob, 1, true, true);

        vm.prank(owner);
        wlManager.addAddressesToEchoWhitelist(1, users, quantity);

        assertTrue(wlManager.isWhitelistedForEcho(1, alice));
        assertTrue(wlManager.isWhitelistedForEcho(1, bob));
        assertFalse(wlManager.isWhitelistedForEcho(1, charlie));

        (uint256 allowed, uint256 claimed) = wlManager.getEchoClaimStatus(1, alice);
        assertEq(allowed, quantity);
        assertEq(claimed, 0);
    }

    /**
     * @dev Verify batch removal of addresses from Echo whitelist.
     */
    function test_RemoveAddressesFromEchoWhitelistSuccess() public {
        address[] memory users = new address[](2);
        users[0] = alice;
        users[1] = bob;

        vm.startPrank(owner);
        wlManager.addAddressesToEchoWhitelist(1, users, 2);

        // Remove Alice from the list
        address[] memory toRemove = new address[](1);
        toRemove[0] = alice;

        vm.expectEmit(true, true, true, true);
        emit OSMSWLManager.WhitelistUpdated(alice, 1, false, true);

        wlManager.removeAddressesFromEchoWhitelist(1, toRemove);
        vm.stopPrank();

        assertFalse(wlManager.isWhitelistedForEcho(1, alice));
        assertTrue(wlManager.isWhitelistedForEcho(1, bob));
    }

    /**
     * @dev Verify batch address insertion to Ship whitelist.
     */
    function test_AddAddressesToShipWhitelistSuccess() public {
        address[] memory users = new address[](1);
        users[0] = alice;
        uint256 quantity = 5;

        vm.expectEmit(true, true, true, true);
        emit OSMSWLManager.WhitelistUpdated(alice, 5, true, false);

        vm.prank(owner);
        wlManager.addAddressesToShipWhitelist(5, users, quantity);

        assertTrue(wlManager.isWhitelistedForShip(5, alice));

        (uint256 allowed, uint256 claimed) = wlManager.getShipClaimStatus(5, alice);
        assertEq(allowed, quantity);
        assertEq(claimed, 0);
    }

    /**
     * @dev Verify contract addresses update works seamlessly.
     */
    function test_SetContractsSuccess() public {
        address newEcho = address(0xAA);
        address newShip = address(0xBB);

        vm.prank(owner);
        wlManager.setContracts(newEcho, newShip);

        assertEq(wlManager.echoNFTContract(), newEcho);
        assertEq(wlManager.shipNFTContract(), newShip);
    }
}