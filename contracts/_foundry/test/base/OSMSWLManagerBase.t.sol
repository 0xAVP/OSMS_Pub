// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../../src/OSMSWLManager.sol";

/**
 * @title OSMSWLManagerBase
 * @dev Prepares the isolated testing environment for OSMSWLManager.
 * Employs static test addresses representing the authorized NFT caller contracts.
 */
abstract contract OSMSWLManagerBase is Test {
    OSMSWLManager public wlManager;

    // Test actors
    address public owner = address(0x1);
    address public alice = address(0x2);
    address public bob = address(0x3);
    address public charlie = address(0x4);

    // Static addresses simulating target NFT contracts
    address public mockEchoNFT = address(0xECE0);
    address public mockShipNFT = address(0x5419);

    function setUp() public virtual {
        vm.label(owner, "Owner");
        vm.label(alice, "Alice");
        vm.label(bob, "Bob");
        vm.label(charlie, "Charlie");
        vm.label(mockEchoNFT, "Mock EchoNFT");
        vm.label(mockShipNFT, "Mock ShipNFT");

        // Deploy the whitelist manager as the owner
        vm.startPrank(owner);
        wlManager = new OSMSWLManager(mockEchoNFT, mockShipNFT);
        vm.stopPrank();
    }
}