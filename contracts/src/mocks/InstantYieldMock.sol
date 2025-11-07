// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

interface IMintableLike {
    function mint(address to, uint256 amount) external;
}

/**
 * @title InstantYieldMock
 * @notice Simple helper to instantly generate "yield" for demo purposes by minting
 *         MockERC20-like tokens to a target address (e.g., the donation splitter).
 */
contract InstantYieldMock {
    address public owner;

    event YieldMinted(address indexed token, address indexed to, uint256 amount);
    event OwnerSet(address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor(address _owner) {
        owner = _owner;
        emit OwnerSet(_owner);
    }

    function setOwner(address _owner) external onlyOwner {
        owner = _owner;
        emit OwnerSet(_owner);
    }

    function pump(address token, address to, uint256 amount) external onlyOwner {
        IMintableLike(token).mint(to, amount);
        emit YieldMinted(token, to, amount);
    }
}


