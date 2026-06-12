// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../../src/OSMSToken.sol";

/**
 * @title OSMSTokenBase
 * @dev Base setup for OSMSToken testing. Deploys only the token contract
 * and configures essential access control roles for isolated unit and security tests.
 */
abstract contract OSMSTokenBase is Test {
    OSMSToken public token;

    // Test actors
    address public owner = address(0x1);
    address public minter = address(0x2);
    address public alice = address(0x3);
    address public bob = address(0x4);

    // Keccak256 constants for AccessControl
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;

    function setUp() public virtual {
        // Deploy contract as the owner
        vm.startPrank(owner);
        token = new OSMSToken();

        // Constructor grants MINTER_ROLE and DEFAULT_ADMIN_ROLE to the deployer (owner)
        // We explicitly grant MINTER_ROLE to the secondary 'minter' address for clean test separation
        token.grantRole(MINTER_ROLE, minter);
        vm.stopPrank();

        // Label addresses for clear console output trace parsing
        vm.label(owner, "Owner");
        vm.label(minter, "Minter");
        vm.label(alice, "Alice");
        vm.label(bob, "Bob");
    }
}