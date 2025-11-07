// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {BaseStrategy} from "@octant-core/core/BaseStrategy.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ICreditVault} from "../twyne/interfaces/ICreditVault.sol";

/**
 * @title TwyneYieldDonatingStrategy
 * @notice Yield-donating strategy that deploys underlying into a Twyne Credit Vault
 *         and reports total assets as loose underlying + vault-converted shares.
 *         Profits are minted to the donation address by Octant's BaseStrategy.
 */
contract TwyneYieldDonatingStrategy is BaseStrategy {
    using SafeERC20 for ERC20;

    ICreditVault public immutable twyneVault;

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
        BaseStrategy(
            _asset,
            _name,
            _management,
            _keeper,
            _emergencyAdmin,
            _donationAddress,
            _enableBurning,
            _tokenizedStrategyAddress
        )
    {
        twyneVault = ICreditVault(_twyneVault);
        // Max approve vault to pull underlying from this strategy
        ERC20(_asset).forceApprove(_twyneVault, type(uint256).max);
    }

    /**
     * @dev Deploy available underlying into the Twyne vault.
     */
    function _deployFunds(uint256 _amount) internal override {
        if (_amount == 0) return;
        twyneVault.deposit(_amount, address(this));
    }

    /**
     * @dev Attempt to free requested amount of underlying from the Twyne vault.
     */
    function _freeFunds(uint256 _amount) internal override {
        if (_amount == 0) return;
        // Withdraw underlying assets to this strategy, owned by this strategy
        twyneVault.withdraw(_amount, address(this), address(this));
    }

    /**
     * @dev Harvest and return accurate accounting of total assets:
     *      loose underlying + vault assets converted from this strategy's shares.
     */
    function _harvestAndReport() internal override returns (uint256 _totalAssets) {
        uint256 loose = ERC20(asset).balanceOf(address(this));
        uint256 shares = twyneVault.balanceOf(address(this));
        uint256 managed = twyneVault.convertToAssets(shares);
        _totalAssets = loose + managed;
    }

    /**
     * @dev No deposit cap by default. Adjust if needed.
     */
    function availableDepositLimit(address /*_owner*/) public view virtual override returns (uint256) {
        return type(uint256).max;
    }

    /**
     * @dev No withdraw cap by default. Adjust if needed.
     */
    function availableWithdrawLimit(address /*_owner*/) public view virtual override returns (uint256) {
        return type(uint256).max;
    }
}


