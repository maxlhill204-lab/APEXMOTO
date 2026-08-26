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

const RETRYABLE_DATABASE_CODES = new Set([
  "40001", // serialization_failure
  "40P01", // deadlock_detected
  "53300", // too_many_connections
  "57P01", // admin_shutdown
  "57P02", // crash_shutdown
  "57P03", // cannot_connect_now
  "58030", // io_error
]);

export function isRetryableDatabaseError(error: unknown) {
  const candidate = error && typeof error === "object" ? error as { code?: unknown; message?: unknown } : null;
  const code = typeof candidate?.code === "string" ? candidate.code : "";
  if (code.startsWith("08") || RETRYABLE_DATABASE_CODES.has(code)) return true;
  const message = typeof candidate?.message === "string" ? candidate.message : "";
  return /connection|socket|websocket|fetch failed|econn|closed unexpectedly|connection terminated|timeout/i.test(message);
}

export function getSql() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new StoreConfigurationError("DATABASE_URL is not configured.");
  return neon(connectionString);
}

export async function withDbTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new StoreConfigurationError("DATABASE_URL is not configured.");
  const maximumAttempts = 3;
  for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
    const pool = new Pool({ connectionString });
    let client: PoolClient | null = null;
    try {
      client = await pool.connect();
      await client.query("BEGIN");
      const result = await work(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      if (client) await client.query("ROLLBACK").catch(() => undefined);
      if (attempt >= maximumAttempts || !isRetryableDatabaseError(error)) throw error;
      await new Promise((resolve) => setTimeout(resolve, 100 * 2 ** (attempt - 1)));
    } finally {
      client?.release();
      await pool.end().catch(() => undefined);
    }
  }
  throw new Error("Database transaction retry loop exited unexpectedly.");
}
