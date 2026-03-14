import { knexConfig } from "./client";
import db from "./client";

export * from "./client";
export { knexConfig, db };
export default db;
