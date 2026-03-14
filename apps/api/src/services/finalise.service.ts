import { db } from "../lib/db";
import { contracts } from "../lib/contracts";
import { logger } from "../lib/logger";

export async function finaliseContribution(id: string) {
  const contribution = await db("contributions").where({ id }).first();
  if (!contribution) throw Object.assign(new Error("Not found"), { status: 404 });

  const now = Date.now();
  if (new Date(contribution.voting_deadline).getTime() > now) {
    throw Object.assign(new Error("Voting still active"), { status: 400, code: "ACTIVE" });
  }
  if (contribution.status !== "PENDING") {
    throw Object.assign(new Error("Already finalised"), { status: 409, code: "DONE" });
  }

  let txHash: string | null = null;
  try {
    if (contracts.registry && contracts.signer) {
      const tx = await contracts.registry.finalise(id);
      const receipt = await tx.wait();
      txHash = receipt?.hash ?? null;
    }
  } catch (err) {
    logger.error({ err }, "finalise on-chain failed");
  }

  // naive decision: approve if for_votes > against
  const approved = Number(contribution.for_votes) > Number(contribution.against_votes);
  await db("contributions").where({ id }).update({ status: approved ? "APPROVED" : "REJECTED" });

  if (approved) {
    await db("badges").insert({
      token_id: 0,
      contrib_type: contribution.type,
      contribution_id: id,
      owner: contribution.contributor
    });
  }

  return { onChainId: id, status: approved ? "APPROVED" : "REJECTED", txHash, rewardPaid: contribution.reward };
}
