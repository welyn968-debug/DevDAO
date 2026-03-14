declare namespace Express {
  interface Request {
    auth?: {
      userId: string;
      walletAddress?: string;
      githubHandle?: string;
      tier?: string;
    };
  }
}
