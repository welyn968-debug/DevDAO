import { Request, Response, NextFunction } from "express";

export function requireWallet(req: Request, res: Response, next: NextFunction) {
  const wallet = (req as any).auth?.walletAddress;
  if (!wallet) {
    return res.status(403).json({ error: "Wallet not linked", code: "WALLET_REQUIRED" });
  }
  return next();
}
