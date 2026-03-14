import axios from "axios";

export async function pinMetadata(metadata: unknown): Promise<string> {
  if (!process.env.PINATA_JWT) {
    // fallback: return dummy uri
    return "ipfs://demo";
  }
  const res = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", metadata, {
    headers: { Authorization: `Bearer ${process.env.PINATA_JWT}` }
  });
  return `ipfs://${res.data.IpfsHash}`;
}
