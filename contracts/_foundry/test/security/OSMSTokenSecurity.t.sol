// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "../base/OSMSTokenBase.t.sol";

/**
 * @title OSMSTokenSecurity
 * @dev Threat modeling and access control validation tests targeting cap overflows,
 * malicious administrative bypasses, and state freezing mechanics.
 */
contract OSMSTokenSecurity is OSMSTokenBase {

    // Standard OpenZeppelin AccessControl and Pausable custom errors
    error AccessControlUnauthorizedAccount(address account, bytes32 neededRole);
    error EnforcedPause();

    /**
     * @dev Ensure unauthorized accounts cannot mint tokens.
     */
    function test_Revert_MintByNonMinter() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                AccessControlUnauthorizedAccount.selector,
                alice,
                MINTER_ROLE
            )
        );
        vm.prank(alice);
        token.mint(bob, 100 * 10**18);
    }

    /**
     * @dev Ensure non-admin accounts cannot define token caps.
     */
    function test_Revert_SetMaxSupplyByNonAdmin() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                AccessControlUnauthorizedAccount.selector,
                alice,
                DEFAULT_ADMIN_ROLE
            )
        );
        vm.prank(alice);
        token.setMaxSupply(1_000_000 * 10**18);
    }

    /**
     * @dev Ensure token mints reverting immediately once they exceed the defined cap.
     */
    function test_Revert_MintExceedingCap() public {
        uint256 maxSupply = 1000 * 10**18;

        vm.prank(owner);
        token.setMaxSupply(maxSupply);

        vm.startPrank(minter);
        token.mint(alice, 900 * 10**18);

        // Attempting to mint 101 more exceeds the 1000 maximum limit (900 + 101 = 1001)
        vm.expectRevert(CapExceeded.selector);
        token.mint(alice, 101 * 10**18);
        vm.stopPrank();
    }

    /**
     * @dev Ensure max supply is immutable once set.
     */
    function test_Revert_SetMaxSupplyTwice() public {
        vm.startPrank(owner);
        token.setMaxSupply(1_000_000 * 10**18);

        vm.expectRevert(CapAlreadySet.selector);
        token.setMaxSupply(2_000_000 * 10**18);
        vm.stopPrank();
    }

    /**
     * @dev Ensure setting max supply lower than current total circulating supply is rejected.
     */
    function test_Revert_SetMaxSupplyBelowCurrentSupply() public {
        uint256 currentSupply = 5000 * 10**18;

        vm.prank(minter);
        token.mint(alice, currentSupply);

        vm.expectRevert(NewCapBelowSupply.selector);
        vm.prank(owner);
        token.setMaxSupply(currentSupply - 1);
    }

    /**
     * @dev Verify pause breaks normal transfer & mint pathways and unpause restores them.
     */
    function test_PauseBlocksTransfersAndMints() public {
        uint256 amount = 500 * 10**18;

        vm.prank(minter);
        token.mint(alice, amount);

        // Non-admin attempting to pause must revert
        vm.expectRevert(
            abi.encodeWithSelector(
                AccessControlUnauthorizedAccount.selector,
                alice,
                DEFAULT_ADMIN_ROLE
            )
        );
        vm.prank(alice);
        token.pause();

        // Admin pauses the token transfers
        vm.prank(owner);
        token.pause();

        // Normal ERC20 transfers must revert while paused
        vm.expectRevert(EnforcedPause.selector);
        vm.prank(alice);
        token.transfer(bob, 100 * 10**18);

        // Standard mints also revert while paused as they utilize internal _update
        vm.expectRevert(EnforcedPause.selector);
        vm.prank(minter);
        token.mint(bob, 100 * 10**18);

        // Admin unpauses token transfers
        vm.prank(owner);
        token.unpause();

        // Action can now proceed smoothly
        vm.prank(alice);
        token.transfer(bob, 100 * 10**18);
        assertEq(token.balanceOf(bob), 100 * 10**18);
    }
}