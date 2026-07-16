'use server'

import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/index'
import { supplierCredentials } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import type { SupplierCredential, SupplierPlatform } from '@/lib/types'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function getSupplierCredentials(supplier: SupplierPlatform): Promise<SupplierCredential | null> {
  const userId = await getUserId()
  
  const result = await db
    .select()
    .from(supplierCredentials)
    .where(
      and(
        eq(supplierCredentials.userId, userId),
        eq(supplierCredentials.supplier, supplier)
      )
    )
    .limit(1)

  return (result[0] as SupplierCredential) || null
}

export async function getAllSupplierCredentials(): Promise<SupplierCredential[]> {
  const userId = await getUserId()
  
  return db
    .select()
    .from(supplierCredentials)
    .where(eq(supplierCredentials.userId, userId)) as Promise<SupplierCredential[]>
}

export async function saveSupplierCredentials(data: {
  supplier: SupplierPlatform
  apiKey?: string
  apiSecret?: string
  email?: string
  password?: string
  metadata?: Record<string, any>
}): Promise<SupplierCredential> {
  const userId = await getUserId()

  // Check if credentials already exist
  const existing = await getSupplierCredentials(data.supplier)

  if (existing) {
    // Update existing
    const result = await db
      .update(supplierCredentials)
      .set({
        apiKey: data.apiKey,
        apiSecret: data.apiSecret,
        email: data.email,
        password: data.password,
        metadata: data.metadata,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(supplierCredentials.userId, userId),
          eq(supplierCredentials.supplier, data.supplier)
        )
      )
      .returning()

    revalidatePath('/dashboard/suppliers')
    return result[0] as SupplierCredential
  } else {
    // Create new
    const result = await db
      .insert(supplierCredentials)
      .values({
        userId,
        supplier: data.supplier,
        apiKey: data.apiKey,
        apiSecret: data.apiSecret,
        email: data.email,
        password: data.password,
        metadata: data.metadata,
        isActive: true,
      })
      .returning()

    revalidatePath('/dashboard/suppliers')
    return result[0] as SupplierCredential
  }
}

export async function deleteSupplierCredentials(supplier: SupplierPlatform): Promise<void> {
  const userId = await getUserId()

  await db
    .delete(supplierCredentials)
    .where(
      and(
        eq(supplierCredentials.userId, userId),
        eq(supplierCredentials.supplier, supplier)
      )
    )

  revalidatePath('/dashboard/suppliers')
}

export async function toggleSupplierActive(supplier: SupplierPlatform, isActive: boolean): Promise<void> {
  const userId = await getUserId()

  await db
    .update(supplierCredentials)
    .set({ isActive })
    .where(
      and(
        eq(supplierCredentials.userId, userId),
        eq(supplierCredentials.supplier, supplier)
      )
    )

  revalidatePath('/dashboard/suppliers')
}
