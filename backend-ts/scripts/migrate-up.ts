import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { config } from 'dotenv';
import pg from 'pg';

config({ path: join(__dirname, '..', '.env') });

const { Client } = pg;

const MIGRATIONS_DIR = join(__dirname, '..', 'prisma', 'migrations');
const TRACKING_TABLE = '_applied_migrations';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL not set. Check your .env file.');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  // Ensure tracking table exists
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${TRACKING_TABLE} (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Get already-applied migrations
  const { rows: applied } = await client.query(
    `SELECT name FROM ${TRACKING_TABLE} ORDER BY id`,
  );
  const appliedSet = new Set(applied.map((r) => r.name));

  // Find all .sql files in the migrations directory (top-level + subdirs)
  const entries = await readdir(MIGRATIONS_DIR, { withFileTypes: true });
  const migrationFiles: string[] = [];

  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.sql') && !entry.name.endsWith('.down.sql')) {
      migrationFiles.push(entry.name);
    } else if (entry.isDirectory()) {
      const subPath = join(MIGRATIONS_DIR, entry.name);
      const subEntries = await readdir(subPath);
      for (const sub of subEntries) {
        if (sub.endsWith('.sql') && !sub.endsWith('.down.sql')) {
          migrationFiles.push(`${entry.name}/${sub}`);
        }
      }
    }
  }

  migrationFiles.sort();

  // Apply unapplied migrations in order
  let count = 0;
  for (const file of migrationFiles) {
    if (appliedSet.has(file)) continue;

    const filePath = join(MIGRATIONS_DIR, file);
    const sql = await readFile(filePath, 'utf-8');

    console.log(`Applying: ${file}`);
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(
        `INSERT INTO ${TRACKING_TABLE} (name) VALUES ($1)`,
        [file],
      );
      await client.query('COMMIT');
      console.log(`  ✓ Applied successfully`);
      count++;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`  ✗ Failed to apply ${file}:`, err);
      process.exit(1);
    }
  }

  if (count === 0) {
    console.log('No new migrations to apply.');
  } else {
    console.log(`\nDone. Applied ${count} migration(s).`);
  }

  await client.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
