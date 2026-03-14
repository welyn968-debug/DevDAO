import { db } from "../lib/db";
import { contracts } from "../lib/contracts";
import { ContributionStatus, ContributionType } from "@devdao/types";
import { pinMetadata } from "./ipfs.service";
import { logger } from "../lib/logger";
import crypto from "crypto";

function mapRow(row: any) {
  return {
    id: row.id,
    type: row.type as ContributionType,
    title: row.title,
    description: row.description,
    links: Array.isArray(row.links) ? row.links : JSON.parse(row.links ?? "[]"),
    contributor: row.contributor,
    githubHandle: row.github_handle,
    status: row.status as ContributionStatus,
    forVotes: Number(row.for_votes || 0),
    againstVotes: Number(row.against_votes || 0),
    reward: row.reward?.toString?.() || "0",
    metadataUri: row.metadata_uri,
    votingDeadline: row.voting_deadline,
    submittedAt: row.submitted_at
  };
}

export interface ListQuery {
  type?: ContributionType;
  status?: ContributionStatus;
  sort?: "newest" | "mostVoted" | "deadline";
  page?: number;
  limit?: number;
}

export async function listContributions(params: ListQuery) {
  const page = params.page && params.page > 0 ? params.page : 1;
  const limit = params.limit && params.limit > 0 ? Math.min(params.limit, 50) : 20;

  const query = db("contributions");
  if (params.type) query.where("type", params.type);
  if (params.status) query.where("status", params.status);

  if (params.sort === "mostVoted") query.orderByRaw("(for_votes + against_votes) DESC");
  else if (params.sort === "deadline") query.orderBy("voting_deadline", "asc");
  else query.orderBy("submitted_at", "desc");

  const rows = await query.limit(limit).offset((page - 1) * limit);
  const [{ count }] = await db("contributions").count<{ count: string }>("*");

  return { data: rows.map(mapRow), meta: { page, limit, total: Number(count) } };
}

export async function getContribution(id: string) {
  const row = await db("contributions").where({ id }).first();
  if (!row) return null;

  const mapped = mapRow(row);
  const onChain = {
    forVotes: row.for_votes?.toString?.() || "0",
    againstVotes: row.against_votes?.toString?.() || "0",
    status: row.status === ContributionStatus.APPROVED ? 1 : row.status === ContributionStatus.REJECTED ? 2 : 0,
    rewardAmount: row.reward?.toString?.() || "0"
  };

  return { ...mapped, onChain };
}

export interface CreateContributionInput {
  type: ContributionType;
  title: string;
  description: string;
  links?: string[];
  reward?: string;
}

export async function createContribution(input: CreateContributionInput, auth: any) {
  const metadata = {
    ...input,
    contributor: auth.walletAddress,
    githubHandle: auth.githubHandle
  };

  const metadataUri = await pinMetadata(metadata);

  const onChainId = `0x${crypto.randomBytes(16).toString("hex")}`;

  const row = {
    id: onChainId,
    type: input.type,
    title: input.title,
    description: input.description,
    contributor: auth.walletAddress,
    github_handle: auth.githubHandle,
    status: ContributionStatus.PENDING,
    for_votes: 0,
    against_votes: 0,
    reward: input.reward || "0",
    metadata_uri: metadataUri,
    voting_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    submitted_at: new Date(),
    links: input.links || []
  };

  await db("contributions").insert(row);

  try {
    if (contracts.registry && contracts.signer) {
      await contracts.registry.submit(input.title, metadataUri, BigInt(input.reward || "0"));
    }
  } catch (err) {
    logger.error({ err }, "Failed to submit on-chain; keeping DB row");
  }

  return { data: mapRow(row), txHash: null, onChainId };
}

export async function cancelContribution(id: string, auth: any) {
  const row = await db("contributions").where({ id }).first();
  if (!row) throw Object.assign(new Error("Not found"), { status: 404 });
  if (row.contributor !== auth.walletAddress) {
    throw Object.assign(new Error("Forbidden"), { status: 403, code: "NOT_OWNER" });
  }
  if (row.status !== ContributionStatus.PENDING) {
    throw Object.assign(new Error("Cannot cancel"), { status: 400, code: "NOT_PENDING" });
  }
  await db("contributions").where({ id }).update({ status: ContributionStatus.REJECTED });
  return { message: "Contribution cancelled" };
}
