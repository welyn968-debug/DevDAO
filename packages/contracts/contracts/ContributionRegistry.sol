// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./DevToken.sol";
import "./ReputationNFT.sol";

contract ContributionRegistry is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;

    struct Contribution {
        address contributor;
        uint256 submittedAt;
        uint256 votingDeadline;
        uint256 rewardAmount;
        uint256 forVotes;
        uint256 againstVotes;
        bool finalised;
        bool approved;
        string metadataUri;
        string title;
    }

    DevToken public devToken;
    ReputationNFT public reputationNFT;
    uint256 public quorumPercent = 5;
    uint256 public votingPeriod = 7 days;

    Counters.Counter private _ids;

    mapping(uint256 => Contribution) public contributions;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event ContributionSubmitted(uint256 indexed id, address indexed contributor, string metadataUri);
    event VoteCast(uint256 indexed id, address indexed voter, bool support, uint256 weight);
    event Finalised(uint256 indexed id, bool approved, uint256 rewardPaid, uint256 badgeId);

    constructor(address _devToken, address _reputationNFT) {
        devToken = DevToken(_devToken);
        reputationNFT = ReputationNFT(_reputationNFT);
    }

    function submit(string calldata title, string calldata metadataUri, uint256 rewardAmount)
        external
        returns (uint256)
    {
        require(bytes(title).length >= 5, "title too short");
        _ids.increment();
        uint256 id = _ids.current();
        contributions[id] = Contribution({
            contributor: msg.sender,
            submittedAt: block.timestamp,
            votingDeadline: block.timestamp + votingPeriod,
            rewardAmount: rewardAmount,
            forVotes: 0,
            againstVotes: 0,
            finalised: false,
            approved: false,
            metadataUri: metadataUri,
            title: title
        });

        emit ContributionSubmitted(id, msg.sender, metadataUri);
        return id;
    }

    function castVote(uint256 id, bool support) external nonReentrant {
        Contribution storage c = contributions[id];
        require(c.submittedAt > 0, "not found");
        require(block.timestamp < c.votingDeadline, "voting closed");
        require(msg.sender != c.contributor, "no self vote");
        require(!hasVoted[id][msg.sender], "duplicate vote");

        uint256 weight = devToken.balanceOf(msg.sender);
        if (weight == 0) {
            weight = 1; // minimum voting power
        }
        hasVoted[id][msg.sender] = true;
        if (support) c.forVotes += weight; else c.againstVotes += weight;
        emit VoteCast(id, msg.sender, support, weight);
    }

    function finalise(uint256 id) external nonReentrant {
        Contribution storage c = contributions[id];
        require(c.submittedAt > 0, "not found");
        require(!c.finalised, "already finalised");
        require(block.timestamp >= c.votingDeadline, "still voting");

        uint256 totalVotes = c.forVotes + c.againstVotes;
        uint256 supply = devToken.totalSupply();
        bool quorumMet = supply == 0 ? totalVotes > 0 : (totalVotes * 100) / supply >= quorumPercent;
        bool approved = quorumMet && c.forVotes > c.againstVotes;

        c.finalised = true;
        c.approved = approved;

        uint256 badgeId = 0;
        if (approved) {
            if (c.rewardAmount > 0) {
                devToken.mintReward(c.contributor, c.rewardAmount);
            }
            badgeId = reputationNFT.mintBadge(c.contributor);
        }
        emit Finalised(id, approved, approved ? c.rewardAmount : 0, badgeId);
    }

    function setQuorumPercent(uint256 percent) external onlyOwner {
        require(percent <= 100, "invalid percent");
        quorumPercent = percent;
    }

    function setVotingPeriod(uint256 periodSeconds) external onlyOwner {
        require(periodSeconds >= 1 days, "too short");
        votingPeriod = periodSeconds;
    }
}
