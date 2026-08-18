// backend/src/lib/db.ts

import dotenv from "dotenv";
dotenv.config();

import { Pool, PoolClient } from "pg";

export const pool = new Pool({
  connectionString: process.env.COCKROACH_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export async function query(text: string, params?: any[]) {
  const start  = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log(`[db] query (${duration}ms):`, text.substring(0, 80));
  return result;
}

export async function transaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    console.log("[db] Transaction BEGIN");

    const result = await fn(client);

    await client.query("COMMIT");
    console.log("[db] Transaction COMMIT");

    return result;

  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("[db] Transaction ROLLBACK:", err.message);
    throw err;

  } finally {
    client.release();
  }
}

export async function closePool() {
  await pool.end();
}