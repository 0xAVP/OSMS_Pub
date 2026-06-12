// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "../base/OSMSShipManagerBase.t.sol";

/**
 * @title OSMSShipManagerSecurity
 * @dev Targets signature replay vectors, invalid caller gating, deadline expirations,
 * and unauthorized administrative function calls.
 */
contract OSMSShipManagerSecurity is OSMSShipManagerBase {

    // Custom errors defined globally in OSMSShipManager
    error InvalidDeadline();
    error InvalidSignature();
    error ShipTypeDoesNotExist();
    error ShipTypeNotActive();
    error NoEchoOwned();
    error InsufficientTokenBalance();
    error InsufficientAllowance();
    error InvalidCraftingSignature();
    error SignatureAlreadyUsed();
    error ShipCanOnlyBeCrafted(uint256 shipTypeId);
    error ShipCanOnlyBeMinted(uint256 shipTypeId);

    // Standard OpenZeppelin Ownable custom error
    error OwnableUnauthorizedAccount(address account);

    /**
     * @dev Ensure attempts to mint non-existent ship types revert.
     */
    function test_Revert_MintNonExistentShipType() public {
        uint256 deadline = block.timestamp + 1 minutes;
        bytes memory signature = getShipMintSignature(signerPrivateKey, alice, 99, 0, deadline);

        vm.expectRevert(ShipTypeDoesNotExist.selector);
        vm.prank(alice);
        shipManager.mintShip(99, deadline, signature);
    }

    /**
     * @dev Ensure public minting fails for craftable-only ship types.
     */
    function test_Revert_MintOnlyCraftable() public {
        uint256 shipTypeId = 7; // Type 7: craftableOnly = true
        uint256 deadline = block.timestamp + 1 minutes;
        bytes memory signature = getShipMintSignature(signerPrivateKey, alice, shipTypeId, 0, deadline);

        vm.expectRevert(
            abi.encodeWithSelector(ShipCanOnlyBeCrafted.selector, shipTypeId)
        );
        vm.prank(alice);
        shipManager.mintShip(shipTypeId, deadline, signature);
    }

    /**
     * @dev Ensure crafting fails for standard public-minting ship types.
     */
    function test_Revert_CraftOnlyMintable() public {
        uint256 shipTypeId = 1; // Type 1: craftableOnly = false
        uint256 deadline = block.timestamp + 1 minutes;
        bytes32 craftId = keccak256("dummy_craft");
        bytes memory signature = getShipCraftSignature(signerPrivateKey, alice, shipTypeId, craftId, deadline);

        vm.expectRevert(
            abi.encodeWithSelector(ShipCanOnlyBeMinted.selector, shipTypeId)
        );
        vm.prank(alice);
        shipManager.craftShip(shipTypeId, craftId, deadline, signature);
    }

    /**
     * @dev Ensure users cannot mint ships without owning an Echo NFT.
     */
    function test_Revert_NoEchoOwned() public {
        // Bob does not own any Echo NFT
        uint256 shipTypeId = 1;
        uint256 deadline = block.timestamp + 1 minutes;
        bytes memory signature = getShipMintSignature(signerPrivateKey, bob, shipTypeId, 0, deadline);

        vm.expectRevert(NoEchoOwned.selector);
        vm.prank(bob);
        shipManager.mintShip(shipTypeId, deadline, signature);
    }

    /**
     * @dev Ensure minting with an expired or futuristic deadline reverts.
     */
    function test_Revert_MintExpiredDeadline() public {
        uint256 shipTypeId = 1;
        uint256 deadline = block.timestamp - 1 seconds; // Expired
        bytes memory signature = getShipMintSignature(signerPrivateKey, alice, shipTypeId, 0, deadline);

        vm.expectRevert(InvalidDeadline.selector);
        vm.prank(alice);
        shipManager.mintShip(shipTypeId, deadline, signature);
    }

    /**
     * @dev Verify tampered parameters or unauthorized signers fail signature validation.
     */
    function test_Revert_MintInvalidSignature() public {
        uint256 shipTypeId = 1;
        uint256 deadline = block.timestamp + 1 minutes;

        // 1. Signed by Alice instead of the authorized Signer
        bytes memory signatureFromAlice = getShipMintSignature(alicePrivateKey, alice, shipTypeId, 0, deadline);
        vm.expectRevert(InvalidSignature.selector);
        vm.prank(alice);
        shipManager.mintShip(shipTypeId, deadline, signatureFromAlice);

        // 2. Tampered Ship Type (Signed for Type 1, but trying to mint Type 2)
        bytes memory signatureForType1 = getShipMintSignature(signerPrivateKey, alice, 1, 0, deadline);
        vm.expectRevert(InvalidSignature.selector);
        vm.prank(alice);
        shipManager.mintShip(2, deadline, signatureForType1);
    }

    /**
     * @dev Ensure crafting signatures cannot be reused (replay attack protection).
     */
    function test_Revert_CraftSignatureAlreadyUsed() public {
        vm.prank(owner);
        shipNFT.addShipType(0, 0, true, true); // ID 8, craftPrice 0, craftableOnly = true

        uint256 shipTypeId = 8;
        bytes32 craftId = keccak256("replay_craft");
        uint256 deadline = block.timestamp + 1 minutes;

        bytes memory signature = getShipCraftSignature(
            signerPrivateKey,
            alice,
            shipTypeId,
            craftId,
            deadline
        );

        // First execution succeeds
        vm.prank(alice);
        shipManager.craftShip(shipTypeId, craftId, deadline, signature);

        // Second execution with the exact same parameters and signature must fail
        vm.expectRevert(SignatureAlreadyUsed.selector);
        vm.prank(alice);
        shipManager.craftShip(shipTypeId, craftId, deadline, signature);
    }

    /**
     * @dev Ensure standard user attempts to bypass owner-only settings fail.
     */
    function test_Revert_AdminFunctionsAccessControl() public {
        vm.expectRevert(
            abi.encodeWithSelector(OwnableUnauthorizedAccount.selector, alice)
        );
        vm.prank(alice);
        shipManager.setSigner(alice);

        vm.expectRevert(
            abi.encodeWithSelector(OwnableUnauthorizedAccount.selector, alice)
        );
        vm.prank(alice);
        shipManager.setTreasury(alice);
    }
}