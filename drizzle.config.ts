import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// Validate DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error(
    "Missing required environment variable: DATABASE_URL\n" +
    "Please ensure DATABASE_URL is set in your .env.local file"
  );
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
