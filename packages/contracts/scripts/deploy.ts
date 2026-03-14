import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with", deployer.address);

  const DevToken = await ethers.getContractFactory("DevToken");
  const devToken = await DevToken.deploy();
  await devToken.waitForDeployment();

  const ReputationNFT = await ethers.getContractFactory("ReputationNFT");
  const rep = await ReputationNFT.deploy();
  await rep.waitForDeployment();

  const ContributionRegistry = await ethers.getContractFactory("ContributionRegistry");
  const registry = await ContributionRegistry.deploy(await devToken.getAddress(), await rep.getAddress());
  await registry.waitForDeployment();

  // Hand ownership to registry for mint operations
  const devOwnershipTx = await devToken.transferOwnership(await registry.getAddress());
  await devOwnershipTx.wait();
  const repOwnershipTx = await rep.transferOwnership(await registry.getAddress());
  await repOwnershipTx.wait();

  console.log("DevToken:", await devToken.getAddress());
  console.log("ReputationNFT:", await rep.getAddress());
  console.log("ContributionRegistry:", await registry.getAddress());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
