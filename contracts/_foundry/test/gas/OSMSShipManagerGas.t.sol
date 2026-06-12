// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "../base/OSMSShipManagerBase.t.sol";

/**
 * @title OSMSShipManagerGas
 * @dev Measures integration execution gas costs and validates mathematical stability.
 */
contract OSMSShipManagerGas is OSMSShipManagerBase {

    /**
     * @dev Fuzzes timing deadlines to ensure cryptographic verification
     * is structurally stable under any parameters, utilizing real contract nonces.
     */
    function testFuzz_MintShipPaid(uint256 timeOffset) public {
        uint256 shipTypeId = 1;

        // Bind timeOffset to a safe margin within 5-minute DEADLINE_LIMIT
        timeOffset = bound(timeOffset, 0, 4 minutes);
        uint256 deadline = block.timestamp + timeOffset;

        // Retrieve current actual nonce from contract state instead of using fragile vm.store hacks
        uint256 currentNonce = shipManager.getNonce(alice);

        bytes memory signature = getShipMintSignature(
            signerPrivateKey,
            alice,
            shipTypeId,
            currentNonce,
            deadline
        );

        vm.prank(alice);
        shipManager.mintShip(shipTypeId, deadline, signature);

        assertEq(shipNFT.ownerOf(0), alice);
        assertEq(shipManager.getNonce(alice), currentNonce + 1);
    }

    /**
     * @dev Measures precise gas taken for standard, free and crafting actions.
     */
    function test_GasProfiling() public {
        // We add a custom ship type with craftPrice to test payment processing during crafting
        vm.prank(owner);
        shipNFT.addShipType(0, 100 * 10**18, true, true); // ID 8, craftPrice 100, craftableOnly = true

        uint256 deadline = block.timestamp + 1 minutes;

        // 1. Paid Mint Gas Profile
        bytes memory signature1 = getShipMintSignature(signerPrivateKey, alice, 1, 0, deadline);
        uint256 gasStart = gasleft();
        vm.prank(alice);
        shipManager.mintShip(1, deadline, signature1);
        uint256 gasUsedPaidMint = gasStart - gasleft();
        emit log_named_uint("Gas cost for Paid Mint (includes 50/50 burn split processing)", gasUsedPaidMint);

        // 2. Free Nebular Mint Gas Profile
        bytes memory signature2 = getShipMintSignature(signerPrivateKey, alice, 0, 1, deadline);
        gasStart = gasleft();
        vm.prank(alice);
        shipManager.mintShip(0, deadline, signature2);
        uint256 gasUsedFreeMint = gasStart - gasleft();
        emit log_named_uint("Gas cost for Free Nebular Mint (no payment token processed)", gasUsedFreeMint);

        // 3. Paid Crafting Gas Profile
        bytes32 craftId = keccak256("gas_craft_id");
        bytes memory signature3 = getShipCraftSignature(signerPrivateKey, alice, 8, craftId, deadline);
        gasStart = gasleft();
        vm.prank(alice);
        shipManager.craftShip(8, craftId, deadline, signature3);
        uint256 gasUsedCraft = gasStart - gasleft();
        emit log_named_uint("Gas cost for Paid Craft (includes signature tracking and fee split)", gasUsedCraft);
    }
}