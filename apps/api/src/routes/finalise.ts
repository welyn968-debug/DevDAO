import { Router } from "express";
import { finaliseContribution } from "../services/finalise.service";

const router = Router();

router.post("/:id", async (req, res, next) => {
  try {
    const result = await finaliseContribution(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
