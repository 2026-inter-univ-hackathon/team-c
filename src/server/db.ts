import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import {
  createDbFromClient,
  createPostgresClient,
  type Db,
} from "../db/client";
import { parseServerEnv } from "./env";

if (existsSync(".env")) {
  loadEnvFile(".env");
}

export async function withDb<T>(callback: (db: Db) => Promise<T>): Promise<T> {
  const { DATABASE_URL } = parseServerEnv(process.env);

  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is required to query the database");
  }

  const client = createPostgresClient(DATABASE_URL);
  const db = createDbFromClient(client);

  try {
    return await callback(db);
  } finally {
    await client.end();
  }
}
