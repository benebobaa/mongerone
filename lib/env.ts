/**
 * Environment variable validation
 * All fields are required and will throw an error if missing or empty
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

// Validate all required environment variables at module initialization
export const env = {
  // Database
  DATABASE_URL: getRequiredEnv('DATABASE_URL'),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),

  // Application
  NEXT_PUBLIC_BASE_URL: getRequiredEnv('NEXT_PUBLIC_BASE_URL'),

  // Cron
  CRON_SECRET: getRequiredEnv('CRON_SECRET'),

  // Node environment
  NODE_ENV: getRequiredEnv('NODE_ENV'),
} as const;

// Validate immediately on import
console.log('✓ All required environment variables validated');
