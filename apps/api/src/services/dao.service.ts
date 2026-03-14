import { db } from "../lib/db";

export async function getDAOStats() {
  const stats = await db("dao_stats").first();
  if (stats) {
    return {
      totalContributions: stats.total_contributions,
      approvedContributions: stats.approved_contributions,
      approvalRate: stats.approval_rate,
      tokenSupply: stats.token_supply,
      treasuryBalance: stats.treasury_balance,
      uniqueHolders: stats.unique_holders,
      votingPeriodDays: stats.voting_period_days,
      quorumPercent: stats.quorum_percent
    };
  }

  const totalContributions = Number((await db("contributions").count("*").first())?.count || 0);
  const approved = Number((await db("contributions").where({ status: "APPROVED" }).count("*").first())?.count || 0);
  const approvalRate = totalContributions === 0 ? 0 : Math.round((approved / totalContributions) * 100);
  return {
    totalContributions,
    approvedContributions: approved,
    approvalRate,
    tokenSupply: "0",
    treasuryBalance: "0",
    uniqueHolders: 0,
    votingPeriodDays: 7,
    quorumPercent: 5
  };
}

export async function getLeaderboard(limit = 20) {
  const rows = await db("contributions")
    .select("contributor as address")
    .count<{ count: string }>("id as approved")
    .where({ status: "APPROVED" })
    .groupBy("contributor")
    .orderBy("approved", "desc")
    .limit(limit);

  return rows.map((row, index) => ({
    rank: index + 1,
    address: row.address,
    githubHandle: null,
    tier: "BUILDER",
    approved: Number((row as any).approved),
    repScore: 0
  }));
}
