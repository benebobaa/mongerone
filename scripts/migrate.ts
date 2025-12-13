/**
 * Lightweight production migration script
 * Uses drizzle-orm's migrate() function - no drizzle-kit needed!
 * 
 * Usage: bun scripts/migrate.ts
 */
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error("❌ DATABASE_URL environment variable is not set");
    process.exit(1);
}

const client = postgres(connectionString, { max: 1 });
const db = drizzle(client);

console.log("🚀 Running database migrations...");

try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("✅ Migrations completed successfully!");
} catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
} finally {
    await client.end();
}
