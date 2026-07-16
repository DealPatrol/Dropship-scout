import {
  pgTable,
  text,
  timestamp,
  boolean,
  serial,
  decimal,
  jsonb,
  integer,
  index,
} from 'drizzle-orm/pg-core'

// --- Better Auth required tables -------------------------------------------
// Column names are camelCase to match Better Auth's defaults. Do not rename.

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

// --- App tables ------------------------------------------------------------

export const savedProducts = pgTable('saved_products', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  title: text('title').notNull(),
  url: text('url').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }),
  image: text('image'),
  supplier: text('supplier'),
  notes: text('notes'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const searchSessions = pgTable('search_sessions', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  query: text('query').notNull(),
  results: jsonb('results'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

// --- Fulfillment System Tables ---

export const storeConnections = pgTable('store_connections', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  platform: text('platform').notNull(), // 'shopify' | 'woocommerce'
  storeName: text('storeName').notNull(),
  storeUrl: text('storeUrl').notNull(),
  accessToken: text('accessToken').notNull(),
  refreshToken: text('refreshToken'),
  isActive: boolean('isActive').notNull().default(true),
  webhooksConfigured: boolean('webhooksConfigured').notNull().default(false),
  metadata: jsonb('metadata'), // Additional platform-specific data
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const supplierCredentials = pgTable('supplier_credentials', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  supplier: text('supplier').notNull(), // 'aliexpress', 'dhgate', etc.
  apiKey: text('apiKey'),
  apiSecret: text('apiSecret'),
  email: text('email'),
  password: text('password'), // encrypted
  metadata: jsonb('metadata'),
  isActive: boolean('isActive').notNull().default(true),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const productListings = pgTable('product_listings', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  storeConnectionId: integer('storeConnectionId').notNull(),
  storeProductId: text('storeProductId').notNull(), // Shopify/WC product ID
  title: text('title').notNull(),
  description: text('description'),
  costPrice: decimal('costPrice', { precision: 10, scale: 2 }).notNull(),
  sellingPrice: decimal('sellingPrice', { precision: 10, scale: 2 }).notNull(),
  margin: decimal('margin', { precision: 5, scale: 2 }).notNull(), // percentage
  supplier: text('supplier').notNull(),
  supplierProductId: text('supplierProductId'),
  image: text('image'),
  isActive: boolean('isActive').notNull().default(true),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  storeConnectionId: integer('storeConnectionId').notNull(),
  storeOrderId: text('storeOrderId').notNull().unique(), // Shopify/WC order ID
  customerName: text('customerName').notNull(),
  customerEmail: text('customerEmail').notNull(),
  shippingAddress: jsonb('shippingAddress').notNull(),
  totalAmount: decimal('totalAmount', { precision: 10, scale: 2 }).notNull(),
  totalCost: decimal('totalCost', { precision: 10, scale: 2 }).notNull(),
  profit: decimal('profit', { precision: 10, scale: 2 }).notNull(),
  status: text('status').notNull().default('pending'), // pending, submitted, shipped, delivered, failed
  supplier: text('supplier'), // Which supplier to fulfill from
  supplierOrderId: text('supplierOrderId'),
  trackingNumber: text('trackingNumber'),
  notes: text('notes'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('orderId').notNull(),
  productListingId: integer('productListingId').notNull(),
  quantity: integer('quantity').notNull(),
  unitCost: decimal('unitCost', { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal('unitPrice', { precision: 10, scale: 2 }).notNull(),
  lineTotal: decimal('lineTotal', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const pricingRules = pgTable('pricing_rules', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  markupType: text('markupType').notNull(), // 'percentage' | 'fixed'
  markupValue: decimal('markupValue', { precision: 10, scale: 2 }).notNull(),
  minPrice: decimal('minPrice', { precision: 10, scale: 2 }),
  maxPrice: decimal('maxPrice', { precision: 10, scale: 2 }),
  appliedToSuppliers: jsonb('appliedToSuppliers'), // array of supplier names
  isActive: boolean('isActive').notNull().default(true),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const fulfillmentHistory = pgTable('fulfillment_history', {
  id: serial('id').primaryKey(),
  orderId: integer('orderId').notNull(),
  status: text('status').notNull(),
  message: text('message'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})
