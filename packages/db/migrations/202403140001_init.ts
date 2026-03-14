import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("profiles", (table) => {
    table.string("address").primary();
    table.string("github_handle");
    table.string("display_name");
    table.string("avatar_url");
    table.string("tier").notNullable().defaultTo("BUILDER");
    table.integer("rep_score").notNullable().defaultTo(0);
    table.decimal("token_balance", 78, 0).notNullable().defaultTo(0);
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("contributions", (table) => {
    table.string("id").primary(); // on-chain id / tx hash
    table.enum("type", ["CODE", "RFC", "BUG"], { useNative: true, enumName: "contribution_type" });
    table.string("title").notNullable();
    table.text("description").notNullable();
    table.string("contributor").references("profiles.address");
    table.string("github_handle");
    table.enum("status", ["PENDING", "APPROVED", "REJECTED"], {
      useNative: true,
      enumName: "contribution_status"
    }).notNullable().defaultTo("PENDING");
    table.decimal("for_votes", 78, 0).notNullable().defaultTo(0);
    table.decimal("against_votes", 78, 0).notNullable().defaultTo(0);
    table.decimal("reward", 78, 0).defaultTo(0);
    table.string("metadata_uri");
    table.timestamp("voting_deadline").notNullable();
    table.timestamp("submitted_at").defaultTo(knex.fn.now());
    table.jsonb("links").defaultTo("[]");
    table.index(["status", "voting_deadline"], "idx_contrib_status_deadline");
  });

  await knex.schema.createTable("votes", (table) => {
    table.increments("id").primary();
    table.string("contribution_id").references("contributions.id").onDelete("CASCADE");
    table.string("voter").references("profiles.address");
    table.boolean("support").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.unique(["contribution_id", "voter"], { indexName: "votes_unique_contribution_voter" });
  });

  await knex.schema.createTable("badges", (table) => {
    table.increments("id").primary();
    table.integer("token_id").notNullable();
    table.string("contrib_type").notNullable();
    table.string("contribution_id").references("contributions.id");
    table.string("owner").references("profiles.address");
    table.timestamp("minted_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("dao_stats", (table) => {
    table.increments("id").primary();
    table.integer("total_contributions").notNullable().defaultTo(0);
    table.integer("approved_contributions").notNullable().defaultTo(0);
    table.integer("approval_rate").notNullable().defaultTo(0);
    table.decimal("token_supply", 78, 0).notNullable().defaultTo(0);
    table.decimal("treasury_balance", 78, 0).notNullable().defaultTo(0);
    table.integer("unique_holders").notNullable().defaultTo(0);
    table.integer("voting_period_days").notNullable().defaultTo(7);
    table.integer("quorum_percent").notNullable().defaultTo(5);
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema
    .dropTableIfExists("dao_stats")
    .dropTableIfExists("badges")
    .dropTableIfExists("votes")
    .dropTableIfExists("contributions")
    .dropTableIfExists("profiles")
    .raw('DROP TYPE IF EXISTS "contribution_type"')
    .raw('DROP TYPE IF EXISTS "contribution_status"');
}
