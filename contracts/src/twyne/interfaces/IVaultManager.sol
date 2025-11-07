 // SPDX-License-Identifier: MIT
 pragma solidity ^0.8.24;

 /// @notice Minimal interface to simulate Twyne's Vault Manager for credit delegation.
 interface IVaultManager {
     event Delegated(address indexed lender, address indexed borrower, uint256 assets);
     event Revoked(address indexed lender, address indexed borrower);

     function delegateBorrowingPower(address lender, address borrower, uint256 assets) external;
     function revokeDelegation(address lender, address borrower) external;
     function delegatedAssets(address lender, address borrower) external view returns (uint256);
 }


