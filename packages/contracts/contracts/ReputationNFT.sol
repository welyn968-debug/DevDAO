// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ReputationNFT is ERC721, Ownable {
    uint256 public nextTokenId = 1;

    constructor() ERC721("DevDAO Reputation", "DEVREP") {}

    function mintBadge(address to) external onlyOwner returns (uint256) {
        uint256 tokenId = nextTokenId++;
        _safeMint(to, tokenId);
        return tokenId;
    }

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        require(auth == address(0) || auth == owner(), "Transfers disabled");
        return super._update(to, tokenId, auth);
    }
}
