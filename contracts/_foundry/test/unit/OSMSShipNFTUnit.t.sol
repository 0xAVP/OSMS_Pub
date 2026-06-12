// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "../base/OSMSShipNFTBase.t.sol";

/**
 * @title OSMSShipNFTUnit
 * @dev Validates successful initialization, custom ship additions, ERC721 minting,
 * URI generation, and pagination state views.
 */
contract OSMSShipNFTUnit is OSMSShipNFTBase {

    /**
     * @dev Verify initial ERC721 metadata and default variables are set correctly.
     */
    function test_InitialState() public view {
        assertEq(shipNFT.name(), "ShipNFT");
        assertEq(shipNFT.symbol(), "SHIP");
        assertEq(shipNFT.serverURI(), SERVER_URI);
        assertEq(shipNFT.manager(), manager);
        assertEq(shipNFT.owner(), owner);
        assertEq(shipNFT.shipTypeCount(), 0);
    }

    /**
     * @dev Verify initializeShipTypes registers exactly 8 predefined types.
     */
    function test_InitializeShipTypesSuccess() public {
        vm.prank(owner);
        shipNFT.initializeShipTypes();

        assertEq(shipNFT.shipTypeCount(), 8);

        // Check Type 0: MintPrice = 0.0004 ether, CraftPrice = 0, Active = true, CraftableOnly = false
        (uint256 mintPrice, uint256 craftPrice, bool isActive, bool craftableOnly) = shipNFT.shipTypes(0);
        assertEq(mintPrice, 0.0004 ether);
        assertEq(craftPrice, 0);
        assertTrue(isActive);
        assertFalse(craftableOnly);

        // Check Type 7: MintPrice = 0, CraftPrice = 0, Active = true, CraftableOnly = true
        (mintPrice, craftPrice, isActive, craftableOnly) = shipNFT.shipTypes(7);
        assertEq(mintPrice, 0);
        assertEq(craftPrice, 0);
        assertTrue(isActive);
        assertTrue(craftableOnly);
    }

    /**
     * @dev Verify owner can add and update custom ship types.
     */
    function test_AddAndUpdateShipTypesSuccess() public {
        vm.startPrank(owner);
        // Add custom ship type
        shipNFT.addShipType(1 ether, 0.5 ether, true, false);
        assertEq(shipNFT.shipTypeCount(), 1);

        (uint256 mintPrice, uint256 craftPrice, bool isActive, bool craftableOnly) = shipNFT.shipTypes(0);
        assertEq(mintPrice, 1 ether);
        assertEq(craftPrice, 0.5 ether);
        assertTrue(isActive);
        assertFalse(craftableOnly);

        // Update custom ship type
        shipNFT.updateShipType(0, 2 ether, 1 ether, false, true);
        (mintPrice, craftPrice, isActive, craftableOnly) = shipNFT.shipTypes(0);
        assertEq(mintPrice, 2 ether);
        assertEq(craftPrice, 1 ether);
        assertFalse(isActive);
        assertTrue(craftableOnly);
        vm.stopPrank();
    }

    /**
     * @dev Verify the authorized manager can mint a ship.
     */
    function test_ManagerMintSuccess() public {
        vm.prank(owner);
        shipNFT.initializeShipTypes();

        // Manager mints ship of type 3 to Alice
        vm.prank(manager);
        uint256 tokenId = shipNFT.managerMint(alice, 3);

        assertEq(tokenId, 0); // First token ID is 0
        assertEq(shipNFT.ownerOf(0), alice);
        assertEq(shipNFT.getShipTypeId(0), 3);
        assertEq(shipNFT.balanceOf(alice), 1);
    }

    /**
     * @dev Verify URI string concatenation is formatted correctly.
     */
    function test_TokenURIGeneration() public {
        vm.prank(owner);
        shipNFT.initializeShipTypes();

        vm.prank(manager);
        shipNFT.managerMint(alice, 1);

        string memory expectedURI = string(abi.encodePacked(SERVER_URI, "/0"));
        assertEq(shipNFT.tokenURI(0), expectedURI);
    }

    /**
     * @dev Verify getShipsByOwner pagination and slicing rules.
     */
    function test_GetShipsByOwnerPagination() public {
        vm.prank(owner);
        shipNFT.initializeShipTypes();

        // Mint 5 ships to Alice with varying types: 0, 1, 2, 3, 4
        vm.startPrank(manager);
        for (uint256 i = 0; i < 5; i++) {
            shipNFT.managerMint(alice, i);
        }
        vm.stopPrank();

        // Slice 1: offset=0, limit=3 (Should return tokens 0,1,2 and types 0,1,2)
        (uint256[] memory tokenIds1, uint256[] memory typeIds1) = shipNFT.getShipsByOwner(alice, 0, 3);
        assertEq(tokenIds1.length, 3);
        assertEq(tokenIds1[0], 0);
        assertEq(typeIds1[0], 0);
        assertEq(tokenIds1[2], 2);
        assertEq(typeIds1[2], 2);

        // Slice 2: offset=3, limit=3 (Should return remaining 2 tokens: 3,4 and types 3,4)
        (uint256[] memory tokenIds2, uint256[] memory typeIds2) = shipNFT.getShipsByOwner(alice, 3, 3);
        assertEq(tokenIds2.length, 2);
        assertEq(tokenIds2[0], 3);
        assertEq(typeIds2[0], 3);

        // Slice 3: offset=10 (out of bounds, should return empty arrays)
        (uint256[] memory tokenIds3, uint256[] memory typeIds3) = shipNFT.getShipsByOwner(alice, 10, 5);
        assertEq(tokenIds3.length, 0);
        assertEq(typeIds3.length, 0);
    }
}