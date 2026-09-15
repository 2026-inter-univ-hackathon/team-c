import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { parseServerEnv } from "../server/env";
import * as schema from "./schema";

export function createPostgresClient(databaseUrl: string) {
  return postgres(databaseUrl, {
    prepare: false,
  });
}

export function createDb(
  databaseUrl = parseServerEnv(process.env).DATABASE_URL,
) {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to create a database client");
  }

  const client = createPostgresClient(databaseUrl);
  return drizzle(client, { schema });
}

export type Db = ReturnType<typeof createDb>;
