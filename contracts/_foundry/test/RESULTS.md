**$ forge test --match-contract OSMSToken**

Ran 5 tests for test/unit/OSMSTokenUnit.t.sol:OSMSTokenUnit
[PASS] test_BurnSuccess() (gas: 98148)
[PASS] test_InitialState() (gas: 42480)
[PASS] test_MintSuccess() (gas: 70451)
[PASS] test_SetMaxSupplySuccess() (gas: 65712)
[PASS] test_TotalBurnedTrackingViaBurn() (gas: 95745)
Suite result: ok. 5 passed; 0 failed; 0 skipped; finished in 1.99ms (2.55ms CPU time)

Ran 6 tests for test/security/OSMSTokenSecurity.t.sol:OSMSTokenSecurity
[PASS] test_PauseBlocksTransfersAndMints() (gas: 124208)
[PASS] test_Revert_MintByNonMinter() (gas: 17756)
[PASS] test_Revert_MintExceedingCap() (gas: 121501)
[PASS] test_Revert_SetMaxSupplyBelowCurrentSupply() (gas: 74513)
[PASS] test_Revert_SetMaxSupplyByNonAdmin() (gas: 15222)
[PASS] test_Revert_SetMaxSupplyTwice() (gas: 64120)
Suite result: ok. 6 passed; 0 failed; 0 skipped; finished in 2.07ms (3.05ms CPU time)

Ran 3 tests for test/gas/OSMSTokenGas.t.sol:OSMSTokenGas
[PASS] testFuzz_BurnTracking(uint256,uint256) (runs: 256, μ: 97954, ~: 99524)
[PASS] testFuzz_MintUnderCap(uint256,uint256) (runs: 256, μ: 121854, ~: 123192)
[PASS] test_GasProfiling() (gas: 131611)
Suite result: ok. 3 passed; 0 failed; 0 skipped; finished in 12.69ms (23.81ms CPU time)

[PASS] test_GasProfiling() (gas: 131611)
Suite result: ok. 3 passed; 0 failed; 0 skipped; finished in 12.69ms (23.81ms CPU time)

Ran 3 test suites in 15.90ms (16.74ms CPU time): 14 tests passed, 0 failed, 0 skipped (14 total tests)

----

**$ forge test --match-contract OSMSTokenMinter**

Ran 7 tests for test/security/OSMSTokenMinterSecurity.t.sol:OSMSTokenMinterSecurity
[PASS] test_Revert_ClaimCooldownNotMet() (gas: 207925)
[PASS] test_Revert_ClaimDoubleSpendReplay() (gas: 2142415)
[PASS] test_Revert_ClaimExceedingMaxAmount() (gas: 29277)
[PASS] test_Revert_ClaimExpiredDeadline() (gas: 25834)
[PASS] test_Revert_ClaimFuturisticDeadline() (gas: 26191)
[PASS] test_Revert_ClaimInvalidSignature() (gas: 116906)
[PASS] test_TimeLockedConstraintsUpdate() (gas: 96228)
Suite result: ok. 7 passed; 0 failed; 0 skipped; finished in 2.82ms (7.00ms CPU time)

Ran 4 tests for test/unit/OSMSTokenMinterUnit.t.sol:OSMSTokenMinterUnit
[PASS] test_ClaimTokensSuccess() (gas: 213554)
[PASS] test_EpochIncrease() (gas: 243191)
[PASS] test_GetMintingStatus() (gas: 199080)
[PASS] test_InitialState() (gas: 34198)
Suite result: ok. 4 passed; 0 failed; 0 skipped; finished in 2.81ms (4.51ms CPU time)

Ran 2 tests for test/gas/OSMSTokenMinterGas.t.sol:OSMSTokenMinterGas
[PASS] testFuzz_ClaimTokens(uint256) (runs: 256, μ: 205428, ~: 204776)
[PASS] test_GasProfiling() (gas: 197887)
Suite result: ok. 2 passed; 0 failed; 0 skipped; finished in 27.95ms (26.93ms CPU time)

Ran 3 test suites in 29.97ms (33.59ms CPU time): 13 tests passed, 0 failed, 0 skipped (13 total tests)

----

**$ forge test --match-contract OSMSWLManager**

Ran 5 tests for test/unit/OSMSWLManagerUnit.t.sol:OSMSWLManagerUnit
[PASS] test_AddAddressesToEchoWhitelistSuccess() (gas: 98411)
[PASS] test_AddAddressesToShipWhitelistSuccess() (gas: 53777)
[PASS] test_InitialState() (gas: 21316)
[PASS] test_RemoveAddressesFromEchoWhitelistSuccess() (gas: 70133)
[PASS] test_SetContractsSuccess() (gas: 26767)
Suite result: ok. 5 passed; 0 failed; 0 skipped; finished in 1.20ms (1.83ms CPU time)

Ran 5 tests for test/security/OSMSWLManagerSecurity.t.sol:OSMSWLManagerSecurity
[PASS] test_Revert_AddAddressesZeroAddress() (gas: 76166)
[PASS] test_Revert_AddAddressesZeroQuantity() (gas: 23915)
[PASS] test_Revert_NonOwnerModifications() (gas: 22281)
[PASS] test_Revert_UnauthorizedWLRecordCall() (gas: 52969)
[PASS] test_Revert_WLRecordNoClaimsLeft() (gas: 83491)
Suite result: ok. 5 passed; 0 failed; 0 skipped; finished in 1.24ms (1.73ms CPU time)

Ran 2 tests for test/gas/OSMSWLManagerGas.t.sol:OSMSWLManagerGas
[PASS] testFuzz_WLRecordIncrements(uint8) (runs: 256, μ: 467317, ~: 263461)
[PASS] test_GasProfiling_BatchAdd() (gas: 2652538)
Suite result: ok. 2 passed; 0 failed; 0 skipped; finished in 71.67ms (72.16ms CPU time)

Ran 3 test suites in 73.63ms (74.11ms CPU time): 12 tests passed, 0 failed, 0 skipped (12 total tests)

----

**$ forge test --match-contract OSMSEchoNFT**

Ran 5 tests for test/unit/OSMSEchoNFTUnit.t.sol:OSMSEchoNFTUnit
[PASS] test_InitialState() (gas: 31941)
[PASS] test_InitializeEchoesSuccess() (gas: 544619)
[PASS] test_MintEchoSuccess_PaidAndRefunded() (gas: 288153)
[PASS] test_MintEchoSuccess_Whitelist() (gas: 264369)
[PASS] test_UsdToEthMath() (gas: 22044)
Suite result: ok. 5 passed; 0 failed; 0 skipped; finished in 2.01ms (2.50ms CPU time)

Ran 7 tests for test/security/OSMSEchoNFTSecurity.t.sol:OSMSEchoNFTSecurity
[PASS] test_Revert_InsufficientPayment() (gas: 139284)
[PASS] test_Revert_MintLimitExceeded() (gas: 284030)
[PASS] test_Revert_MintNonExistentId() (gas: 19621)
[PASS] test_Revert_OracleInvalidPrice() (gas: 128342)
[PASS] test_Revert_PriceFeedStalenessThreshold() (gas: 137365)
[PASS] test_Revert_WhitelistOnlyBypass() (gas: 109602)
[PASS] test_Security_ZeroAmountTransferDoesNotIncrementUniqueTokens() (gas: 355760)
Suite result: ok. 7 passed; 0 failed; 0 skipped; finished in 2.04ms (3.53ms CPU time)

Ran 2 tests for test/gas/OSMSEchoNFTGas.t.sol:OSMSEchoNFTGas
[PASS] testFuzz_UsdToEthConversion(uint256,uint256) (runs: 256, μ: 31703, ~: 32073)
[PASS] test_GasProfiling() (gas: 105607)
Suite result: ok. 2 passed; 0 failed; 0 skipped; finished in 18.21ms (17.57ms CPU time)

Ran 3 test suites in 21.36ms (22.26ms CPU time): 14 tests passed, 0 failed, 0 skipped (14 total tests)

----

**$ forge test --match-contract OSMSShipNFT**

Ran 6 tests for test/security/OSMSShipNFTSecurity.t.sol:OSMSShipNFTSecurity
[PASS] test_PauseFreezesTransfers() (gas: 563570)
[PASS] test_Revert_AddShipTypeZeroPrice() (gas: 95590)
[PASS] test_Revert_MintNonExistentShipType() (gas: 427079)
[PASS] test_Revert_OnlyManagerMint() (gas: 14566)
[PASS] test_Revert_OnlyOwnerAdminFunctions() (gas: 20035)
[PASS] test_Revert_QueryNonExistentToken() (gas: 19635)
Suite result: ok. 6 passed; 0 failed; 0 skipped; finished in 1.49ms (2.09ms CPU time)

Ran 6 tests for test/unit/OSMSShipNFTUnit.t.sol:OSMSShipNFTUnit
[PASS] test_AddAndUpdateShipTypesSuccess() (gas: 122365)
[PASS] test_GetShipsByOwnerPagination() (gas: 1124036)
[PASS] test_InitialState() (gas: 43079)
[PASS] test_InitializeShipTypesSuccess() (gas: 425623)
[PASS] test_ManagerMintSuccess() (gas: 559639)
[PASS] test_TokenURIGeneration() (gas: 565558)
Suite result: ok. 6 passed; 0 failed; 0 skipped; finished in 2.10ms (3.58ms CPU time)

Ran 2 tests for test/gas/OSMSShipNFTGas.t.sol:OSMSShipNFTGas
[PASS] testFuzz_PaginationParameters(uint256,uint256) (runs: 256, μ: 1626652, ~: 1624403)
[PASS] test_GasProfiling() (gas: 555838)
Suite result: ok. 2 passed; 0 failed; 0 skipped; finished in 34.44ms (33.80ms CPU time)

Ran 3 test suites in 37.20ms (38.03ms CPU time): 14 tests passed, 0 failed, 0 skipped (14 total tests)

----

**$ forge test --match-contract OSMSShipManager**

Ran 8 tests for test/security/OSMSShipManagerSecurity.t.sol:OSMSShipManagerSecurity
[PASS] test_Revert_AdminFunctionsAccessControl() (gas: 20590)
[PASS] test_Revert_CraftOnlyMintable() (gas: 41021)
[PASS] test_Revert_CraftSignatureAlreadyUsed() (gas: 259660)
[PASS] test_Revert_MintExpiredDeadline() (gas: 48336)
[PASS] test_Revert_MintInvalidSignature() (gas: 147590)
[PASS] test_Revert_MintNonExistentShipType() (gas: 40082)
[PASS] test_Revert_MintOnlyCraftable() (gas: 40627)
[PASS] test_Revert_NoEchoOwned() (gas: 48271)
Suite result: ok. 8 passed; 0 failed; 0 skipped; finished in 3.29ms (5.80ms CPU time)

Ran 4 tests for test/unit/OSMSShipManagerUnit.t.sol:OSMSShipManagerUnit
[PASS] test_CraftShipSuccess() (gas: 371203)
[PASS] test_InitialState() (gas: 32607)
[PASS] test_MintShipSuccess_FreeNebular() (gas: 233325)
[PASS] test_MintShipSuccess_Paid() (gas: 318240)
Suite result: ok. 4 passed; 0 failed; 0 skipped; finished in 3.70ms (5.14ms CPU time)

Ran 2 tests for test/gas/OSMSShipManagerGas.t.sol:OSMSShipManagerGas
[PASS] testFuzz_MintShipPaid(uint256) (runs: 256, μ: 301293, ~: 301533)
[PASS] test_GasProfiling() (gas: 736741)
Suite result: ok. 2 passed; 0 failed; 0 skipped; finished in 50.85ms (51.14ms CPU time)

Ran 3 test suites in 54.01ms (57.84ms CPU time): 14 tests passed, 0 failed, 0 skipped (14 total tests)
