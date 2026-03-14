import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("votes").del();
  await knex("contributions").del();
  await knex("profiles").del();

  await knex("profiles").insert([
    { address: "0xUser1", github_handle: "devuser", tier: "BUILDER", rep_score: 100 }
  ]);

  await knex("contributions").insert([
    {
      id: "0xcontrib1",
      type: "CODE",
      title: "Add TypeScript strict mode support",
      description: "Example contribution for local dev",
      contributor: "0xUser1",
      github_handle: "devuser",
      status: "PENDING",
      for_votes: 0,
      against_votes: 0,
      reward: 0,
      metadata_uri: "ipfs://demo",
      voting_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  ]);
}
