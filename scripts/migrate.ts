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
  
  `CREATE TABLE IF NOT EXISTS "store_connections" (
    "id" SERIAL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "storeName" TEXT NOT NULL,
    "storeUrl" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "webhooksConfigured" BOOLEAN NOT NULL DEFAULT FALSE,
    "metadata" JSONB,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  
  `CREATE TABLE IF NOT EXISTS "supplier_credentials" (
    "id" SERIAL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "supplier" TEXT NOT NULL,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "email" TEXT,
    "password" TEXT,
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  
  `CREATE TABLE IF NOT EXISTS "product_listings" (
    "id" SERIAL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "storeConnectionId" INTEGER NOT NULL,
    "storeProductId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "costPrice" DECIMAL(10, 2) NOT NULL,
    "sellingPrice" DECIMAL(10, 2) NOT NULL,
    "margin" DECIMAL(5, 2) NOT NULL,
    "supplier" TEXT NOT NULL,
    "supplierProductId" TEXT,
    "image" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  
  `CREATE TABLE IF NOT EXISTS "orders" (
    "id" SERIAL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "storeConnectionId" INTEGER NOT NULL,
    "storeOrderId" TEXT NOT NULL UNIQUE,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "shippingAddress" JSONB NOT NULL,
    "totalAmount" DECIMAL(10, 2) NOT NULL,
    "totalCost" DECIMAL(10, 2) NOT NULL,
    "profit" DECIMAL(10, 2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "supplier" TEXT,
    "supplierOrderId" TEXT,
    "trackingNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  
  `CREATE TABLE IF NOT EXISTS "order_items" (
    "id" SERIAL PRIMARY KEY,
    "orderId" INTEGER NOT NULL,
    "productListingId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" DECIMAL(10, 2) NOT NULL,
    "unitPrice" DECIMAL(10, 2) NOT NULL,
    "lineTotal" DECIMAL(10, 2) NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  
  `CREATE TABLE IF NOT EXISTS "pricing_rules" (
    "id" SERIAL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "markupType" TEXT NOT NULL,
    "markupValue" DECIMAL(10, 2) NOT NULL,
    "minPrice" DECIMAL(10, 2),
    "maxPrice" DECIMAL(10, 2),
    "appliedToSuppliers" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  
  `CREATE TABLE IF NOT EXISTS "fulfillment_history" (
    "id" SERIAL PRIMARY KEY,
    "orderId" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "metadata" JSONB,
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
