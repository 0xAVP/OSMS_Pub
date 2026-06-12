// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "../base/OSMSTokenBase.t.sol";

/**
 * @title OSMSTokenUnit
 * @dev Functional unit tests validating success pathways for token supply adjustments,
 * custom burns tracking, and administrative parameters initialization.
 */
contract OSMSTokenUnit is OSMSTokenBase {

    /**
     * @dev Validate initial states, contract metadata, and default roles configuration.
     */
    function test_InitialState() public view {
        assertEq(token.name(), "OneSoulManyShips");
        assertEq(token.symbol(), "OSMS");
        assertTrue(token.hasRole(DEFAULT_ADMIN_ROLE, owner));
        assertTrue(token.hasRole(MINTER_ROLE, owner));
        assertTrue(token.hasRole(MINTER_ROLE, minter));
        assertEq(token.totalBurned(), 0);
        assertFalse(token.isCapSet());
    }

    /**
     * @dev Verify authorized minter can mint tokens to specified addresses.
     */
    function test_MintSuccess() public {
        uint256 mintAmount = 1000 * 10**18;

        vm.prank(minter);
        token.mint(alice, mintAmount);

        assertEq(token.balanceOf(alice), mintAmount);
        assertEq(token.totalSupply(), mintAmount);
    }

    /**
     * @dev Verify standard users can burn their tokens.
     */
    function test_BurnSuccess() public {
        uint256 mintAmount = 1000 * 10**18;
        uint256 burnAmount = 400 * 10**18;

        vm.prank(minter);
        token.mint(alice, mintAmount);

        vm.prank(alice);
        token.burn(burnAmount);

        assertEq(token.balanceOf(alice), mintAmount - burnAmount);
        assertEq(token.totalSupply(), mintAmount - burnAmount);
    }

    /**
     * @dev Verify that the overridden internal _update function properly tracks
     * total cumulative burned tokens when transfers target the address(0).
     */
    function test_TotalBurnedTrackingViaBurn() public {
        uint256 mintAmount = 1000 * 10**18;
        uint256 burnAmount = 300 * 10**18;

        vm.prank(minter);
        token.mint(alice, mintAmount);

        vm.prank(alice);
        token.burn(burnAmount);

        assertEq(token.totalBurned(), burnAmount);
    }

    /**
     * @dev Verify the admin can establish a global maximum supply cap.
     */
    function test_SetMaxSupplySuccess() public {
        uint256 maxSupply = 10_000_000 * 10**18;

        // Expect event to be emitted
        vm.expectEmit(true, true, true, true);
        emit OSMSToken.MaxSupplySet(maxSupply);

        vm.prank(owner);
        token.setMaxSupply(maxSupply);

        assertTrue(token.isCapSet());
        assertEq(token.maxSupply(), maxSupply);
    }
}