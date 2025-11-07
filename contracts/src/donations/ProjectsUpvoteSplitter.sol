// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title ProjectsUpvoteSplitter
 * @notice Minimal upvote-based donation splitter for hackathon demos.
 *         - Register project recipients
 *         - Users upvote once per project per epoch
 *         - Owner can start a new epoch
 *         - Anyone can call distribute(token) to split this contract's token balance
 *           among active projects weighted by upvotes in the current epoch
 */
contract ProjectsUpvoteSplitter is Ownable {
    using SafeERC20 for ERC20;

    struct Project {
        address recipient;
        bool active;
    }

    // epoch => projectId => voter => voted?
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) public hasVoted;
    // epoch => projectId => votes
    mapping(uint256 => mapping(uint256 => uint256)) public votes;

    Project[] public projects;
    uint256 public epoch;

    event ProjectAdded(uint256 indexed id, address indexed recipient);
    event ProjectStatus(uint256 indexed id, bool active);
    event Upvoted(uint256 indexed epoch, uint256 indexed projectId, address indexed voter);
    event EpochAdvanced(uint256 indexed newEpoch);
    event Distributed(address indexed token, uint256 total, uint256 indexed epoch);

    constructor(address initialOwner) {
        _transferOwnership(initialOwner);
    }

    function addProject(address recipient) external onlyOwner returns (uint256 id) {
        require(recipient != address(0), "recipient zero");
        projects.push(Project({recipient: recipient, active: true}));
        id = projects.length - 1;
        emit ProjectAdded(id, recipient);
    }

    function setProjectActive(uint256 id, bool active) external onlyOwner {
        require(id < projects.length, "bad id");
        projects[id].active = active;
        emit ProjectStatus(id, active);
    }

    function upvote(uint256 projectId) external {
        require(projectId < projects.length, "bad id");
        require(projects[projectId].active, "inactive");
        require(!hasVoted[epoch][projectId][msg.sender], "already");
        hasVoted[epoch][projectId][msg.sender] = true;
        votes[epoch][projectId] += 1;
        emit Upvoted(epoch, projectId, msg.sender);
    }

    function advanceEpoch() external onlyOwner {
        epoch += 1;
        emit EpochAdvanced(epoch);
    }

    function numProjects() external view returns (uint256) {
        return projects.length;
    }

    function currentVotes(uint256 projectId) public view returns (uint256) {
        return votes[epoch][projectId];
    }

    function distribute(address token) external {
        uint256 totalBal = ERC20(token).balanceOf(address(this));
        require(totalBal > 0, "nothing to distribute");

        // sum votes across active projects
        uint256 n = projects.length;
        uint256 totalVotes = 0;
        for (uint256 i = 0; i < n; i++) {
            if (projects[i].active) {
                totalVotes += votes[epoch][i];
            }
        }
        require(totalVotes > 0, "no votes");

        uint256 sent = 0;
        for (uint256 i = 0; i < n; i++) {
            if (!projects[i].active) continue;
            uint256 v = votes[epoch][i];
            if (v == 0) continue;
            uint256 share = (totalBal * v) / totalVotes;
            if (share > 0) {
                sent += share;
                ERC20(token).safeTransfer(projects[i].recipient, share);
            }
        }
        // send dust to owner to avoid stuck tokens
        uint256 dust = ERC20(token).balanceOf(address(this));
        if (dust > 0) {
            ERC20(token).safeTransfer(owner(), dust);
            sent += dust;
        }
        emit Distributed(token, sent, epoch);
    }
}


