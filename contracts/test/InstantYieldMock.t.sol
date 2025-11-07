// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Test} from "forge-std/Test.sol";
import {InstantYieldMock} from "../src/mocks/InstantYieldMock.sol";
import {MintableERC20} from "../src/mocks/MintableERC20.sol";

contract InstantYieldMockTest is Test {
    InstantYieldMock pump;
    MintableERC20 usdc;
    address owner = address(0xABCD);
    address target = address(0x4444);

    function setUp() public {
        vm.prank(owner);
        pump = new InstantYieldMock(owner);
        usdc = new MintableERC20("USD Coin", "USDC", 6, owner);
    }

    function test_pump_mints() public {
        // transfer ownership to pump so it can call mint
        vm.prank(owner);
        usdc.transferOwnership(address(pump));
        vm.prank(owner);
        pump.pump(address(usdc), target, 123e6);
        assertEq(usdc.balanceOf(target), 123e6, "minted");
    }
}


