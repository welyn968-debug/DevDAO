import { promises as fs } from "fs";
import path from "path";
import { artifacts, network } from "hardhat";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const outDir = path.join(__dirname, "..", "abi");
  await fs.mkdir(outDir, { recursive: true });

  const contracts = ["DevToken", "ReputationNFT", "ContributionRegistry"] as const;
  for (const name of contracts) {
    const artifact = await artifacts.readArtifact(name);
    await fs.writeFile(path.join(outDir, `${name}.json`), JSON.stringify(artifact.abi, null, 2));
  }

  const addressesPath = path.join(outDir, "addresses.json");
  const existing = (await fs.readFile(addressesPath, "utf8").catch(() => "{}")) || "{}";
  const addresses = JSON.parse(existing);
  const networkName = network.name;
  addresses[networkName] = {
    DevToken: process.env.DEV_TOKEN_ADDRESS || "",
    ReputationNFT: process.env.REPUTATION_NFT_ADDRESS || "",
    ContributionRegistry: process.env.CONTRACT_REGISTRY_ADDRESS || ""
  };

  await fs.writeFile(addressesPath, JSON.stringify(addresses, null, 2));
  console.log(`Exported ABI and addresses for ${networkName}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
