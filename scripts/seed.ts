/**
 * Database seed script
 * Inserts essential default data that the app needs to function
 *
 * Usage: bun scripts/seed.ts
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error("❌ DATABASE_URL environment variable is not set");
    process.exit(1);
}

const client = postgres(connectionString, { max: 1 });
const db = drizzle(client);

console.log("🌱 Seeding database...");

try {
    // Seed default currencies
    await client`
        INSERT INTO currencies (code, name, symbol, decimal_places)
        VALUES
            ('IDR', 'Indonesian Rupiah', 'Rp', 0),
            ('USD', 'US Dollar', '$', 2),
            ('EUR', 'Euro', '€', 2),
            ('GBP', 'British Pound', '£', 2),
            ('JPY', 'Japanese Yen', '¥', 0),
            ('SGD', 'Singapore Dollar', 'S$', 2),
            ('MYR', 'Malaysian Ringgit', 'RM', 2),
            ('THB', 'Thai Baht', '฿', 2),
            ('PHP', 'Philippine Peso', '₱', 2),
            ('VND', 'Vietnamese Dong', '₫', 0),
            ('CNY', 'Chinese Yuan', '¥', 2),
            ('INR', 'Indian Rupee', '₹', 2),
            ('AUD', 'Australian Dollar', 'A$', 2),
            ('CAD', 'Canadian Dollar', 'C$', 2),
            ('CHF', 'Swiss Franc', 'CHF', 2)
        ON CONFLICT (code) DO NOTHING
    `;

    console.log("✅ Default currencies seeded");

    // Note: User profiles are created automatically via Supabase triggers
    // or application logic when users sign up

    console.log("✅ Database seeded successfully!");

} catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
} finally {
    await client.end();
}
