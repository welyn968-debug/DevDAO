import { z } from "zod";

export enum ContributionType {
  CODE = "CODE",
  RFC = "RFC",
  BUG = "BUG"
}

export enum ContributionStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED"
}

export const ContributionSummarySchema = z.object({
  id: z.string(),
  type: z.nativeEnum(ContributionType),
  title: z.string(),
  contributor: z.string(),
  githubHandle: z.string().nullable().optional(),
  status: z.nativeEnum(ContributionStatus),
  forVotes: z.number(),
  againstVotes: z.number(),
  reward: z.string(),
  metadataUri: z.string(),
  votingDeadline: z.string(),
  submittedAt: z.string()
});

export const ContributionDetailSchema = ContributionSummarySchema.extend({
  description: z.string(),
  links: z.array(z.string().url()).default([]),
  onChain: z.object({
    forVotes: z.string(),
    againstVotes: z.string(),
    status: z.number(),
    rewardAmount: z.string()
  })
});

export type ContributionSummary = z.infer<typeof ContributionSummarySchema>;
export type ContributionDetail = z.infer<typeof ContributionDetailSchema>;

export const VoteRequestSchema = z.object({
  contributionId: z.string(),
  support: z.boolean()
});

export const VoteResponseSchema = z.object({
  message: z.string(),
  txHash: z.string().optional()
});

export const VoteBreakdownSchema = z.object({
  contributionId: z.string(),
  forVotes: z.number(),
  againstVotes: z.number(),
  total: z.number(),
  forPercent: z.number()
});

export const ProfileSchema = z.object({
  address: z.string(),
  githubHandle: z.string().nullable().optional(),
  displayName: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  tier: z.string(),
  repScore: z.number(),
  tokenBalance: z.string(),
  stats: z.object({
    approved: z.number(),
    rejected: z.number(),
    pending: z.number()
  }),
  contributions: z.array(ContributionSummarySchema).optional(),
  badges: z
    .array(
      z.object({
        tokenId: z.number(),
        contribType: z.nativeEnum(ContributionType),
        contributionId: z.string(),
        mintedAt: z.string()
      })
    )
    .optional()
});

export type Profile = z.infer<typeof ProfileSchema>;

export const DAOStatsSchema = z.object({
  totalContributions: z.number(),
  approvedContributions: z.number(),
  approvalRate: z.number(),
  tokenSupply: z.string(),
  treasuryBalance: z.string(),
  uniqueHolders: z.number(),
  votingPeriodDays: z.number(),
  quorumPercent: z.number()
});

export type DAOStats = z.infer<typeof DAOStatsSchema>;

export const ErrorResponseSchema = z.object({
  error: z.string(),
  code: z.string(),
  details: z.array(z.object({ field: z.string(), message: z.string() })).optional()
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
