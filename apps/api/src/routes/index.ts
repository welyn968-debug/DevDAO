import { Router } from "express";
import authRouter from "./auth";
import contributionsRouter from "./contributions";
import votesRouter from "./votes";
import profilesRouter from "./profiles";
import daoRouter from "./dao";
import finaliseRouter from "./finalise";

const router = Router();

router.get("/health", (_req, res) => res.json({ ok: true }));
router.use("/auth", authRouter);
router.use("/contributions", contributionsRouter);
router.use("/votes", votesRouter);
router.use("/profiles", profilesRouter);
router.use("/dao", daoRouter);
router.use("/finalise", finaliseRouter);

export default router;
