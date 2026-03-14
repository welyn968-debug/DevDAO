import { Router } from "express";
import { validateBody } from "../middleware/validate";
import { requireWallet } from "../middleware/requireWallet";
import { castVote, getVoteBreakdown } from "../services/vote.service";
import { VoteRequestSchema } from "@devdao/types";
import { clerkAuth } from "../middleware/clerkAuth";

const router = Router();

router.post("/", clerkAuth, requireWallet, validateBody(VoteRequestSchema), async (req, res, next) => {
  try {
    const { contributionId, support } = req.body;
    const result = await castVote(contributionId, support, (req as any).auth.walletAddress);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/:contributionId", async (req, res, next) => {
  try {
    const result = await getVoteBreakdown(req.params.contributionId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
