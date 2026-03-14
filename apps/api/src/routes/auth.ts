import { Router } from "express";

const router = Router();

router.post("/webhook", (req, res) => {
  // TODO: verify svix signature
  const event = req.body?.type;
  if (event === "user.updated" || event === "user.created") {
    // No-op placeholder; would sync to DB
  }
  return res.json({ received: true });
});

export default router;
