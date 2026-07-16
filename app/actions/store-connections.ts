'use server'

import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/index'
import { storeConnections } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import type { StoreConnection, StorePlatform } from '@/lib/types'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function getStoreConnections(): Promise<StoreConnection[]> {
  const userId = await getUserId()
  return db
    .select()
    .from(storeConnections)
    .where(eq(storeConnections.userId, userId)) as unknown as Promise<StoreConnection[]>
}

export async function getStoreConnection(id: number): Promise<StoreConnection | null> {
  const userId = await getUserId()
  const result = await db
    .select()
    .from(storeConnections)
    .where(and(eq(storeConnections.id, id), eq(storeConnections.userId, userId)))
    .limit(1)
  return (result[0] as unknown as StoreConnection) || null
}

export async function createStoreConnection(data: {
  platform: StorePlatform
  storeName: string
  storeUrl: string
  accessToken: string
  refreshToken?: string
  metadata?: Record<string, any>
}): Promise<StoreConnection> {
  const userId = await getUserId()
  
  const result = await db
    .insert(storeConnections)
    .values({
      userId,
      platform: data.platform,
      storeName: data.storeName,
      storeUrl: data.storeUrl,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      metadata: data.metadata,
      isActive: true,
      webhooksConfigured: false,
    })
    .returning()
  
  revalidatePath('/dashboard/stores')
  return result[0] as unknown as StoreConnection
}

export async function updateStoreConnection(
  id: number,
  data: Partial<Omit<StoreConnection, 'id' | 'userId' | 'createdAt'>>
): Promise<StoreConnection> {
  const userId = await getUserId()
  
  const result = await db
    .update(storeConnections)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(storeConnections.id, id), eq(storeConnections.userId, userId)))
    .returning()
  
  if (!result[0]) throw new Error('Store connection not found')
  revalidatePath('/dashboard/stores')
  return result[0] as unknown as StoreConnection
}

export async function deleteStoreConnection(id: number): Promise<void> {
  const userId = await getUserId()
  
  const result = await db
    .delete(storeConnections)
    .where(and(eq(storeConnections.id, id), eq(storeConnections.userId, userId)))
    .returning()
  
  if (!result[0]) throw new Error('Store connection not found')
  revalidatePath('/dashboard/stores')
}

export async function toggleStoreConnection(id: number, isActive: boolean): Promise<StoreConnection> {
  const userId = await getUserId()
  
  const result = await db
    .update(storeConnections)
    .set({ isActive })
    .where(and(eq(storeConnections.id, id), eq(storeConnections.userId, userId)))
    .returning()
  
  if (!result[0]) throw new Error('Store connection not found')
  revalidatePath('/dashboard/stores')
  return result[0] as unknown as StoreConnection
}

export async function updateWebhooksConfigured(id: number, configured: boolean): Promise<void> {
  const userId = await getUserId()
  
  await db
    .update(storeConnections)
    .set({ webhooksConfigured: configured })
    .where(and(eq(storeConnections.id, id), eq(storeConnections.userId, userId)))
  
  revalidatePath('/dashboard/stores')
}
