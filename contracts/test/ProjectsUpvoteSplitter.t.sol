// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Test} from "forge-std/Test.sol";
import {ProjectsUpvoteSplitter} from "../src/donations/ProjectsUpvoteSplitter.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";

contract ProjectsUpvoteSplitterTest is Test {
    ProjectsUpvoteSplitter splitter;
    MockERC20 usdc;

    address owner = address(0xABCD);
    address alice = address(0xA11CE);
    address bob = address(0xB0B);

    address p1 = address(0x1111);
    address p2 = address(0x2222);
    address p3 = address(0x3333);

    function setUp() public {
        vm.startPrank(owner);
        splitter = new ProjectsUpvoteSplitter(owner);
        usdc = new MockERC20("USD Coin", "USDC", 6);
        splitter.addProject(p1);
        splitter.addProject(p2);
        splitter.addProject(p3);
        vm.stopPrank();
    }

    function test_upvotes_and_distribute() public {
        // give splitter 1,000 USDC
        usdc.mint(address(splitter), 1_000e6);

        // votes: p1:2, p2:1, p3:0
        vm.prank(alice);
        splitter.upvote(0);
        vm.prank(bob);
        splitter.upvote(0);
        vm.prank(alice);
        splitter.upvote(1);

        uint256 p1Before = usdc.balanceOf(p1);
        uint256 p2Before = usdc.balanceOf(p2);
        uint256 p3Before = usdc.balanceOf(p3);

        splitter.distribute(address(usdc));

        // expect p1 gets ~ 666.666, p2 ~ 333.333, p3 0 (dust goes to owner)
        assertGt(usdc.balanceOf(p1), p1Before, "p1 should receive");
        assertGt(usdc.balanceOf(p2), p2Before, "p2 should receive");
        assertEq(usdc.balanceOf(p3), p3Before, "p3 should not receive");

        // total drained
        uint256 remaining = usdc.balanceOf(address(splitter));
        assertEq(remaining, 0, "splitter should be emptied (dust sent to owner)");
    }
}


