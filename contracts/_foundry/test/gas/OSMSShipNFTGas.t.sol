// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "../base/OSMSShipNFTBase.t.sol";

/**
 * @title OSMSShipNFTGas
 * @dev Validates pagination boundaries via fuzzing and profiles mint and transfer gas.
 */
contract OSMSShipNFTGas is OSMSShipNFTBase {

    /**
     * @dev Fuzzes pagination indices to ensure getShipsByOwner never causes out-of-bounds panics.
     */
    function testFuzz_PaginationParameters(uint256 offset, uint256 limit) public {
        vm.prank(owner);
        shipNFT.initializeShipTypes();

        // Mint 10 ships to Alice
        vm.startPrank(manager);
        for (uint256 i = 0; i < 10; i++) {
            shipNFT.managerMint(alice, 0);
        }
        vm.stopPrank();

        // Execute query under fuzzed inputs
        (uint256[] memory tokenIds, uint256[] memory typeIds) = shipNFT.getShipsByOwner(alice, offset, limit);

        // Assertions verifying that outputs do not exceed the actual balance
        assertTrue(tokenIds.length <= 10);
        assertEq(tokenIds.length, typeIds.length);
    }

    /**
     * @dev Measures precise gas taken for minting and transferring actions.
     */
    function test_GasProfiling() public {
        vm.prank(owner);
        shipNFT.initializeShipTypes();

        // Profile Manager Mint gas
        uint256 gasStart = gasleft();
        vm.prank(manager);
        shipNFT.managerMint(alice, 0);
        uint256 gasUsedMint = gasStart - gasleft();
        emit log_named_uint("Gas cost for managerMint (ERC721Enumerable + Pausable)", gasUsedMint);

        // Profile Transfer gas
        gasStart = gasleft();
        vm.prank(alice);
        shipNFT.transferFrom(alice, bob, 0);
        uint256 gasUsedTransfer = gasStart - gasleft();
        emit log_named_uint("Gas cost for transferFrom (ERC721Enumerable + Pausable)", gasUsedTransfer);
    }
}