import { db } from "../lib/db";
import { contracts } from "../lib/contracts";
import { logger } from "../lib/logger";

export async function castVote(contributionId: string, support: boolean, voter: string) {
  const existing = await db("votes").where({ contribution_id: contributionId, voter }).first();
  if (existing) {
    throw Object.assign(new Error("Already voted"), { status: 409, code: "ALREADY_VOTED" });
  }

  const contribution = await db("contributions").where({ id: contributionId }).first();
  if (!contribution) throw Object.assign(new Error("Not found"), { status: 404 });

  const now = Date.now();
  if (new Date(contribution.voting_deadline).getTime() < now) {
    throw Object.assign(new Error("Voting closed"), { status: 400, code: "VOTING_CLOSED" });
  }
  if (contribution.contributor === voter) {
    throw Object.assign(new Error("Cannot self-vote"), { status: 403, code: "SELF_VOTE" });
  }

  try {
    if (contracts.registry && contracts.signer) {
      await contracts.registry.castVote(contributionId, support);
    }
  } catch (err) {
    logger.error({ err }, "On-chain vote failed, continuing off-chain");
  }

  await db("votes").insert({ contribution_id: contributionId, voter, support });
  await db("contributions")
    .where({ id: contributionId })
    .increment(support ? "for_votes" : "against_votes", 1);

  return { message: "Vote recorded" };
}

export async function getVoteBreakdown(contributionId: string) {
  const votes = await db("votes").where({ contribution_id: contributionId });
  const forVotes = votes.filter((v) => v.support).length;
  const againstVotes = votes.filter((v) => !v.support).length;
  const total = votes.length;
  const forPercent = total === 0 ? 0 : Math.round((forVotes / total) * 100);
  return { contributionId, forVotes, againstVotes, total, forPercent };
}
