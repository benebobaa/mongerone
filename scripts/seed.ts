/**
 * Database seed script
 * Inserts essential default data that the app needs to function
 *
 * Usage: bun scripts/seed.ts
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../lib/env";

const connectionString = env.DATABASE_URL;

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

    // Seed default categories for existing users
    // Note: New users will get categories when they sign up
    const existingUsers = await client`SELECT id FROM profiles LIMIT 10`;

    if (existingUsers.length > 0) {
        console.log(`\n📁 Seeding default categories for ${existingUsers.length} user(s)...`);

        for (const user of existingUsers) {
            await client`
                INSERT INTO categories (user_id, name, type, icon, color)
                VALUES
                    (${user.id}, 'Salary', 'income', '💰', '#22c55e'),
                    (${user.id}, 'Business', 'income', '💼', '#10b981'),
                    (${user.id}, 'Investments', 'income', '📈', '#059669'),
                    (${user.id}, 'Food & Dining', 'expense', '🍔', '#ef4444'),
                    (${user.id}, 'Transportation', 'expense', '🚗', '#3b82f6'),
                    (${user.id}, 'Shopping', 'expense', '🛍️', '#a855f7'),
                    (${user.id}, 'Entertainment', 'expense', '🎬', '#ec4899'),
                    (${user.id}, 'Bills & Utilities', 'expense', '📱', '#f59e0b'),
                    (${user.id}, 'Health & Fitness', 'expense', '🏥', '#14b8a6'),
                    (${user.id}, 'Education', 'expense', '📚', '#6366f1')
                ON CONFLICT DO NOTHING
            `;
        }

        console.log("✅ Default categories seeded");
    }

    console.log("\n✅ Database seeded successfully!");

} catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
} finally {
    await client.end();
}
