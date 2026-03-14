# DevDAO — Architecture & Design Documentation

> Turborepo monorepo · Next.js 15 · Node.js/Express · Solidity · Clerk · Polygon

---

## Table of Contents

1. [Monorepo Overview](https://claude.ai/chat/55cdab93-089d-4343-9f3d-1b416c5e4a87#1-monorepo-overview)
2. [Frontend Project Layout](https://claude.ai/chat/55cdab93-089d-4343-9f3d-1b416c5e4a87#2-frontend-project-layout)
3. [Backend Project Layout](https://claude.ai/chat/55cdab93-089d-4343-9f3d-1b416c5e4a87#3-backend-project-layout)
4. [API Design](https://claude.ai/chat/55cdab93-089d-4343-9f3d-1b416c5e4a87#4-api-design)
5. [System Flow](https://claude.ai/chat/55cdab93-089d-4343-9f3d-1b416c5e4a87#5-system-flow)

---

## 1. Monorepo Overview

```
devdao/                                   ← Turborepo root
├── apps/
│   ├── web/                              ← Next.js 15 frontend
│   └── api/                              ← Node.js/Express backend
├── packages/
│   ├── contracts/                        ← Solidity smart contracts + ABIs
│   ├── db/                               ← Knex schema, migrations, seeds
│   ├── types/                            ← Shared TypeScript types
│   └── config/                           ← Shared ESLint, Tailwind, TS configs
├── turbo.json                            ← Pipeline definitions
├── package.json                          ← Root workspace config
└── .env.example                          ← All env vars documented
```

**Turborepo pipeline (`turbo.json`):**

```json
{
  "pipeline": {
    "build":   { "dependsOn": ["^build"], "outputs": [".next/**", "dist/**"] },
    "dev":     { "cache": false, "persistent": true },
    "lint":    {},
    "typecheck": { "dependsOn": ["^build"] },
    "test":    { "dependsOn": ["^build"] },
    "db:migrate": { "cache": false }
  }
}
```

**Shared packages purpose:**

|Package|Consumers|Purpose|
|---|---|---|
|`packages/contracts`|`web`, `api`|ABI JSONs, contract addresses per network, type-safe wrappers|
|`packages/db`|`api`|Knex client, all migrations, seed scripts|
|`packages/types`|`web`, `api`|Shared DTOs, enums, Zod schemas for request/response validation|
|`packages/config`|`web`, `api`|ESLint config, Tailwind preset, tsconfig base|

---

## 2. Frontend Project Layout

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · Clerk v6 · wagmi v2 · viem · TanStack Query v5

```
apps/web/
├── app/
│   ├── layout.tsx                        ← Root layout: ClerkProvider + WagmiProvider + QueryClientProvider
│   ├── page.tsx                          ← Public landing / redirect to /feed
│   │
│   ├── (public)/                         ← Route group: no auth required
│   │   ├── feed/
│   │   │   ├── page.tsx                  ← Contribution feed with filters
│   │   │   └── loading.tsx               ← Suspense skeleton
│   │   ├── contribution/[id]/
│   │   │   ├── page.tsx                  ← Single contribution detail + vote panel
│   │   │   └── loading.tsx
│   │   └── profile/[address]/
│   │       └── page.tsx                  ← Public contributor profile
│   │
│   ├── (auth)/                           ← Route group: Clerk-protected
│   │   ├── submit/
│   │   │   └── page.tsx                  ← Contribution submission form
│   │   ├── dashboard/
│   │   │   └── page.tsx                  ← Personal dashboard: my contributions, votes, rewards
│   │   └── settings/
│   │       └── page.tsx                  ← Profile settings, linked GitHub, wallet display
│   │
│   ├── dao/
│   │   └── page.tsx                      ← DAO stats: treasury, leaderboard, parameters
│   │
│   └── api/                              ← Next.js Route Handlers (thin proxies to backend)
│       └── webhook/
│           └── clerk/
│               └── route.ts             ← Clerk webhook: sync user to DB on sign-up/update
│
├── components/
│   ├── ui/                               ← Primitives (Button, Badge, Input, Card, Skeleton)
│   │
│   ├── auth/
│   │   ├── ConnectWalletButton.tsx       ← Clerk <SignInButton> + wallet prompt
│   │   ├── UserAvatar.tsx                ← Clerk <UserButton> with tier badge overlay
│   │   └── AuthGate.tsx                 ← Wrapper: show children only if signed in
│   │
│   ├── contributions/
│   │   ├── ContributionCard.tsx          ← Feed card: type badge, title, vote bar, meta
│   │   ├── ContributionList.tsx          ← Virtualized list with filter/sort controls
│   │   ├── ContributionDetail.tsx        ← Full detail view: description, IPFS link, timeline
│   │   ├── SubmitForm.tsx                ← Multi-step form: type → title → description → links → confirm
│   │   ├── TypeBadge.tsx                 ← CODE / RFC / BUG colored chip
│   │   └── StatusChip.tsx               ← PENDING / APPROVED / REJECTED chip
│   │
│   ├── voting/
│   │   ├── VotePanel.tsx                 ← FOR/AGAINST buttons + current tally + deadline countdown
│   │   ├── VoteBar.tsx                   ← Visual progress bar (FOR % vs AGAINST %)
│   │   └── VotingPowerBadge.tsx          ← Shows caller's current DEV balance / voting power
│   │
│   ├── profile/
│   │   ├── ProfileHero.tsx               ← Avatar, wallet address, tier badge, DEV balance
│   │   ├── ProfileStats.tsx              ← Approved / Rejected / Pending / Rep score grid
│   │   ├── BadgeGallery.tsx              ← Grid of on-chain ReputationNFT badges
│   │   └── ContributionHistory.tsx       ← Tabbed list: submitted / votes cast
│   │
│   └── dao/
│       ├── TreasuryCard.tsx              ← DEV supply, treasury balance, holder count
│       ├── Leaderboard.tsx               ← Top contributors ranked by approved count
│       └── ParametersTable.tsx          ← Current on-chain governance parameters
│
├── hooks/
│   ├── useContributions.ts               ← TanStack Query: fetch + paginate contributions
│   ├── useContribution.ts                ← TanStack Query: single contribution + on-chain merge
│   ├── useVote.ts                        ← wagmi writeContract wrapper for castVote()
│   ├── useSubmit.ts                      ← IPFS upload → backend POST → on-chain confirm flow
│   ├── useProfile.ts                     ← Fetch profile data by wallet address
│   ├── useDevBalance.ts                  ← wagmi readContract: DEV token balance
│   ├── useReputationBadges.ts            ← wagmi readContract: owned badge token IDs
│   └── useDAOStats.ts                    ← Combined on-chain + off-chain DAO stats
│
├── lib/
│   ├── api-client.ts                     ← Typed fetch wrapper (attaches Clerk JWT to requests)
│   ├── wagmi-config.ts                   ← wagmi config: chains (Polygon), connectors, transports
│   ├── ipfs.ts                           ← Client-side IPFS upload via Pinata API
│   ├── clerk.ts                          ← Clerk server-side helpers (currentUser, auth())
│   └── utils.ts                          ← formatAddress, formatTokenAmount, countdown helpers
│
├── middleware.ts                         ← Clerk middleware: protect (auth) route group
├── next.config.ts
├── tailwind.config.ts                   ← Extends packages/config/tailwind
└── tsconfig.json                         ← Extends packages/config/tsconfig
```

### Auth Flow (Clerk)

Clerk is configured with **two login methods active simultaneously:**

1. **Web3 wallet sign-in** — MetaMask / WalletConnect / Coinbase Wallet  
    Clerk manages the SIWE challenge/signature flow internally. No custom SIWE code needed.
    
2. **GitHub OAuth** — Required to link a GitHub handle for anti-sybil and contribution verification.
    

Both must be connected before a user can submit a contribution. Clerk's `publicMetadata` carries `{ walletAddress, githubHandle, tier, repScore }` which is set server-side via the Clerk Backend API (triggered from the Clerk webhook route).

```
middleware.ts

matcher: ["/submit", "/dashboard", "/settings"]
→ clerkMiddleware() rejects unauthenticated requests
→ redirects to /sign-in (Clerk hosted UI or <SignIn> component)
```

---

## 3. Backend Project Layout

**Stack:** Node.js 20 · Express 5 · TypeScript · Knex · PostgreSQL · ethers.js v6 · Clerk Backend SDK

```
apps/api/
├── src/
│   ├── index.ts                          ← Server entry: app setup, listen
│   ├── app.ts                            ← Express factory: middleware stack, route mounting
│   │
│   ├── routes/
│   │   ├── index.ts                      ← Mount all routers under /api/*
│   │   ├── auth.ts                       ← POST /api/auth/webhook (Clerk webhook handler)
│   │   ├── contributions.ts              ← GET|POST /api/contributions, GET|POST /api/contributions/:id
│   │   ├── votes.ts                      ← POST /api/votes, GET /api/votes/:contributionId
│   │   ├── profiles.ts                   ← GET /api/profiles/:address
│   │   ├── dao.ts                        ← GET /api/dao/stats, GET /api/dao/leaderboard
│   │   └── finalise.ts                   ← POST /api/finalise/:id (bot-callable, permissionless)
│   │
│   ├── middleware/
│   │   ├── clerkAuth.ts                  ← Validates Clerk session JWT (replaces custom SIWE/JWT)
│   │   ├── requireWallet.ts              ← Guards: ensures user has linked wallet in Clerk publicMetadata
│   │   ├── requireGitHub.ts              ← Guards: ensures user has linked GitHub in Clerk publicMetadata
│   │   ├── validate.ts                   ← express-validator error collector
│   │   ├── rateLimiter.ts                ← Per-route rate limiting (stricter on POST /contributions)
│   │   └── errorHandler.ts              ← Global error boundary, structured JSON errors
│   │
│   ├── services/
│   │   ├── contribution.service.ts       ← Business logic: create, list, get, cancel
│   │   ├── vote.service.ts               ← Business logic: cast vote, get tally
│   │   ├── profile.service.ts            ← Aggregate profile: DB + on-chain merge
│   │   ├── dao.service.ts                ← DAO stats, leaderboard queries
│   │   ├── finalise.service.ts           ← Call contract.finalise(), update DB on resolution
│   │   └── ipfs.service.ts              ← Pin JSON metadata to IPFS via Pinata
│   │
│   ├── lib/
│   │   ├── db.ts                         ← Knex instance (from packages/db)
│   │   ├── contracts.ts                  ← ethers.js: provider, relayer signer, contract instances
│   │   ├── clerk.ts                      ← Clerk Backend SDK client (verifyToken, updateUserMetadata)
│   │   └── logger.ts                    ← Pino structured logger
│   │
│   ├── jobs/
│   │   ├── finaliseJob.ts                ← Cron: every 15min, finalise expired PENDING contributions
│   │   └── syncOnChainJob.ts            ← Cron: every 1hr, reconcile DB vote counts with on-chain
│   │
│   └── types/
│       └── express.d.ts                  ← Augment req.auth (Clerk session claims)
│
├── package.json
└── tsconfig.json                         ← Extends packages/config/tsconfig
```

### Middleware Stack (in order)

```
Request
  │
  ├─ helmet()              ← Security headers
  ├─ cors()                ← Allow web app origin only
  ├─ morgan()              ← HTTP request logging
  ├─ express.json()        ← Body parsing (2mb limit)
  ├─ rateLimiter()         ← Global: 200 req / 15min per IP
  │
  ├─ /api/auth/webhook     ← Clerk webhook (svix signature check, no JWT needed)
  │
  ├─ clerkAuth()           ← All other routes: verify Clerk session JWT
  │     └─ populates req.auth.userId, req.auth.publicMetadata
  │
  ├─ [route handlers]
  │     ├─ requireWallet() ← POST contributions, POST votes
  │     └─ requireGitHub() ← POST contributions only
  │
  └─ errorHandler()        ← Catch all
```

### Clerk Auth Integration (Backend)

The backend **does not issue its own JWTs**. It relies entirely on Clerk's session tokens.

```typescript
// middleware/clerkAuth.ts
import { clerkClient, getAuth } from '@clerk/express';

export async function clerkAuth(req, res, next) {
  const { userId, sessionClaims } = getAuth(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  // Wallet address and GitHub handle are stored in Clerk publicMetadata
  // and embedded in the session JWT — no extra DB lookup needed
  req.auth = {
    userId,
    walletAddress: sessionClaims.publicMetadata.walletAddress,
    githubHandle:  sessionClaims.publicMetadata.githubHandle,
    tier:          sessionClaims.publicMetadata.tier,
  };
  next();
}
```

**Clerk Webhook** (`/api/auth/webhook`) handles:

- `user.created` → insert row into `profiles` table
- `user.updated` → sync wallet address / GitHub handle changes to `profiles`
- `session.created` → log for analytics

---

## 4. API Design

**Base URL:** `https://api.devdao.xyz/api`  
**Auth:** All protected routes require `Authorization: Bearer <clerk_session_token>`  
**Format:** `application/json` request and response bodies  
**Versioning:** URL-based, current version implicit (`/api/...`). Future: `/api/v2/...`

---

### 4.1 Auth

|Method|Path|Auth|Description|
|---|---|---|---|
|POST|`/auth/webhook`|—|Clerk webhook: sync user data to DB|

> All other authentication is handled by Clerk directly (session management, wallet sign-in, OAuth). The backend does not expose `/auth/login` or `/auth/logout` — those are Clerk's responsibility.

---

### 4.2 Contributions

#### `GET /contributions`

List contributions with filtering, sorting, and pagination.

**Query Parameters:**

|Param|Type|Default|Description|
|---|---|---|---|
|`type`|`CODE \| RFC \| BUG`|—|Filter by contribution type|
|`status`|`PENDING \| APPROVED \| REJECTED`|`PENDING`|Filter by status|
|`sort`|`newest \| mostVoted \| deadline`|`newest`|Sort order|
|`page`|`integer ≥ 1`|`1`|Page number|
|`limit`|`integer 1–50`|`20`|Results per page|

**Response `200`:**

```json
{
  "data": [
    {
      "id": "0xabc123...",
      "type": "CODE",
      "title": "Add TypeScript strict mode support",
      "contributor": "0x1f9a...d4E2",
      "githubHandle": "devuser",
      "status": "PENDING",
      "forVotes": 4200,
      "againstVotes": 310,
      "reward": "500000000000000000000",
      "metadataUri": "ipfs://Qm...",
      "votingDeadline": "2025-03-20T14:00:00Z",
      "submittedAt": "2025-03-13T14:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 142
  }
}
```

---

#### `GET /contributions/:id`

Single contribution with on-chain state merged in.

**Response `200`:**

```json
{
  "id": "0xabc123...",
  "type": "CODE",
  "title": "Add TypeScript strict mode support",
  "description": "Full markdown description...",
  "links": ["https://github.com/org/repo/pull/42"],
  "contributor": "0x1f9a...d4E2",
  "githubHandle": "devuser",
  "status": "PENDING",
  "metadataUri": "ipfs://Qm...",
  "submittedAt": "2025-03-13T14:00:00Z",
  "votingDeadline": "2025-03-20T14:00:00Z",
  "onChain": {
    "forVotes": "4200000000000000000000",
    "againstVotes": "310000000000000000000",
    "status": 0,
    "rewardAmount": "500000000000000000000"
  }
}
```

**Errors:** `404` if not found.

---

#### `POST /contributions`

Submit a new contribution. Requires wallet + GitHub linked in Clerk.

**Auth:** ✅ Required  
**Guards:** `requireWallet`, `requireGitHub`

**Request Body:**

```json
{
  "type": "CODE",
  "title": "Add TypeScript strict mode support to core parser",
  "description": "Markdown. Min 20 chars, max 5000.",
  "links": ["https://github.com/org/repo/pull/42"]
}
```

**Validation:**

- `type` — required, one of `CODE | RFC | BUG`
- `title` — required, 5–120 chars
- `description` — required, 20–5000 chars
- `links` — optional, array of valid URLs, max 5

**Flow:**

1. Validate request body
2. Pin metadata JSON to IPFS (Pinata) → get `metadataUri`
3. Relay `submit(typeIndex, title, metadataUri)` on-chain via relayer wallet
4. Wait for transaction receipt, extract `on_chain_id` from event log
5. Insert row into `contributions` DB table
6. Return created record + transaction hash

**Response `201`:**

```json
{
  "data": { "...contribution object..." },
  "txHash": "0xdeadbeef...",
  "onChainId": "0xabc123..."
}
```

**Errors:** `400` validation, `401` unauthorized, `403` wallet/GitHub not linked, `500` on-chain failure.

---

#### `POST /contributions/:id/cancel`

Cancel own pending contribution (off-chain only; on-chain status remains until voting closes).

**Auth:** ✅ Required

**Response `200`:**

```json
{ "message": "Contribution cancelled" }
```

**Errors:** `403` if not owner, `400` if not PENDING.

---

### 4.3 Votes

#### `POST /votes`

Cast a vote on a pending contribution.

**Auth:** ✅ Required  
**Guards:** `requireWallet`

**Request Body:**

```json
{
  "contributionId": "0xabc123...",
  "support": true
}
```

**Flow:**

1. Check `votes` table — reject if already voted
2. Verify contribution is `PENDING` and deadline not passed
3. Relay `castVote(id, support)` on-chain via relayer wallet
4. Insert row into `votes` table
5. Increment `for_votes` or `against_votes` on `contributions` row

**Response `200`:**

```json
{
  "message": "Vote recorded",
  "txHash": "0xdeadbeef..."
}
```

**Errors:** `409` already voted, `400` voting closed or invalid, `403` contributor trying to self-vote.

---

#### `GET /votes/:contributionId`

Vote breakdown for a contribution.

**Response `200`:**

```json
{
  "contributionId": "0xabc123...",
  "forVotes": 42,
  "againstVotes": 8,
  "total": 50,
  "forPercent": 84
}
```

---

### 4.4 Profiles

#### `GET /profiles/:address`

Public profile aggregating DB data and on-chain state.

**Response `200`:**

```json
{
  "address": "0x1f9a...d4E2",
  "githubHandle": "devuser",
  "displayName": "devuser",
  "avatarUrl": "https://avatars.githubusercontent.com/...",
  "tier": "BUILDER",
  "repScore": 4200,
  "tokenBalance": "12450000000000000000000",
  "stats": {
    "approved": 47,
    "rejected": 6,
    "pending": 3
  },
  "contributions": [ "...paginated list..." ],
  "badges": [
    {
      "tokenId": 12,
      "contribType": "CODE",
      "contributionId": "0x...",
      "mintedAt": "2025-02-01T10:00:00Z"
    }
  ]
}
```

---

### 4.5 DAO

#### `GET /dao/stats`

Global DAO metrics.

**Response `200`:**

```json
{
  "totalContributions": 1284,
  "approvedContributions": 847,
  "approvalRate": 66,
  "tokenSupply": "12400000000000000000000000",
  "treasuryBalance": "2100000000000000000000000",
  "uniqueHolders": 4892,
  "votingPeriodDays": 7,
  "quorumPercent": 5
}
```

---

#### `GET /dao/leaderboard`

Top contributors by approved contribution count.

**Query Parameters:** `limit` (default 20, max 50)

**Response `200`:**

```json
{
  "data": [
    {
      "rank": 1,
      "address": "0x1f9a...d4E2",
      "githubHandle": "devuser",
      "tier": "VETERAN",
      "approved": 47,
      "repScore": 5200
    }
  ]
}
```

---

#### `POST /finalise/:id`

Trigger on-chain finalisation for a contribution whose voting period has ended. Permissionless — callable by anyone or the cron job.

**Auth:** —  
**Response `200`:**

```json
{
  "onChainId": "0xabc123...",
  "status": "APPROVED",
  "txHash": "0xdeadbeef...",
  "rewardPaid": "500000000000000000000"
}
```

**Errors:** `400` if voting still active, `409` if already finalised.

---

### 4.6 Error Response Format

All errors follow a consistent shape:

```json
{
  "error": "Human-readable message",
  "code": "MACHINE_READABLE_CODE",
  "details": [ { "field": "title", "message": "Title must be at least 5 characters" } ]
}
```

|HTTP Status|When|
|---|---|
|`400`|Validation failure, business rule violation|
|`401`|Missing or invalid Clerk session token|
|`403`|Authenticated but not authorized (wrong owner, missing wallet/GitHub link)|
|`404`|Resource not found|
|`409`|Conflict (already voted, already finalised)|
|`429`|Rate limit exceeded|
|`500`|Unexpected server error or on-chain failure|

---

## 5. System Flow

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

---

_Last updated: March 2025 · DevDAO Architecture v1.0_