 // SPDX-License-Identifier: MIT
 pragma solidity ^0.8.24;

 /// @notice Minimal interface to simulate Twyne's Credit Vault behavior for integration testing.
 interface ICreditVault {
     // Views
     function asset() external view returns (address);
     function totalAssets() external view returns (uint256);
     function totalSupply() external view returns (uint256);
     function balanceOf(address account) external view returns (uint256);
     function convertToShares(uint256 assets) external view returns (uint256);
     function convertToAssets(uint256 shares) external view returns (uint256);
     function exchangeRate() external view returns (uint256);
     function manager() external view returns (address);

     // Core flows (ERC-4626-like)
     function deposit(uint256 assets, address receiver) external returns (uint256 sharesMinted);
     function withdraw(uint256 assets, address receiver, address owner) external returns (uint256 sharesBurned);

     // Interest and delegation controls (simulation helpers)
     function accrueInterest() external;
     function setAnnualRateBps(uint256 newRateBps) external;
     function setManager(address newManager) external;
 }


