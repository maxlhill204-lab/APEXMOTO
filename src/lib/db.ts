import { neon, neonConfig, Pool, type PoolClient } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

export class StoreConfigurationError extends Error {
  constructor(message = "The order system is not fully configured.") {
    super(message);
    this.name = "StoreConfigurationError";
  }
}

export const isDatabaseConfigured = () => Boolean(process.env.DATABASE_URL?.trim());

export function getSql() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new StoreConfigurationError("DATABASE_URL is not configured.");
  return neon(connectionString);
}

export async function withDbTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new StoreConfigurationError("DATABASE_URL is not configured.");
  const pool = new Pool({ connectionString });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}
