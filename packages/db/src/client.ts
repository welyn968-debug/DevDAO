import knex, { Knex } from "knex";
import dotenv from "dotenv";

dotenv.config();

const connection = process.env.DATABASE_URL || "";

if (!connection) {
  // eslint-disable-next-line no-console
  console.warn("DATABASE_URL is not set; knex client will fail to connect");
}

export const knexConfig: Knex.Config = {
  client: "pg",
  connection,
  pool: { min: 2, max: 10 },
  migrations: {
    tableName: "knex_migrations",
    directory: new URL("../migrations", import.meta.url).pathname
  },
  seeds: {
    directory: new URL("../seeds", import.meta.url).pathname
  }
};

export const db = knex(knexConfig);

export async function withTransaction<T>(fn: (trx: Knex.Transaction) => Promise<T>): Promise<T> {
  return db.transaction(async (trx) => fn(trx));
}

export default db;
