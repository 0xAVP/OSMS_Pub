// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/**
 * @title MockV3Aggregator
 * @dev Mock contract to simulate Chainlink's AggregatorV3Interface behavior.
 * Allows manual updates to price and timestamps to test edge cases like staleness.
 */
contract MockV3Aggregator {
    uint8 public decimals;
    int256 public latestPrice;
    uint256 public updatedAt;

    constructor(uint8 _decimals, int256 _initialPrice) {
        decimals = _decimals;
        latestPrice = _initialPrice;
        updatedAt = block.timestamp;
    }

    function updatePrice(int256 _newPrice) external {
        latestPrice = _newPrice;
        updatedAt = block.timestamp;
    }

    function updateTimestamp(uint256 _timestamp) external {
        updatedAt = _timestamp;
    }

    function latestRoundData()
    external
    view
    returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAtTimestamp,
        uint80 answeredInRound
    )
    {
        return (1, latestPrice, block.timestamp, updatedAt, 1);
    }
}