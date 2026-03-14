import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";

export function clerkAuth(req: Request, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  if (!auth.userId) {
    return res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
  }

  req.auth = {
    userId: auth.userId,
    walletAddress: auth.sessionClaims?.publicMetadata?.walletAddress,
    githubHandle: auth.sessionClaims?.publicMetadata?.githubHandle,
    tier: auth.sessionClaims?.publicMetadata?.tier
  } as any;

  return next();
}
