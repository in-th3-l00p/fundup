 // SPDX-License-Identifier: MIT
 pragma solidity ^0.8.24;

 import {ICreditVault} from "../interfaces/ICreditVault.sol";

 interface IERC20Like {
     function transferFrom(address from, address to, uint256 value) external returns (bool);
     function transfer(address to, uint256 value) external returns (bool);
 }

 contract MockTwyneCreditVault is ICreditVault {
     uint256 private constant ONE = 1e18;

     address public override asset; // underlying ERC20 token

     uint256 public override totalSupply; // vault shares
     mapping(address => uint256) public override balanceOf;
     uint256 private _totalManagedAssets; 

     uint256 public annualRateBps; // e.g., 1100 for 11%
     uint256 public lastAccrual;
     uint256 private _exchangeRate; 

     address public override manager;

     event Deposit(address indexed caller, address indexed receiver, uint256 assets, uint256 shares);
     event Withdraw(address indexed caller, address indexed receiver, address indexed owner, uint256 assets, uint256 shares);
     event Accrued(uint256 newExchangeRate);
     event AnnualRateUpdated(uint256 newRateBps);
     event ManagerUpdated(address newManager);

     constructor(address _asset, uint256 _annualRateBps) {
         require(_asset != address(0), "ASSET_ZERO");
         asset = _asset;
         annualRateBps = _annualRateBps;
         lastAccrual = block.timestamp;
         _exchangeRate = ONE; // 1:1 at genesis
     }

     // Views
     function exchangeRate() external view override returns (uint256) {
         return _exchangeRate;
     }

     function totalAssets() public view override returns (uint256) {
         // assets = shares * exchangeRate / 1e18
         return (totalSupply * _exchangeRate) / ONE;
     }

     function convertToShares(uint256 assets) public view override returns (uint256) {
         if (assets == 0) return 0;
         return (assets * ONE) / _exchangeRate;
     }

     function convertToAssets(uint256 shares) public view override returns (uint256) {
         if (shares == 0) return 0;
         return (shares * _exchangeRate) / ONE;
     }

     function deposit(uint256 assets, address receiver) external override returns (uint256 sharesMinted) {
         require(assets > 0, "ZERO_ASSETS");
         _accrue();
         sharesMinted = convertToShares(assets);
         require(sharesMinted > 0, "ZERO_SHARES");

        require(IERC20Like(asset).transferFrom(msg.sender, address(this), assets));

         totalSupply += sharesMinted;
         balanceOf[receiver] += sharesMinted;
         _totalManagedAssets += assets;
         emit Deposit(msg.sender, receiver, assets, sharesMinted);
     }

     function withdraw(uint256 assets, address receiver, address owner) external override returns (uint256 sharesBurned) {
         require(assets > 0, "ZERO_ASSETS");
         _accrue();
         sharesBurned = convertToShares(assets);
         require(balanceOf[owner] >= sharesBurned, "INSUFFICIENT_SHARES");

         balanceOf[owner] -= sharesBurned;
         totalSupply -= sharesBurned;
         if (_totalManagedAssets >= assets) {
             _totalManagedAssets -= assets;
         } else {
             _totalManagedAssets = 0;
         }

         require(IERC20Like(asset).transfer(receiver, assets));
         emit Withdraw(msg.sender, receiver, owner, assets, sharesBurned);
     }

     function accrueInterest() external override {
         _accrue();
     }

     function setAnnualRateBps(uint256 newRateBps) external override {
         annualRateBps = newRateBps;
         emit AnnualRateUpdated(newRateBps);
     }

     function setManager(address newManager) external override {
         manager = newManager;
         emit ManagerUpdated(newManager);
     }

     /// @notice Test helper to simulate accrual over an artificial time delta.
    function accrueWithTime(uint256 dt) external {
        if (dt > 0) {
            // Pretend last accrual happened dt seconds earlier than now, then accrue.
            if (dt >= block.timestamp) {
                lastAccrual = 0;
            } else {
                lastAccrual = block.timestamp - dt;
            }
        }
        _accrue();
    }

     // Internal helpers
     function _accrue() internal {
         uint256 dt = block.timestamp - lastAccrual;
         if (dt == 0) return;
         lastAccrual = block.timestamp;

         // Linear APR approximation: rateFactor = 1 + (rateBps/10000) * dt / YEAR
         // exchangeRate = exchangeRate * rateFactor
         uint256 YEAR = 365 days;
         uint256 numerator = (annualRateBps * dt * ONE) / YEAR; // scaled by 1e18
         // newER = er * (1 + numerator/10000/1e18)
         // = er + er * numerator / 10000 / 1e18
         uint256 increment = (_exchangeRate * numerator) / 10000 / ONE;
         _exchangeRate = _exchangeRate + increment;
         emit Accrued(_exchangeRate);
     }
 }


