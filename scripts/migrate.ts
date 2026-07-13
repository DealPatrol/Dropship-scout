import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const migrations = [
  `CREATE TABLE IF NOT EXISTS "user" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT,
    "email" TEXT UNIQUE NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
    "image" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  
  `CREATE TABLE IF NOT EXISTS "session" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP NOT NULL,
    "token" TEXT UNIQUE NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    CONSTRAINT session_userId_fk FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
  )`,
  
  `CREATE TABLE IF NOT EXISTS "account" (
    "id" TEXT PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP,
    "refreshTokenExpiresAt" TIMESTAMP,
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT account_userId_fk FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
  )`,
  
  `CREATE TABLE IF NOT EXISTS "verification" (
    "id" TEXT PRIMARY KEY,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
  )`,
  
  `CREATE TABLE IF NOT EXISTS "saved_products" (
    "id" SERIAL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "price" DECIMAL(10, 2),
    "image" TEXT,
    "supplier" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  
  `CREATE TABLE IF NOT EXISTS "search_sessions" (
    "id" SERIAL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "results" JSONB,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
]

async function runMigrations() {
  const client = await pool.connect()
  try {
    for (const migration of migrations) {
      console.log('Running migration...')
      await client.query(migration)
      console.log('Migration completed')
    }
    console.log('All migrations completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

runMigrations()
