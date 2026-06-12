// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "../base/OSMSEchoNFTBase.t.sol";

/**
 * @title OSMSEchoNFTGas
 * @dev Validates mathematical conversion stability over fuzzing parameters
 * and profiles oracle calculation gas costs.
 */
contract OSMSEchoNFTGas is OSMSEchoNFTBase {

    /**
     * @dev Fuzzes oracle pricing variations to ensure usdToEth conversion never overflows
     * or causes division-by-zero panics. We use uint256 bounds for strict safety.
     */
    function testFuzz_UsdToEthConversion(uint256 usdAmount, uint256 oraclePrice) public {
        // Restricting inputs to secure bounds:
        // USD amounts between $1.00 and 100 billion USD to prevent rounding down to 0
        usdAmount = bound(usdAmount, 1 * 10**18, 10**11 * 10**18);
        // Oracle prices between $0.10 and $1,000,000.00 (with 8 decimals)
        oraclePrice = bound(oraclePrice, 10**7, 10**14);

        mockPriceFeed.updatePrice(int256(oraclePrice));

        uint256 calculatedEth = echoNFT.usdToEth(usdAmount);

        // Assert that the returned value is calculated mathematically and non-zero
        assertTrue(calculatedEth > 0);
    }

    /**
     * @dev Profiles precise execution gas taken by the internal price conversions.
     */
    function test_GasProfiling() public {
        vm.prank(owner);
        echoNFT.addEcho(30 * 10**18, 100, false);

        uint256 gasStart = gasleft();
        uint256 ethPrice = echoNFT.usdToEth(30 * 10**18);
        uint256 gasUsed = gasStart - gasleft();

        assertTrue(ethPrice > 0);
        emit log_named_uint("Gas cost for fetching and calculating USD to ETH price from Oracle", gasUsed);
    }
}