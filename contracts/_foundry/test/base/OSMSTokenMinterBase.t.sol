// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../../src/OSMSToken.sol";
import "../../src/OSMSTokenMinter.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title OSMSTokenMinterBase
 * @dev Prepares the testing environment for the OSMSTokenMinter contract,
 * deploying dependencies, granting roles, and implementing signature helpers.
 */
abstract contract OSMSTokenMinterBase is Test {
    using MessageHashUtils for bytes32;

    OSMSToken public token;
    OSMSTokenMinter public minter;

    // Keys and corresponding addresses
    uint256 public ownerPrivateKey = 0xA11CE;
    uint256 public signerPrivateKey = 0xB0B;
    uint256 public alicePrivateKey = 0xC001;
    uint256 public bobPrivateKey = 0xC002;

    address public owner;
    address public signer;
    address public alice;
    address public bob;
    address public treasury = address(0x9999);

    // Initial configuration limits
    uint256 public constant INITIAL_MAX_MINT = 100_000 * 10**18;
    uint256 public constant INITIAL_COOLDOWN = 1 hours;

    function setUp() public virtual {
        // Warp block.timestamp to 1 day to prevent low timestamp collisions (e.g. 1 < 0 + 3600)
        vm.warp(1 days);

        owner = vm.addr(ownerPrivateKey);
        signer = vm.addr(signerPrivateKey);
        alice = vm.addr(alicePrivateKey);
        bob = vm.addr(bobPrivateKey);

        // Labels for traces and debug logs
        vm.label(owner, "Owner");
        vm.label(signer, "Signer");
        vm.label(alice, "Alice");
        vm.label(bob, "Bob");
        vm.label(treasury, "Treasury");

        vm.startPrank(owner);
        // 1. Deploy the underlying ERC20 token
        token = new OSMSToken();

        // 2. Deploy the distribution minter contract
        minter = new OSMSTokenMinter(
            address(token),
            signer,
            treasury,
            0,                  // Initial cumulative minted
            INITIAL_MAX_MINT,
            INITIAL_COOLDOWN
        );

        // 3. Authorize the minter contract in the ERC20 token rules
        token.grantRole(token.MINTER_ROLE(), address(minter));
        vm.stopPrank();
    }

    /**
     * @dev Generates a cryptographically valid ECDSA claim signature for the minter contract.
     */
    function getTokenClaimSignature(
        uint256 privateKey,
        address user,
        uint256 totalAmount,
        bytes32 claimId,
        uint256 nonce,
        uint256 deadline
    ) public view returns (bytes memory) {
        bytes32 messageHash = keccak256(abi.encodePacked(
            address(minter),
            user,
            totalAmount,
            claimId,
            nonce,
            deadline
        ));
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, ethSignedMessageHash);
        return abi.encodePacked(r, s, v);
    }
}