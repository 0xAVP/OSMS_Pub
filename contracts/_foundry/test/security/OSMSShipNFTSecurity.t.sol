// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "../base/OSMSShipNFTBase.t.sol";

/**
 * @title OSMSShipNFTSecurity
 * @dev Targets access control bypasses, invalid parameters constraints,
 * and pausable state transfers freezes.
 */
contract OSMSShipNFTSecurity is OSMSShipNFTBase {

    // Standard OpenZeppelin Ownable and Pausable errors
    error OwnableUnauthorizedAccount(address account);
    error EnforcedPause();

    // Standard OpenZeppelin EIP-6093 error for ERC721 nonexistent tokens
    error ERC721NonexistentToken(uint256 tokenId);

    /**
     * @dev Ensure unauthorized addresses cannot call managerMint.
     */
    function test_Revert_OnlyManagerMint() public {
        vm.expectRevert(OSMSShipNFT.OnlyManager.selector);
        vm.prank(alice);
        shipNFT.managerMint(alice, 0);
    }

    /**
     * @dev Ensure minting non-existent ship types fails.
     */
    function test_Revert_MintNonExistentShipType() public {
        vm.prank(owner);
        shipNFT.initializeShipTypes(); // Registers 8 types (0 to 7)

        // Attempting to mint type 8
        vm.expectRevert(OSMSShipNFT.ShipTypeDoesNotExist.selector);
        vm.prank(manager);
        shipNFT.managerMint(alice, 8);
    }

    /**
     * @dev Ensure non-owner accounts cannot call administrative functions.
     */
    function test_Revert_OnlyOwnerAdminFunctions() public {
        vm.expectRevert(
            abi.encodeWithSelector(OwnableUnauthorizedAccount.selector, alice)
        );
        vm.prank(alice);
        shipNFT.setManager(alice);

        vm.expectRevert(
            abi.encodeWithSelector(OwnableUnauthorizedAccount.selector, alice)
        );
        vm.prank(alice);
        shipNFT.pause();
    }

    /**
     * @dev Ensure adding a public ship type (not craftableOnly) with 0 price is rejected.
     */
    function test_Revert_AddShipTypeZeroPrice() public {
        vm.startPrank(owner);

        // 1. Adding a new type with 0 mint price when craftableOnly is false
        vm.expectRevert(OSMSShipNFT.PriceMustBeGreaterThanZero.selector);
        shipNFT.addShipType(0, 0, true, false); // Price 0, craftableOnly = false

        // Populate at least one valid ship type (ID 0) so we can update it in the next step
        shipNFT.addShipType(0.001 ether, 0, true, false);

        // 2. Updating ID 0 to have 0 mint price when craftableOnly is false
        vm.expectRevert(OSMSShipNFT.PriceMustBeGreaterThanZero.selector);
        shipNFT.updateShipType(0, 0, 0, true, false);

        vm.stopPrank();
    }

    /**
     * @dev Ensure queries for non-existent token metadata revert.
     * OpenZeppelin v5's ownerOf function reverts internally with ERC721NonexistentToken,
     * so it never reaches the TokenDoesNotExist check.
     */
    function test_Revert_QueryNonExistentToken() public {
        vm.expectRevert(
            abi.encodeWithSelector(ERC721NonexistentToken.selector, 999)
        );
        shipNFT.tokenURI(999);

        vm.expectRevert(
            abi.encodeWithSelector(ERC721NonexistentToken.selector, 999)
        );
        shipNFT.getShipTypeId(999);
    }

    /**
     * @dev Verify pausing the contract completely blocks ERC721 transfers.
     */
    function test_PauseFreezesTransfers() public {
        vm.prank(owner);
        shipNFT.initializeShipTypes();

        vm.prank(manager);
        shipNFT.managerMint(alice, 0);

        // Owner pauses the contract
        vm.prank(owner);
        shipNFT.pause();

        // Transfers must revert while paused
        vm.expectRevert(EnforcedPause.selector);
        vm.prank(alice);
        shipNFT.transferFrom(alice, bob, 0);

        // Owner unpauses the contract
        vm.prank(owner);
        shipNFT.unpause();

        // Action can now proceed smoothly
        vm.prank(alice);
        shipNFT.transferFrom(alice, bob, 0);
        assertEq(shipNFT.ownerOf(0), bob);
    }
}