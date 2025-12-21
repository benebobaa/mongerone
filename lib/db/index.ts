import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { env } from "@/lib/env";

// Lazy singleton pattern: database connection is only created when first accessed
// This allows Next.js build to complete without DATABASE_URL
let _db: PostgresJsDatabase<typeof schema> | null = null;

function getDb(): PostgresJsDatabase<typeof schema> {
    if (!_db) {
        const connectionString = env.DATABASE_URL;
        // Disable prefetch as it is not supported for "Transaction" pool mode
        const client = postgres(connectionString, { prepare: false });
        _db = drizzle(client, { schema });
    }
    return _db;
}

// Export a proxy that lazily initializes the database
export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
    get(_, prop) {
        return getDb()[prop as keyof PostgresJsDatabase<typeof schema>];
    },
});
