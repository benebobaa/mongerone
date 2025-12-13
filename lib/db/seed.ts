import { db } from './index';
import { currencies } from './schema';
import { currenciesData } from './seeds/currencies';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Seed currencies
    console.log('📊 Seeding currencies...');
    await db.insert(currencies).values(currenciesData).onConflictDoNothing();
    console.log('✅ Currencies seeded successfully');

    // Note: Default categories will be created per user, so we don't seed them globally
    // They will be created when a user signs up via ensureProfile action

    console.log('✨ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }

  process.exit(0);
}

seed();
