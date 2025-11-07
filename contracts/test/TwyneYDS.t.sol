// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Test} from "forge-std/Test.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";
import {MockTwyneCreditVault} from "../src/twyne/mocks/MockTwyneCreditVault.sol";
import {TwyneYieldDonatingStrategy} from "../src/strategy/TwyneYieldDonatingStrategy.sol";

contract TwyneYDSHarness is TwyneYieldDonatingStrategy {
    constructor(
        address _twyneVault,
        address _asset,
        string memory _name,
        address _management,
        address _keeper,
        address _emergencyAdmin,
        address _donationAddress,
        bool _enableBurning,
        address _tokenizedStrategyAddress
    )
        TwyneYieldDonatingStrategy(
            _twyneVault,
            _asset,
            _name,
            _management,
            _keeper,
            _emergencyAdmin,
            _donationAddress,
            _enableBurning,
            _tokenizedStrategyAddress
        )
    {}

    function exposed_deploy(uint256 amount) external {
        _deployFunds(amount);
    }

    function exposed_free(uint256 amount) external {
        _freeFunds(amount);
    }

    function exposed_harvest() external returns (uint256) {
        return _harvestAndReport();
    }
}

contract TwyneYDSTest is Test {
    MockERC20 usdc;
    MockTwyneCreditVault vault;
    TwyneYDSHarness strategy;

    address management = address(0x111);
    address keeper = address(0x222);
    address emer = address(0x333);
    address donation = address(0x444);

    function setUp() public {
        usdc = new MockERC20("USD Coin", "USDC", 6);
        vault = new MockTwyneCreditVault(address(usdc), 1100); // ~11% APR

        strategy = new TwyneYDSHarness(
            address(vault),
            address(usdc),
            "Twyne YDS",
            management,
            keeper,
            emer,
            donation,
            true,
            address(0)
        );
    }

    function test_deploy_harvest_free() public {
        // Mint funds to the strategy
        usdc.mint(address(strategy), 100_000e6);

        // Deploy into vault
        strategy.exposed_deploy(100_000e6);

        // Simulate ~1 year accrual
        vault.accrueWithTime(365 days);

        // Harvest and ensure total assets increased
        uint256 totalAfter = strategy.exposed_harvest();
        assertGt(totalAfter, 100_000e6, "expected positive accrual");

        // Free 10k and ensure strategy receives underlying
        uint256 preBal = usdc.balanceOf(address(strategy));
        strategy.exposed_free(10_000e6);
        uint256 postBal = usdc.balanceOf(address(strategy));
        assertEq(postBal - preBal, 10_000e6, "freed amount mismatch");
    }
}


