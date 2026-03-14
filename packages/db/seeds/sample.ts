import { Knex } from "knex";

// Seed data adapted from docs/index.html mock content
const contributions = [
  {
    id: "0xabc1",
    type: "CODE",
    title: "Add TypeScript strict mode support to core parser",
    contributor: "0x1f9a...d4E2",
    status: "PENDING",
    for_votes: 4200,
    against_votes: 310,
    reward: 500,
    metadata_uri: "ipfs://seed/abc1",
    submitted_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
    voting_deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
  },
  {
    id: "0xabc2",
    type: "RFC",
    title: "RFC-012: Multi-sig treasury governance proposal",
    contributor: "0x8b3c...F91A",
    status: "PENDING",
    for_votes: 8800,
    against_votes: 1200,
    reward: 300,
    metadata_uri: "ipfs://seed/abc2",
    submitted_at: new Date(Date.now() - 5 * 60 * 60 * 1000),
    voting_deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)
  },
  {
    id: "0xabc3",
    type: "BUG",
    title: "Critical: Race condition in vote finalisation",
    contributor: "0x3e7d...22B0",
    status: "PENDING",
    for_votes: 9100,
    against_votes: 400,
    reward: 200,
    metadata_uri: "ipfs://seed/abc3",
    submitted_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
    voting_deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  },
  {
    id: "0xabc4",
    type: "CODE",
    title: "Implement EIP-4337 account abstraction support",
    contributor: "0xf4a9...88CC",
    status: "APPROVED",
    for_votes: 12000,
    against_votes: 2000,
    reward: 500,
    metadata_uri: "ipfs://seed/abc4",
    submitted_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    voting_deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  },
  {
    id: "0xabc5",
    type: "RFC",
    title: "RFC-011: Decentralised badge metadata standard",
    contributor: "0x2c5b...A3D1",
    status: "APPROVED",
    for_votes: 7500,
    against_votes: 1500,
    reward: 300,
    metadata_uri: "ipfs://seed/abc5",
    submitted_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    voting_deadline: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
  },
  {
    id: "0xabc6",
    type: "BUG",
    title: "XSS vulnerability in proposal description renderer",
    contributor: "0x9d1e...B7F3",
    status: "REJECTED",
    for_votes: 1200,
    against_votes: 5400,
    reward: 200,
    metadata_uri: "ipfs://seed/abc6",
    submitted_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    voting_deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  }
];

const profiles = [
  { address: "0x1f9a...d4E2", github_handle: "devuser1", tier: "BUILDER", rep_score: 4200, token_balance: 12450 },
  { address: "0x8b3c...F91A", github_handle: "devuser2", tier: "BUILDER", rep_score: 4100, token_balance: 8800 },
  { address: "0x3e7d...22B0", github_handle: "devuser3", tier: "BUILDER", rep_score: 3400, token_balance: 9100 },
  { address: "0xf4a9...88CC", github_handle: "devuser4", tier: "VETERAN", rep_score: 2700, token_balance: 12000 },
  { address: "0x2c5b...A3D1", github_handle: "devuser5", tier: "BUILDER", rep_score: 2100, token_balance: 7500 },
  { address: "0x9d1e...B7F3", github_handle: "devuser6", tier: "BUILDER", rep_score: 1800, token_balance: 5400 }
];

export async function seed(knex: Knex): Promise<void> {
  await knex("votes").del();
  await knex("contributions").del();
  await knex("profiles").del();

  await knex("profiles").insert(profiles);
  await knex("contributions").insert(
    contributions.map((c) => ({
      ...c,
      description: `${c.title} ? seeded from docs/index.html mock data`,
      links: [],
      github_handle: profiles.find((p) => p.address === c.contributor)?.github_handle || null
    }))
  );
}
