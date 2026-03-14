import { expect } from "chai";
import { ethers } from "hardhat";

describe("ContributionRegistry", () => {
  it("submits, votes, and finalises", async () => {
    const [owner, user1, user2] = await ethers.getSigners();

    const DevToken = await ethers.getContractFactory("DevToken");
    const dev = await DevToken.deploy();
    await dev.waitForDeployment();

    // give tokens to voters
    await dev.mintReward(user1.address, ethers.parseEther("100"));
    await dev.mintReward(user2.address, ethers.parseEther("50"));

    const ReputationNFT = await ethers.getContractFactory("ReputationNFT");
    const rep = await ReputationNFT.deploy();
    await rep.waitForDeployment();

    const Registry = await ethers.getContractFactory("ContributionRegistry");
    const registry = await Registry.deploy(await dev.getAddress(), await rep.getAddress());
    await registry.waitForDeployment();
    await dev.transferOwnership(await registry.getAddress());
    await rep.transferOwnership(await registry.getAddress());

    const tx = await registry.connect(user1).submit("Test", "ipfs://test", ethers.parseEther("10"));
    const receipt = await tx.wait();
    const event = receipt?.logs.find(() => true);
    const id = 1n; // first id

    await registry.connect(user2).castVote(id, true);

    await ethers.provider.send("evm_increaseTime", [8 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);

    await registry.finalise(id);
    const contribution = await registry.contributions(id);
    expect(contribution.finalised).to.eq(true);
    expect(contribution.approved).to.eq(true);
  });
});
