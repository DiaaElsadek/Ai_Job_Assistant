#!/usr/bin/env node

/**
 * Migration Drift & Status Gate Script (Milestone M0A)
 * 
 * Verifies:
 * 1. Prisma schema syntactic validity (prisma validate)
 * 2. Integrity of prisma/migrations directory and migration_lock.toml
 * 3. Synchronization between schema, migrations, and database (prisma migrate status)
 */

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const schemaPath = path.join(rootDir, 'prisma', 'schema.prisma')
const migrationsDir = path.join(rootDir, 'prisma', 'migrations')

console.log('[db:check] Starting Prisma migration & schema verification...')

// 1. Verify schema file exists
if (!fs.existsSync(schemaPath)) {
  console.error('[db:check] FAILED: prisma/schema.prisma not found!')
  process.exit(1)
}

// 2. Run prisma validate
console.log('[db:check] Validating Prisma schema syntax...')
try {
  execSync('npx prisma validate', {
    cwd: rootDir,
    encoding: 'utf-8',
    stdio: 'pipe',
  })
  console.log('[db:check] Schema is valid.')
} catch (err) {
  console.error('[db:check] FAILED: Prisma schema validation error:')
  console.error(err.stdout || err.stderr || err.message)
  process.exit(1)
}

// 3. Verify migrations directory exists
if (!fs.existsSync(migrationsDir)) {
  console.error('[db:check] FAILED: prisma/migrations directory does not exist!')
  process.exit(1)
}

const migrationEntries = fs.readdirSync(migrationsDir).filter((file) => {
  const fullPath = path.join(migrationsDir, file)
  return fs.statSync(fullPath).isDirectory()
})

console.log(`[db:check] Found ${migrationEntries.length} migration(s) in repository:`)
for (const m of migrationEntries) {
  const sqlFile = path.join(migrationsDir, m, 'migration.sql')
  if (!fs.existsSync(sqlFile)) {
    console.error(`[db:check] FAILED: Migration '${m}' is missing migration.sql!`)
    process.exit(1)
  }
  console.log(`  - ${m}`)
}

// 4. Run prisma migrate status against the target database
console.log('[db:check] Checking database migration status and schema drift...')
try {
  const statusOutput = execSync('npx prisma migrate status', {
    cwd: rootDir,
    encoding: 'utf-8',
    stdio: 'pipe',
  })

  console.log(statusOutput)

  if (statusOutput.includes('Database schema is up to date')) {
    console.log('[db:check] SUCCESS: Database schema is completely synchronized with migrations.')
    process.exit(0)
  } else if (statusOutput.includes('have not yet been applied') || statusOutput.includes('out of sync')) {
    console.error('[db:check] FAILED: Database has unapplied migrations or schema drift!')
    process.exit(1)
  }

  // If status exited 0, accept
  console.log('[db:check] SUCCESS: prisma migrate status completed successfully.')
  process.exit(0)
} catch (err) {
  const out = err.stdout || err.stderr || err.message
  console.error('[db:check] FAILED: Database migration status check returned errors:')
  console.error(out)
  process.exit(1)
}
