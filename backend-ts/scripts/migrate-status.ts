import { readdir } from 'fs/promises';
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

  // Check if tracking table exists
  const { rows: tableExists } = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_name = '${TRACKING_TABLE}'
    )
  `);

  const appliedSet = new Set<string>();

  if (tableExists[0].exists) {
    const { rows: applied } = await client.query(
      `SELECT name, applied_at FROM ${TRACKING_TABLE} ORDER BY id`,
    );
    for (const row of applied) {
      appliedSet.add(row.name);
    }
  }

  // Find all .sql files
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

  console.log('Migration Status:\n');
  for (const file of migrationFiles) {
    const status = appliedSet.has(file) ? '✓ applied' : '○ pending';
    console.log(`  ${status}  ${file}`);
  }

  const pending = migrationFiles.filter((f) => !appliedSet.has(f));
  console.log(
    `\n${appliedSet.size} applied, ${pending.length} pending`,
  );

  await client.end();
}

main().catch((err) => {
  console.error('Failed to check status:', err);
  process.exit(1);
});
