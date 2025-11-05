import 'reflect-metadata';
import { AppDataSource } from '@database/data-source';
import { seedInitialData } from './seed-initial-data';

async function run() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    console.log('✅ DataSource initialized');

    await seedInitialData();
    console.log('🌱 Seeding completed');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('🔌 DataSource closed');
    }
    process.exit(0);
  }
}

run();