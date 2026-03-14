## 4. API Design

**Base URL:** `https://api.devdao.xyz/api`  
**Auth:** All protected routes require `Authorization: Bearer <clerk_session_token>`  
**Format:** `application/json` request and response bodies  
**Versioning:** URL-based, current version implicit (`/api/...`). Future: `/api/v2/...`

---

### 4.1 Auth

|Method|Path|Auth|Description|
|---|---|---|---|
|POST|`/auth/webhook`|—|Clerk webhook: sync user data to DB|

> All other authentication is handled by Clerk directly (session management, wallet sign-in, OAuth). The backend does not expose `/auth/login` or `/auth/logout` — those are Clerk's responsibility.

---

### 4.2 Contributions

#### `GET /contributions`

List contributions with filtering, sorting, and pagination.

**Query Parameters:**

|Param|Type|Default|Description|
|---|---|---|---|
|`type`|`CODE \\| RFC \\| BUG`|—|Filter by contribution type|
|`status`|`PENDING \\| APPROVED \\| REJECTED`|`PENDING`|Filter by status|
|`sort`|`newest \\| mostVoted \\| deadline`|`newest`|Sort order|
|`page`|`integer ≥ 1`|`1`|Page number|
|`limit`|`integer 1–50`|`20`|Results per page|

**Response `200`:**

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

**Response `200`:**

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

**Errors:** `404` if not found.

---

#### `POST /contributions`

Submit a new contribution. Requires wallet + GitHub linked in Clerk.

**Auth:** ✅ Required  
**Guards:** `requireWallet`, `requireGitHub`

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

- `type` — required, one of `CODE | RFC | BUG`
- `title` — required, 5–120 chars
- `description` — required, 20–5000 chars
- `links` — optional, array of valid URLs, max 5

**Flow:**

1. Validate request body
2. Pin metadata JSON to IPFS (Pinata) → get `metadataUri`
3. Relay `submit(typeIndex, title, metadataUri)` on-chain via relayer wallet
4. Wait for transaction receipt, extract `on_chain_id` from event log
5. Insert row into `contributions` DB table
6. Return created record + transaction hash

**Response `201`:**

```json
{
  "data": { "...contribution object..." },
  "txHash": "0xdeadbeef...",
  "onChainId": "0xabc123..."
}
```

**Errors:** `400` validation, `401` unauthorized, `403` wallet/GitHub not linked, `500` on-chain failure.

---

#### `POST /contributions/:id/cancel`

Cancel own pending contribution (off-chain only; on-chain status remains until voting closes).

**Auth:** ✅ Required

**Response `200`:**

```json
{ "message": "Contribution cancelled" }
```

**Errors:** `403` if not owner, `400` if not PENDING.

---

### 4.3 Votes

#### `POST /votes`

Cast a vote on a pending contribution.

**Auth:** ✅ Required  
**Guards:** `requireWallet`

**Request Body:**

```json
{
  "contributionId": "0xabc123...",
  "support": true
}
```

**Flow:**

1. Check `votes` table — reject if already voted
2. Verify contribution is `PENDING` and deadline not passed
3. Relay `castVote(id, support)` on-chain via relayer wallet
4. Insert row into `votes` table
5. Increment `for_votes` or `against_votes` on `contributions` row

**Response `200`:**

```json
{
  "message": "Vote recorded",
  "txHash": "0xdeadbeef..."
}
```

**Errors:** `409` already voted, `400` voting closed or invalid, `403` contributor trying to self-vote.

---

#### `GET /votes/:contributionId`

Vote breakdown for a contribution.

**Response `200`:**

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

**Response `200`:**

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

**Response `200`:**

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

**Query Parameters:** `limit` (default 20, max 50)

**Response `200`:**

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

**Auth:** —  
**Response `200`:**

```json
{
  "onChainId": "0xabc123...",
  "status": "APPROVED",
  "txHash": "0xdeadbeef...",
  "rewardPaid": "500000000000000000000"
}
```

**Errors:** `400` if voting still active, `409` if already finalised.

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