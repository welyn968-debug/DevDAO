import { Request, Response, NextFunction } from "express";

export function requireGitHub(req: Request, res: Response, next: NextFunction) {
  const gh = (req as any).auth?.githubHandle;
  if (!gh) {
    return res.status(403).json({ error: "GitHub not linked", code: "GITHUB_REQUIRED" });
  }
  return next();
}
