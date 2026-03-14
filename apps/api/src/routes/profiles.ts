import { Router } from "express";
import { getProfile } from "../services/profile.service";

const router = Router();

router.get("/:address", async (req, res, next) => {
  try {
    const profile = await getProfile(req.params.address);
    if (!profile) return res.status(404).json({ error: "Not found" });
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

export default router;
