// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../../src/OSMSShipNFT.sol";

/**
 * @title OSMSShipNFTBase
 * @dev Prepares the isolated testing environment for OSMSShipNFT.
 * Configures mock roles for Owner, Manager, and standard user test accounts.
 */
abstract contract OSMSShipNFTBase is Test {
    OSMSShipNFT public shipNFT;

    // Test actors
    address public owner = address(0x1);
    address public manager = address(0x2);
    address public alice = address(0x3);
    address public bob = address(0x4);

    string public constant SERVER_URI = "https://api.onesoulmanyships.com/ship";

    function setUp() public virtual {
        vm.label(owner, "Owner");
        vm.label(manager, "Manager");
        vm.label(alice, "Alice");
        vm.label(bob, "Bob");

        // Deploy the ShipNFT contract as the owner
        vm.startPrank(owner);
        shipNFT = new OSMSShipNFT(SERVER_URI);

        // Explicitly set our mock manager address
        shipNFT.setManager(manager);
        vm.stopPrank();
    }
}