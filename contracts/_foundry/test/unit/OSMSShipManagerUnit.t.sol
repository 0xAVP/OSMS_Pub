// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "../base/OSMSShipManagerBase.t.sol";

/**
 * @title OSMSShipManagerUnit
 * @dev Validates successful paid ship minting, free Nebular claims,
 * and crafting logic (incorporating payment splits) under happy path configurations.
 */
contract OSMSShipManagerUnit is OSMSShipManagerBase {

    /**
     * @dev Verify deployment integration parameters.
     */
    function test_InitialState() public view {
        assertEq(address(shipManager.nftContract()), address(shipNFT));
        assertEq(address(shipManager.echoNFT()), address(echoNFT));
        assertEq(address(shipManager.paymentToken()), address(token));
        assertEq(shipManager.signer(), signer);
        assertEq(shipManager.treasury(), treasury);
    }

    /**
     * @dev Verify a standard paid mint splits the fee (50% burned, 50% sent to treasury).
     */
    function test_MintShipSuccess_Paid() public {
        // Ship Type 1: MintPrice = 0.0004 ether (4 * 10^14 tokens), craftableOnly = false
        uint256 shipTypeId = 1;
        uint256 mintPrice = 0.0004 ether;
        uint256 deadline = block.timestamp + 1 minutes;
        uint256 nonce = 0;

        bytes memory signature = getShipMintSignature(
            signerPrivateKey,
            alice,
            shipTypeId,
            nonce,
            deadline
        );

        uint256 aliceBalanceBefore = token.balanceOf(alice);
        uint256 treasuryBalanceBefore = token.balanceOf(treasury);
        uint256 tokenSupplyBefore = token.totalSupply();

        vm.expectEmit(true, true, true, true);
        emit OSMSShipManager.ShipMinted(alice, 0, shipTypeId);

        vm.prank(alice);
        shipManager.mintShip(shipTypeId, deadline, signature);

        // Check ship ownership and mapping
        assertEq(shipNFT.ownerOf(0), alice);
        assertEq(shipNFT.getShipTypeId(0), shipTypeId);

        // Check fee distribution: 50% burned, 50% sent to treasury
        uint256 expectedBurn = mintPrice * 50 / 100;
        uint256 expectedTreasury = mintPrice - expectedBurn;

        assertEq(token.balanceOf(alice), aliceBalanceBefore - mintPrice);
        assertEq(token.balanceOf(treasury), treasuryBalanceBefore + expectedTreasury);
        assertEq(token.totalSupply(), tokenSupplyBefore - expectedBurn);
        assertEq(shipManager.getNonce(alice), 1);
    }

    /**
     * @dev Verify holding an Echo allows claiming a Nebular (ID 0) for free.
     */
    function test_MintShipSuccess_FreeNebular() public {
        uint256 shipTypeId = 0; // Nebular ship type
        uint256 deadline = block.timestamp + 1 minutes;
        uint256 nonce = 0;

        bytes memory signature = getShipMintSignature(
            signerPrivateKey,
            alice,
            shipTypeId,
            nonce,
            deadline
        );

        uint256 aliceBalanceBefore = token.balanceOf(alice);

        // Alice mints Nebular (ID 0) for free
        vm.prank(alice);
        shipManager.mintShip(shipTypeId, deadline, signature);

        // Verify no payment tokens were taken from Alice
        assertEq(token.balanceOf(alice), aliceBalanceBefore);
        assertTrue(shipNFT.hasMintedFreeNebular(alice));
        assertEq(shipNFT.ownerOf(0), alice);
    }

    /**
     * @dev Verify crafting (for craftableOnly ships) works and charges craftPrice correctly.
     */
    function test_CraftShipSuccess() public {
        // We add a custom ship type with craftPrice to test payment processing during crafting
        vm.prank(owner);
        shipNFT.addShipType(0, 1000 * 10**18, true, true); // ID 8, craftPrice 1000, craftableOnly = true

        uint256 shipTypeId = 8;
        uint256 craftPrice = 1000 * 10**18;
        bytes32 craftId = keccak256("craft_id_01");
        uint256 deadline = block.timestamp + 1 minutes;

        bytes memory signature = getShipCraftSignature(
            signerPrivateKey,
            alice,
            shipTypeId,
            craftId,
            deadline
        );

        uint256 aliceBalanceBefore = token.balanceOf(alice);
        uint256 treasuryBalanceBefore = token.balanceOf(treasury);
        uint256 tokenSupplyBefore = token.totalSupply();

        vm.expectEmit(true, true, true, true);
        emit OSMSShipManager.ShipCrafted(alice, 0, shipTypeId, craftId);

        vm.prank(alice);
        shipManager.craftShip(shipTypeId, craftId, deadline, signature);

        assertEq(shipNFT.ownerOf(0), alice);
        assertEq(shipNFT.getShipTypeId(0), shipTypeId);

        // Validate 50/50 fee split
        uint256 expectedBurn = craftPrice * 50 / 100;
        uint256 expectedTreasury = craftPrice - expectedBurn;

        assertEq(token.balanceOf(alice), aliceBalanceBefore - craftPrice);
        assertEq(token.balanceOf(treasury), treasuryBalanceBefore + expectedTreasury);
        assertEq(token.totalSupply(), tokenSupplyBefore - expectedBurn);
        assertTrue(shipManager.usedSignatures(keccak256(abi.encodePacked(
            "CRAFT_SHIP",
            alice,
            shipTypeId,
            craftId,
            deadline
        ))));
    }
}