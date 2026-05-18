import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to initialize the database client.");
}

const globalForPostgres = globalThis as typeof globalThis & {
  scorePostgresClient?: postgres.Sql;
};

const queryClient =
  globalForPostgres.scorePostgresClient ?? postgres(connectionString);

if (process.env.NODE_ENV !== "production") {
  globalForPostgres.scorePostgresClient = queryClient;
}

export const db = drizzle(queryClient, { schema });
