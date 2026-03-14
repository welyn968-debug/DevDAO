import { Router } from "express";
import { validateBody } from "../middleware/validate";
import { requireWallet } from "../middleware/requireWallet";
import { requireGitHub } from "../middleware/requireGitHub";
import { ContributionDetailSchema, ContributionStatus, ContributionType } from "@devdao/types";
import { createContribution, getContribution, listContributions, cancelContribution } from "../services/contribution.service";
import { z } from "zod";
import { clerkAuth } from "../middleware/clerkAuth";

const router = Router();

const ListQuerySchema = z.object({
  type: z.nativeEnum(ContributionType).optional(),
  status: z.nativeEnum(ContributionStatus).optional(),
  sort: z.enum(["newest", "mostVoted", "deadline"]).optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional()
});

const CreateSchema = z.object({
  type: z.nativeEnum(ContributionType),
  title: z.string().min(5).max(120),
  description: z.string().min(20).max(5000),
  links: z.array(z.string().url()).max(5).optional(),
  reward: z.string().optional()
});

router.get("/", async (req, res, next) => {
  try {
    const parsed = ListQuerySchema.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ error: "Invalid query", details: parsed.error.issues });
    const result = await listContributions(parsed.data);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const contribution = await getContribution(req.params.id);
    if (!contribution) return res.status(404).json({ error: "Not found", code: "NOT_FOUND" });
    res.json(contribution);
  } catch (err) {
    next(err);
  }
});

router.post("/", clerkAuth, requireWallet, requireGitHub, validateBody(CreateSchema), async (req, res, next) => {
  try {
    const data = await createContribution(req.body, (req as any).auth);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

router.post("/:id/cancel", clerkAuth, requireWallet, async (req, res, next) => {
  try {
    const result = await cancelContribution(req.params.id, (req as any).auth);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
