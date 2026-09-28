import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('ERROR: Neither DIRECT_URL nor DATABASE_URL is set in environment.');
  process.exit(1);
}

const migrationFilePath = path.resolve('prisma/migrations/20260922100000_init/migration.sql');
if (!fs.existsSync(migrationFilePath)) {
  console.error(`ERROR: Migration file not found at ${migrationFilePath}`);
  process.exit(1);
}

const migrationSql = fs.readFileSync(migrationFilePath, 'utf8');
const checksum = crypto.createHash('sha256').update(migrationSql).digest('hex');
const migrationName = '20260922100000_init';

console.log(`Preparing to apply migration "${migrationName}" to Neon database...`);
console.log(`Migration checksum (SHA-256): ${checksum}`);

const client = new pg.Client({
  connectionString,
});

async function main() {
  await client.connect();
  console.log('Connected to Neon database successfully.');

  try {
    await client.query('BEGIN');

    // 1. Create _prisma_migrations table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
          "id" VARCHAR(36) PRIMARY KEY NOT NULL,
          "checksum" VARCHAR(64) NOT NULL,
          "finished_at" TIMESTAMPTZ,
          "migration_name" VARCHAR(255) NOT NULL,
          "logs" TEXT,
          "rolled_back_at" TIMESTAMPTZ,
          "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "applied_steps_count" INTEGER NOT NULL DEFAULT 0
      );
    `);

    // 2. Check if migration was already applied
    const checkRes = await client.query(
      'SELECT id, finished_at FROM "_prisma_migrations" WHERE "migration_name" = $1',
      [migrationName]
    );

    if (checkRes.rows.length > 0 && checkRes.rows[0].finished_at) {
      console.log(`Migration "${migrationName}" is already recorded as finished at ${checkRes.rows[0].finished_at}.`);
      await client.query('ROLLBACK');
      return;
    }

    const migrationId = crypto.randomUUID();

    // 3. Record migration started
    await client.query(
      `INSERT INTO "_prisma_migrations" ("id", "checksum", "migration_name", "started_at")
       VALUES ($1, $2, $3, now())`,
      [migrationId, checksum, migrationName]
    );

    console.log('Executing migration DDL statements...');
    await client.query(migrationSql);

    // 4. Record migration completed
    await client.query(
      `UPDATE "_prisma_migrations"
       SET "finished_at" = now(), "applied_steps_count" = 1
       WHERE "id" = $1`,
      [migrationId]
    );

    await client.query('COMMIT');
    console.log(`Successfully applied migration "${migrationName}" and recorded Prisma history.`);
  } catch (err) {
    console.error('Error applying migration:', err);
    try {
      await client.query('ROLLBACK');
    } catch (rbErr) {
      console.error('Error rolling back:', rbErr);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
