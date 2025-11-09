// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ProjectsUpvoteSplitter
 * @notice Holds registered projects and splits donated ERC20 balances proportionally to on-chain upvotes.
 *         Votes are tracked per-epoch; advancing the epoch rolls counters without clearing storage.
 */
contract ProjectsUpvoteSplitter is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Project {
        address recipient;
        bool active;
    }

    // Projects registry. The generated public getter matches (address, bool) tuple ABI.
    Project[] public projects;

    // Current epoch index (starts at 0)
    uint256 public currentEpoch;

    // epoch => projectId => votes
    mapping(uint256 => mapping(uint256 => uint256)) private votesByEpoch;
    // epoch => projectId => voter => hasVoted
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) private hasVotedByEpoch;

    event ProjectAdded(uint256 indexed id, address indexed recipient);
    event ProjectActivationChanged(uint256 indexed id, bool active);
    event Upvoted(uint256 indexed epoch, uint256 indexed id, address indexed voter);
    event EpochAdvanced(uint256 indexed newEpoch);
    event Distributed(address indexed token, uint256 amount, uint256 indexed epoch);

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Number of registered projects.
     */
    function numProjects() external view returns (uint256) {
        return projects.length;
    }

    /**
     * @notice Current votes for a project in the active epoch.
     */
    function currentVotes(uint256 projectId) external view returns (uint256) {
        return votesByEpoch[currentEpoch][projectId];
    }

    /**
     * @notice Register a new project. Only owner.
     * @return id The id of the newly added project.
     */
    function addProject(address recipient) external onlyOwner returns (uint256 id) {
        require(recipient != address(0), "recipient=0");
        id = projects.length;
        projects.push(Project({recipient: recipient, active: true}));
        emit ProjectAdded(id, recipient);
    }

    /**
     * @notice Set a project's active flag. Only owner.
     */
    function setProjectActive(uint256 projectId, bool active) external onlyOwner {
        require(projectId < projects.length, "bad id");
        projects[projectId].active = active;
        emit ProjectActivationChanged(projectId, active);
    }

    /**
     * @notice Upvote a project for the current epoch. Each wallet can upvote a given project once per epoch.
     */
    function upvote(uint256 projectId) external {
        require(projectId < projects.length, "bad id");
        require(projects[projectId].active, "inactive");
        uint256 epoch = currentEpoch;
        require(!hasVotedByEpoch[epoch][projectId][msg.sender], "already voted");
        hasVotedByEpoch[epoch][projectId][msg.sender] = true;
        unchecked {
            votesByEpoch[epoch][projectId] += 1;
        }
        emit Upvoted(epoch, projectId, msg.sender);
    }

    /**
     * @notice Advance to the next epoch. Only owner.
     *         Votes are implicitly reset by switching to a fresh epoch index.
     */
    function advanceEpoch() external onlyOwner {
        unchecked {
            currentEpoch += 1;
        }
        emit EpochAdvanced(currentEpoch);
    }

    /**
     * @notice Distribute the entire balance of `token` held by this contract
     *         across ACTIVE projects proportionally to their votes in the current epoch.
     *         If there are no active projects or no votes, the function is a no-op.
     */
    function distribute(address token) external nonReentrant {
        IERC20 erc20 = IERC20(token);
        uint256 balance = erc20.balanceOf(address(this));
        if (balance == 0) {
            return;
        }

        uint256 epoch = currentEpoch;
        uint256 projCount = projects.length;

        // Sum votes across active projects
        uint256 totalVotes = 0;
        uint256 lastActiveId = type(uint256).max;
        for (uint256 i = 0; i < projCount; i++) {
            if (!projects[i].active) continue;
            lastActiveId = i;
            totalVotes += votesByEpoch[epoch][i];
        }

        // Nothing to do if no active projects or no votes
        if (lastActiveId == type(uint256).max || totalVotes == 0) {
            return;
        }

        // Allocate proportionally; give rounding remainder to the last active project
        uint256 remaining = balance;
        for (uint256 i = 0; i < projCount; i++) {
            if (!projects[i].active) continue;
            uint256 votes = votesByEpoch[epoch][i];
            if (i == lastActiveId) {
                // send the remainder
                if (remaining > 0) {
                    erc20.safeTransfer(projects[i].recipient, remaining);
                }
                break;
            }
            if (votes == 0) {
                continue;
            }
            uint256 amount = (balance * votes) / totalVotes;
            if (amount > 0) {
                remaining -= amount;
                erc20.safeTransfer(projects[i].recipient, amount);
            }
        }

        emit Distributed(token, balance, epoch);
    }
}


