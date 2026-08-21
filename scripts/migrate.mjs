import { neonConfig, Pool } from "@neondatabase/serverless";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import ws from "ws";

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) throw new Error("DATABASE_URL is required to run migrations.");

neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString });
const client = await pool.connect();
const directory = join(process.cwd(), "db", "migrations");
const files = (await readdir(directory)).filter((name) => name.endsWith(".sql")).sort();

try {
  await client.query("CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())");
  for (const file of files) {
    const existing = await client.query("SELECT version FROM schema_migrations WHERE version=$1", [file]);
    if (existing.rowCount) continue;
    const source = await readFile(join(directory, file), "utf8");
    await client.query("BEGIN");
    try {
      await client.query(source);
      await client.query("INSERT INTO schema_migrations (version) VALUES ($1)", [file]);
      await client.query("COMMIT");
      process.stdout.write(`Applied ${file}\n`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
} finally {
  client.release();
  await pool.end();
}

process.stdout.write("Database migrations are current.\n");
