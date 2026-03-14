import { db } from "../lib/db";
import { contracts } from "../lib/contracts";

export async function getProfile(address: string) {
  const row = await db("profiles").where({ address }).first();
  if (!row) return null;

  let tokenBalance = row.token_balance?.toString?.() || "0";
  try {
    if (contracts.devToken) {
      const balance = await contracts.devToken.balanceOf(address);
      tokenBalance = balance.toString();
    }
  } catch (_) {}

  return {
    address: row.address,
    githubHandle: row.github_handle,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    tier: row.tier,
    repScore: row.rep_score,
    tokenBalance,
    stats: {
      approved: await db("contributions").where({ contributor: address, status: "APPROVED" }).count("*").then((r) => Number(r[0].count)),
      rejected: await db("contributions").where({ contributor: address, status: "REJECTED" }).count("*").then((r) => Number(r[0].count)),
      pending: await db("contributions").where({ contributor: address, status: "PENDING" }).count("*").then((r) => Number(r[0].count))
    },
    contributions: await db("contributions").where({ contributor: address }).orderBy("submitted_at", "desc")
  };
}
