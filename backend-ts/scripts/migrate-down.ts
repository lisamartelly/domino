import { readFile } from 'fs/promises';
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

  // Check tracking table exists
  const { rows: tableCheck } = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_name = '${TRACKING_TABLE}'
    )
  `);

  if (!tableCheck[0].exists) {
    console.log('No migrations have been applied yet.');
    await client.end();
    return;
  }

  // Get the last applied migration
  const { rows } = await client.query(
    `SELECT id, name FROM ${TRACKING_TABLE} ORDER BY id DESC LIMIT 1`,
  );

  if (rows.length === 0) {
    console.log('No migrations to roll back.');
    await client.end();
    return;
  }

  const lastMigration = rows[0].name as string;

  // Resolve the down file path
  // e.g. "add_events_tables.sql" → "add_events_tables.down.sql"
  // e.g. "0_init/migration.sql" → "0_init/migration.down.sql"
  const downFile = lastMigration.replace(/\.sql$/, '.down.sql');
  const downPath = join(MIGRATIONS_DIR, downFile);

  let downSql: string;
  try {
    downSql = await readFile(downPath, 'utf-8');
  } catch {
    console.error(`No down migration found: ${downFile}`);
    console.error(
      `Create the file at prisma/migrations/${downFile} to enable rollback.`,
    );
    process.exit(1);
  }

  console.log(`Rolling back: ${lastMigration}`);
  try {
    await client.query('BEGIN');
    await client.query(downSql);
    await client.query(`DELETE FROM ${TRACKING_TABLE} WHERE id = $1`, [
      rows[0].id,
    ]);
    await client.query('COMMIT');
    console.log(`  ✓ Rolled back successfully`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`  ✗ Rollback failed:`, err);
    process.exit(1);
  }

  await client.end();
}

main().catch((err) => {
  console.error('Rollback failed:', err);
  process.exit(1);
});
