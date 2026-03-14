## System Flow

### 5.1 Authentication Flow (Clerk + Wallet)

```
User visits /submit (protected route)
        │
        ▼
middleware.ts (Clerk)
        │ No session
        ▼
Clerk <SignIn> page
        │
        ├─ Option A: Connect Wallet (MetaMask / WalletConnect)
        │       │
        │       ├─ Clerk presents SIWE challenge internally
        │       ├─ User signs with wallet
        │       └─ Clerk creates session, embeds walletAddress in publicMetadata
        │
        └─ Option B: GitHub OAuth
                │
                └─ Clerk creates session, embeds githubHandle in publicMetadata
                   (User must also connect wallet before submitting)

        │
        ▼
Clerk issues session JWT
        │
        ▼
Clerk Webhook fires → POST /api/auth/webhook
        │
        ├─ user.created → INSERT INTO profiles (address, github_handle, ...)
        └─ user.updated → UPDATE profiles SET github_handle = ..., wallet_address = ...

        │
        ▼
Frontend: useAuth() / getAuth() returns { userId, walletAddress, githubHandle, tier }
Backend:  clerkAuth() middleware validates Bearer token, populates req.auth
```

---

### 5.2 Submit Contribution Flow

```
[BROWSER]                          [BACKEND]                     [BLOCKCHAIN]            [IPFS]
    │                                  │                               │                    │
    ├─ User fills SubmitForm            │                               │                    │
    │                                  │                               │                    │
    ├─ useSubmit() hook called          │                               │                    │
    │                                  │                               │                    │
    ├─── POST /api/contributions ──────►│                               │                    │
    │    (Clerk JWT in header)          │                               │                    │
    │                                  ├─ clerkAuth() validates token   │                    │
    │                                  ├─ requireWallet() checks addr  │                    │
    │                                  ├─ requireGitHub() checks handle│                    │
    │                                  ├─ Validate body (Zod)          │                    │
    │                                  │                               │                    │
    │                                  ├─── ipfs.pin(metadata) ────────────────────────────►│
    │                                  │◄── { cid: "Qm..." } ─────────────────────────────│
    │                                  │                               │                    │
    │                                  ├─── contract.submit() ────────►│                    │
    │                                  │    (relayer signer)           ├─ ContributionRegistry
    │                                  │                               │   .submit() executes
    │                                  │◄── receipt + on_chain_id ────│                    │
    │                                  │                               │                    │
    │                                  ├─ INSERT INTO contributions    │                    │
    │                                  │                               │                    │
    │◄── 201 { data, txHash } ─────────│                               │                    │
    │                                  │                               │                    │
    ├─ Show success state               │                               │                    │
    └─ Redirect to /contribution/:id   │                               │                    │
```

---

### 5.3 Vote Flow

```
[BROWSER]                          [BACKEND]                     [BLOCKCHAIN]
    │                                  │                               │
    ├─ User clicks FOR / AGAINST        │                               │
    │                                  │                               │
    ├─── POST /api/votes ──────────────►│                               │
    │    { contributionId, support }    ├─ clerkAuth()                  │
    │    (Clerk JWT)                    ├─ requireWallet()              │
    │                                  ├─ Check votes table (no dupe)  │
    │                                  ├─ Check PENDING + deadline      │
    │                                  ├─ Check not self-vote           │
    │                                  │                               │
    │                                  ├─── contract.castVote() ───────►│
    │                                  │    (relayer signer)            ├─ ContributionRegistry
    │                                  │◄── receipt ───────────────────│   .castVote() executes
    │                                  │                               │   (DEV balance weighted)
    │                                  ├─ INSERT INTO votes             │
    │                                  ├─ UPDATE contributions          │
    │                                  │   (increment for/against)     │
    │                                  │                               │
    │◄── 200 { message, txHash } ──────│                               │
    │                                  │                               │
    └─ VotePanel re-fetches tallies     │                               │
```

---

### 5.4 Finalisation Flow (Cron + Permissionless)

```
[CRON JOB]                         [BACKEND]                     [BLOCKCHAIN]
(every 15 min)                         │                               │
    │                                  │                               │
    ├─ Query DB: SELECT * FROM         │                               │
    │   contributions WHERE            │                               │
    │   status = 'PENDING' AND         │                               │
    │   voting_deadline < NOW()        │                               │
    │                                  │                               │
    ├─ For each expired contribution:  │                               │
    │                                  │                               │
    ├─── POST /api/finalise/:id ───────►│                               │
    │                                  ├─ Verify deadline passed        │
    │                                  │                               │
    │                                  ├─── contract.finalise() ───────►│
    │                                  │                               ├─ ContributionRegistry
    │                                  │                               │   .finalise() executes:
    │                                  │                               │   ├─ Check quorum (5%)
    │                                  │                               │   ├─ FOR > AGAINST?
    │                                  │                               │   │
    │                                  │                               │   ├─ APPROVED:
    │                                  │                               │   │   ├─ DevToken.mintReward()
    │                                  │                               │   │   └─ ReputationNFT.mintBadge()
    │                                  │                               │   │
    │                                  │                               │   └─ REJECTED: emit event
    │                                  │                               │
    │                                  │◄── receipt + event data ──────│
    │                                  │                               │
    │                                  ├─ UPDATE contributions          │
    │                                  │   SET status = APPROVED|REJECTED
    │                                  ├─ INSERT INTO badges (if approved)
    │                                  ├─ UPDATE profiles.rep_score    │
    │                                  ├─ UPDATE profiles.tier         │
    │                                  │                               │
    │◄── 200 { status, txHash } ───────│                               │
```

---

### 5.5 Profile Sync Flow (Clerk → DB)

```
[CLERK]                            [BACKEND]                     [BLOCKCHAIN]
    │                                  │                               │
    ├─ User links wallet in Clerk      │                               │
    │   OR GitHub OAuth completes      │                               │
    │                                  │                               │
    ├─── POST /api/auth/webhook ───────►│                               │
    │    event: user.updated            ├─ Verify svix signature        │
    │    data: { walletAddress,         ├─ Upsert profiles table        │
    │            githubHandle }         │                               │
    │                                  ├─── devToken.balanceOf() ──────►│
    │                                  │◄── balance ───────────────────│
    │                                  │                               │
    │                                  ├─── reputationNFT.badgeCount() ►│
    │                                  │◄── count ─────────────────────│
    │                                  │                               │
    │                                  ├─ Recalculate rep_score & tier  │
    │                                  ├─ UPDATE profiles               │
    │                                  │                               │
    │◄─── 200 OK ──────────────────────│                               │
    │                                  │                               │
    ├─── clerkClient.users.updateUser()│                               │
    │    publicMetadata: {              │                               │
    │      tier, repScore }             │                               │
    └─────────────────────────────────►│                               │
```

---

### 5.6 Data Ownership Summary

```
┌─────────────────────────────────────────────────────────┐
│  Source of Truth per Data Type                           │
│                                                          │
│  Identity / Session     →  Clerk                         │
│  Wallet Address         →  Clerk publicMetadata + DB     │
│  GitHub Handle          →  Clerk publicMetadata + DB     │
│  Tier / Rep Score       →  DB (synced to Clerk metadata) │
│                                                          │
│  Contribution Record    →  Smart Contract (canonical)    │
│                            DB (mirror for fast queries)  │
│  Vote Record            →  Smart Contract (canonical)    │
│                            DB (mirror for fast queries)  │
│  DEV Token Balance      →  Smart Contract (ERC-20)       │
│  Reputation Badges      →  Smart Contract (ERC-721)      │
│  Contribution Metadata  →  IPFS (permanent)              │
└─────────────────────────────────────────────────────────┘
```