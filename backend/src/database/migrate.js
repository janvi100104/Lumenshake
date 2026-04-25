const fs = require('fs');
const path = require('path');
const db = require('../database/db');

const runMigrations = async () => {
  console.log('🚀 Running database migrations...');
  
  const migrationsDir = path.join(__dirname, '../../migrations');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  for (const file of migrationFiles) {
    console.log(`📄 Running migration: ${file}`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    
    try {
      await db.query(sql);
      console.log(`✅ Migration ${file} completed`);
    } catch (error) {
      console.error(`❌ Migration ${file} failed:`, error.message);
      throw error;
    }
  }

  console.log('✅ All migrations completed successfully');
  process.exit(0);
};

runMigrations().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
