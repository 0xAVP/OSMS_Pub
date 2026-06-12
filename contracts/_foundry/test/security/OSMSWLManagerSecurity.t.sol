// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "../base/OSMSWLManagerBase.t.sol";

/**
 * @title OSMSWLManagerSecurity
 * @dev Targets malicious permission bypasses, zero value boundaries,
 * and out-of-quota claim recording restrictions.
 */
contract OSMSWLManagerSecurity is OSMSWLManagerBase {

    // Standard OpenZeppelin Ownable custom error
    error OwnableUnauthorizedAccount(address account);

    /**
     * @dev Ensure non-owner addresses cannot modify whitelist registries.
     */
    function test_Revert_NonOwnerModifications() public {
        address[] memory users = new address[](1);
        users[0] = alice;

        // Alice attempts to add Bob to the Echo whitelist
        vm.expectRevert(
            abi.encodeWithSelector(OwnableUnauthorizedAccount.selector, alice)
        );
        vm.prank(alice);
        wlManager.addAddressesToEchoWhitelist(1, users, 2);

        // Alice attempts to set contract targets
        vm.expectRevert(
            abi.encodeWithSelector(OwnableUnauthorizedAccount.selector, alice)
        );
        vm.prank(alice);
        wlManager.setContracts(address(0x11), address(0x22));
    }

    /**
     * @dev Ensure inserting a whitelist quantity of 0 reverts.
     */
    function test_Revert_AddAddressesZeroQuantity() public {
        address[] memory users = new address[](1);
        users[0] = alice;

        vm.startPrank(owner);
        vm.expectRevert("Quantity must be greater than zero");
        wlManager.addAddressesToEchoWhitelist(1, users, 0);

        vm.expectRevert("Quantity must be greater than zero");
        wlManager.addAddressesToShipWhitelist(1, users, 0);
        vm.stopPrank();
    }

    /**
     * @dev Ensure inserting zero address inside user batch arrays reverts.
     */
    function test_Revert_AddAddressesZeroAddress() public {
        address[] memory users = new address[](2);
        users[0] = alice;
        users[1] = address(0);

        vm.startPrank(owner);
        vm.expectRevert(ZeroAddress.selector);
        wlManager.addAddressesToEchoWhitelist(1, users, 1);

        vm.expectRevert(ZeroAddress.selector);
        wlManager.addAddressesToShipWhitelist(1, users, 1);
        vm.stopPrank();
    }

    /**
     * @dev Ensure only the authorized target NFT contracts can trigger claim logs.
     */
    function test_Revert_UnauthorizedWLRecordCall() public {
        address[] memory users = new address[](1);
        users[0] = alice;

        vm.prank(owner);
        wlManager.addAddressesToEchoWhitelist(1, users, 1);

        // Alice (unauthorized) attempts to record an Echo claim
        vm.expectRevert(UnauthorizedCaller.selector);
        vm.prank(alice);
        wlManager.recordEchoClaim(1, alice);

        // Alice (unauthorized) attempts to record a Ship claim
        vm.expectRevert(UnauthorizedCaller.selector);
        vm.prank(alice);
        wlManager.recordShipClaim(1, alice);
    }

    /**
     * @dev Ensure claim records revert immediately once the assigned user allocation is spent.
     */
    function test_Revert_WLRecordNoClaimsLeft() public {
        address[] memory users = new address[](1);
        users[0] = alice;

        vm.prank(owner);
        wlManager.addAddressesToEchoWhitelist(1, users, 1); // 1 claim allowed

        // First claim triggered by mockEchoNFT contract succeeds
        vm.expectEmit(true, true, true, true);
        emit OSMSWLManager.WhitelistClaimed(alice, 1, true);
        vm.prank(mockEchoNFT);
        wlManager.recordEchoClaim(1, alice);

        // Alice is no longer whitelisted (1 of 1 spent)
        assertFalse(wlManager.isWhitelistedForEcho(1, alice));

        // Second claim attempt must revert
        vm.expectRevert(NoClaimsLeft.selector);
        vm.prank(mockEchoNFT);
        wlManager.recordEchoClaim(1, alice);
    }
}