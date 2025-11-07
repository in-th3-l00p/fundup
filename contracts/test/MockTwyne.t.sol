 // SPDX-License-Identifier: MIT
 pragma solidity ^0.8.24;

 import {MockERC20} from "src/mocks/MockERC20.sol";
 import {MockTwyneCreditVault} from "src/twyne/mocks/MockTwyneCreditVault.sol";

 contract MockTwyneTest {
     MockERC20 internal usdc;
     MockTwyneCreditVault internal creditVault;

     function setUp() public {
         usdc = new MockERC20("USD Coin", "USDC", 6);
         creditVault = new MockTwyneCreditVault(address(usdc), 1100); // ~11% APR
         // Mint tokens to this contract
         usdc.mint(address(this), 1_000_000e6);
     }

     function test_deposit_accrue_withdraw() public {
         setUp();
         uint256 depositAmount = 100_000e6;

         // Approve and deposit
         require(usdc.approve(address(creditVault), depositAmount));
         uint256 shares = creditVault.deposit(depositAmount, address(this));
         require(shares > 0, "no shares minted");

         // Accrue roughly one year
         creditVault.accrueWithTime(365 days);

         // Value of shares in assets should be > principal with ~11% gain
         uint256 assetsNow = creditVault.convertToAssets(shares);
         require(assetsNow > depositAmount, "no positive accrual");

         // Withdraw principal amount; should burn fewer shares due to exchangeRate increase
         uint256 preBal = usdc.balanceOf(address(this));
         uint256 burned = creditVault.withdraw(depositAmount, address(this), address(this));
         uint256 postBal = usdc.balanceOf(address(this));

         require(postBal - preBal == depositAmount, "withdraw wrong amount");
         require(burned < shares, "should burn fewer shares after accrual");
     }
 }


