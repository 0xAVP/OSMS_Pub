// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import {OSMSToken} from "../../src/OSMSToken.sol";
import {OSMSEchoNFT} from "../../src/OSMSEchoNFT.sol";
import {OSMSShipNFT} from "../../src/OSMSShipNFT.sol";
import {OSMSShipManager} from "../../src/OSMSShipManager.sol";
import {OSMSWLManager} from "../../src/OSMSWLManager.sol";
import "../mocks/MockV3Aggregator.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title OSMSShipManagerBase
 * @dev Deploys and links the complete OneSoulManyShips ecosystem:
 * ERC20 token, EchoNFT, ShipNFT, Whitelist Manager, and OSMSShipManager.
 * Automatically configures standard user assets and approvals for testing.
 */
abstract contract OSMSShipManagerBase is Test {
    using MessageHashUtils for bytes32;

    OSMSToken public token;
    OSMSEchoNFT public echoNFT;
    OSMSShipNFT public shipNFT;
    OSMSShipManager public shipManager;
    OSMSWLManager public wlManager;
    MockV3Aggregator public mockPriceFeed;

    // Keys and derived addresses
    uint256 public ownerPrivateKey = 0xA11CE;
    uint256 public signerPrivateKey = 0xB0B;
    uint256 public alicePrivateKey = 0xC001;
    uint256 public bobPrivateKey = 0xC002;

    address public owner;
    address public signer;
    address public alice;
    address public bob;
    address public treasury = address(0x9999);

    // Pricing and setup constants
    uint256 public constant INITIAL_PRICE_FEED = 3000 * 10**8; // $3000 / ETH
    string public constant SERVER_URI = "https://api.onesoulmanyships.com";

    function setUp() public virtual {
        owner = vm.addr(ownerPrivateKey);
        signer = vm.addr(signerPrivateKey);
        alice = vm.addr(alicePrivateKey);
        bob = vm.addr(bobPrivateKey);

        // Debug labels
        vm.label(owner, "Owner");
        vm.label(signer, "Signer");
        vm.label(alice, "Alice");
        vm.label(bob, "Bob");
        vm.label(treasury, "Treasury");

        // Fund accounts with ETH for transactions
        vm.deal(owner, 10 ether);
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);

        vm.startPrank(owner);
        // 1. Deploy Core Tokens & NFTs
        mockPriceFeed = new MockV3Aggregator(8, int256(INITIAL_PRICE_FEED));
        token = new OSMSToken();
        echoNFT = new OSMSEchoNFT(address(mockPriceFeed), SERVER_URI, treasury);
        shipNFT = new OSMSShipNFT(SERVER_URI);
        wlManager = new OSMSWLManager(address(echoNFT), address(shipNFT));

        // 2. Deploy the core Coordinator/Manager
        shipManager = new OSMSShipManager(
            address(shipNFT),
            signer,
            address(echoNFT),
            address(token),
            treasury
        );

        // 3. Connect dependencies and initialize state parameters
        echoNFT.setWhitelistManager(address(wlManager));
        shipNFT.setManager(address(shipManager));
        shipNFT.initializeShipTypes(); // Pre-registers types 0 to 7
        echoNFT.initializeEchoes();    // Pre-registers types 0 to 9

        vm.stopPrank();

        // 4. Pre-approve Alice to bypass standard gating restrictions
        // (She must own an EchoNFT and have payment token balances)
        _setupAliceForShipOperations();
    }

    /**
     * @dev Private setup routine giving Alice standard ownership parameters.
     */
    function _setupAliceForShipOperations() private {
        // Mint Echo ID 0 to Alice (requires USD price converting to ETH)
        uint256 priceInEth = echoNFT.usdToEth(1 * 10**18); // ID 0 costs $1
        vm.prank(alice);
        echoNFT.mintEcho{value: priceInEth}(0);

        // Alice now possesses an Echo NFT and is an Echo minter:
        // - echoNFT.hasAnyToken(alice) -> true
        // - echoNFT.isEchoMinter(alice) -> true

        // Grant Alice payment tokens
        vm.prank(owner);
        token.mint(alice, 100_000 * 10**18);

        // Alice approves the ShipManager contract to pull her payment tokens
        vm.prank(alice);
        token.approve(address(shipManager), type(uint256).max);
    }

    // ==========================================
    // Cryptographic Signature Helpers
    // ==========================================

    /**
     * @dev Generates standard ECDSA signatures for OSMSShipManager.mintShip
     */
    function getShipMintSignature(
        uint256 privateKey,
        address user,
        uint256 shipTypeId,
        uint256 nonce,
        uint256 deadline
    ) public pure returns (bytes memory) {
        bytes32 messageHash = keccak256(abi.encodePacked(user, shipTypeId, nonce, deadline));
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, ethSignedMessageHash);
        return abi.encodePacked(r, s, v);
    }

    /**
     * @dev Generates standard ECDSA signatures for OSMSShipManager.craftShip
     */
    function getShipCraftSignature(
        uint256 privateKey,
        address user,
        uint256 shipTypeId,
        bytes32 craftId,
        uint256 deadline
    ) public pure returns (bytes memory) {
        bytes32 messageHash = keccak256(abi.encodePacked(
            "CRAFT_SHIP",
            user,
            shipTypeId,
            craftId,
            deadline
        ));
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, ethSignedMessageHash);
        return abi.encodePacked(r, s, v);
    }
}