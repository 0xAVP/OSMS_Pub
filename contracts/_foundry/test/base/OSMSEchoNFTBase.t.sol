// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../../src/OSMSEchoNFT.sol";
import "../../src/OSMSWLManager.sol";
import "../mocks/MockV3Aggregator.sol";

/**
 * @title OSMSEchoNFTBase
 * @dev Prepares the testing environment for OSMSEchoNFT, deploying the Chainlink oracle mock,
 * the Whitelist Manager, and establishing standard USD pricing states.
 */
abstract contract OSMSEchoNFTBase is Test {
    OSMSEchoNFT public echoNFT;
    OSMSWLManager public wlManager;
    MockV3Aggregator public mockPriceFeed;

    // Test actors
    address public owner = address(0x1);
    address public alice = address(0x2);
    address public bob = address(0x3);
    address public treasury = address(0x9999);

    // Initial constants
    uint256 public constant INITIAL_PRICE = 3000 * 10**8; // $3000 per ETH (8 decimals)
    string public constant SERVER_URI = "https://api.onesoulmanyships.com/echo";

    function setUp() public virtual {
        vm.label(owner, "Owner");
        vm.label(alice, "Alice");
        vm.label(bob, "Bob");
        vm.label(treasury, "Treasury");

        vm.startPrank(owner);
        // 1. Deploy Price Feed Mock with $3000 / ETH price
        mockPriceFeed = new MockV3Aggregator(8, int256(INITIAL_PRICE));

        // 2. Deploy EchoNFT
        echoNFT = new OSMSEchoNFT(address(mockPriceFeed), SERVER_URI, treasury);

        // 3. Deploy Whitelist Manager and link it
        // We use a dummy address for ShipNFT in this isolated setup
        wlManager = new OSMSWLManager(address(echoNFT), address(0xDEAF));
        echoNFT.setWhitelistManager(address(wlManager));
        vm.stopPrank();

        // Deal ETH to users
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
    }
}