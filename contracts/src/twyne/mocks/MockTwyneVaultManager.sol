 // SPDX-License-Identifier: MIT
 pragma solidity ^0.8.24;

 import {IVaultManager} from "../interfaces/IVaultManager.sol";

 /// @notice Lightweight simulation of Twyne's Vault Manager credit delegation.
 contract MockTwyneVaultManager is IVaultManager {
     mapping(address => mapping(address => uint256)) private _delegated;

     function delegateBorrowingPower(address lender, address borrower, uint256 assets) external override {
         require(lender != address(0) && borrower != address(0), "ZERO_ADDRESS");
         _delegated[lender][borrower] = assets;
         emit Delegated(lender, borrower, assets);
     }

     function revokeDelegation(address lender, address borrower) external override {
         require(lender != address(0) && borrower != address(0), "ZERO_ADDRESS");
         delete _delegated[lender][borrower];
         emit Revoked(lender, borrower);
     }

     function delegatedAssets(address lender, address borrower) external view override returns (uint256) {
         return _delegated[lender][borrower];
     }
 }


