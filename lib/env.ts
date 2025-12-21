/**
 * Environment variable validation
 * Uses lazy validation (getters) so validation happens at runtime, not at import/build time.
 * This allows Next.js build to complete without requiring env vars to be present.
 */

function getRequiredEnv(key: string): string {
  const value = process.env[key];

  if (!value || value.trim() === '') {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
      `Please ensure ${key} is set in your .env.local file`
    );
  }

  return value;
}

// Lazy validation: env vars are validated only when accessed (at runtime), not at build time
export const env = {
  // Database
  get DATABASE_URL() {
    return getRequiredEnv('DATABASE_URL');
  },

  // Supabase
  get NEXT_PUBLIC_SUPABASE_URL() {
    return getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL');
  },
  get NEXT_PUBLIC_SUPABASE_ANON_KEY() {
    return getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  },

  // Application
  get NEXT_PUBLIC_BASE_URL() {
    return getRequiredEnv('NEXT_PUBLIC_BASE_URL');
  },

  // Cron
  get CRON_SECRET() {
    return getRequiredEnv('CRON_SECRET');
  },

  // Node environment
  get NODE_ENV() {
    return getRequiredEnv('NODE_ENV');
  },
} as const;
