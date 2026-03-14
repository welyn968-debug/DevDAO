import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

const provider = new ethers.JsonRpcProvider(`https://polygon-amoy.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`);
const signer = process.env.RELAYER_PRIVATE_KEY ? new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider) : null;

const devTokenAbi = [
  "function balanceOf(address) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function mintReward(address,uint256)"
];

const registryAbi = [
  "function submit(string title,string metadataUri,uint256 rewardAmount) returns (uint256)",
  "function castVote(uint256 id,bool support)",
  "function finalise(uint256 id)",
  "function contributions(uint256 id) view returns (address,uint256,uint256,uint256,uint256,uint256,bool,bool,string,string)",
  "event ContributionSubmitted(uint256 indexed id,address indexed contributor,string metadataUri)",
  "event VoteCast(uint256 indexed id,address indexed voter,bool support,uint256 weight)",
  "event Finalised(uint256 indexed id,bool approved,uint256 rewardPaid,uint256 badgeId)"
];

export const contracts = {
  provider,
  signer,
  registry: process.env.CONTRACT_REGISTRY_ADDRESS && signer
    ? new ethers.Contract(process.env.CONTRACT_REGISTRY_ADDRESS, registryAbi, signer)
    : null,
  devToken: process.env.DEV_TOKEN_ADDRESS && signer
    ? new ethers.Contract(process.env.DEV_TOKEN_ADDRESS, devTokenAbi, signer)
    : null
};
