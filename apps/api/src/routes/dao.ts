import { Router } from "express";
import { getDAOStats, getLeaderboard } from "../services/dao.service";

const router = Router();

router.get("/stats", async (_req, res, next) => {
  try {
    const stats = await getDAOStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

router.get("/leaderboard", async (req, res, next) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const data = await getLeaderboard(limit);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

export default router;
