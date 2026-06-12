// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "../base/OSMSWLManagerBase.t.sol";

/**
 * @title OSMSWLManagerGas
 * @dev Quantifies gas consumption of large batch operations and fuzzes claim allocation bounds.
 */
contract OSMSWLManagerGas is OSMSWLManagerBase {

    /**
     * @dev Fuzzes claims record tracking to ensure limits decrement correctly under random inputs.
     */
    function testFuzz_WLRecordIncrements(uint8 allowedQty) public {
        // Quantities bound between 1 and 255 to maintain realistic scenarios
        vm.assume(allowedQty > 0);

        address[] memory users = new address[](1);
        users[0] = alice;

        vm.prank(owner);
        wlManager.addAddressesToEchoWhitelist(1, users, allowedQty);

        // Increment claims to the maximum limit from the authorized NFT contract
        vm.startPrank(mockEchoNFT);
        for (uint256 i = 0; i < allowedQty; i++) {
            wlManager.recordEchoClaim(1, alice);
        }
        vm.stopPrank();

        // Check and confirm user's allocations are exhausted
        assertFalse(wlManager.isWhitelistedForEcho(1, alice));

        (uint256 allowed, uint256 claimed) = wlManager.getEchoClaimStatus(1, alice);
        assertEq(allowed, allowedQty);
        assertEq(claimed, allowedQty);
    }

    /**
     * @dev Measures gas consumption differences for small and large whitelist batch inserts.
     */
    function test_GasProfiling_BatchAdd() public {
        uint256 batchSize = 100;
        address[] memory users = new address[](batchSize);

        for (uint256 i = 0; i < batchSize; i++) {
            users[i] = address(uint160(0x1000 + i));
        }

        uint256 gasStart = gasleft();
        vm.prank(owner);
        wlManager.addAddressesToEchoWhitelist(1, users, 1);
        uint256 gasUsed = gasStart - gasleft();

        emit log_named_uint("Gas cost for adding a batch of 100 addresses to whitelist", gasUsed);
    }
}