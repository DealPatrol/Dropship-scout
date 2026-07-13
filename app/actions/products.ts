'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db/index'
import { savedProducts } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { Product } from '@/lib/types'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function getSavedProducts() {
  const userId = await getUserId()
  return db
    .select()
    .from(savedProducts)
    .where(eq(savedProducts.userId, userId))
    .orderBy(desc(savedProducts.createdAt))
}

export async function saveProduct(product: Product) {
  const userId = await getUserId()
  
  await db.insert(savedProducts).values({
    userId,
    title: product.name,
    url: '',
    price: product.sellPrice ? String(product.sellPrice) : null,
    image: product.imageUrl,
    supplier: '',
    notes: product.aiInsight,
  })
  
  revalidatePath('/dashboard')
}

export async function deleteProduct(id: number) {
  const userId = await getUserId()
  await db
    .delete(savedProducts)
    .where(and(eq(savedProducts.id, id), eq(savedProducts.userId, userId)))
  
  revalidatePath('/dashboard')
}

export async function updateProduct(
  id: number,
  updates: Partial<Pick<typeof savedProducts.$inferInsert, 'title' | 'notes' | 'price'>>
) {
  const userId = await getUserId()
  await db
    .update(savedProducts)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(eq(savedProducts.id, id), eq(savedProducts.userId, userId)))
  
  revalidatePath('/dashboard')
}
