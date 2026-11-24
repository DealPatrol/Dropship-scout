// lib/native/iap.ts
// StoreKit 2 purchase flow for the hosted workspace when it runs inside the iOS
// app. The App Store charges the user; the signed transaction is then sent to
// /api/billing/apple, which verifies it and unlocks Pro on the account.

import { DropshipScoutNative, type SignedTransaction, type StoreProduct } from './native-plugin'
import { IOS_PRO_PRODUCT_IDS } from './platform'

export const IOS_PRO_IDS = [IOS_PRO_PRODUCT_IDS.month, IOS_PRO_PRODUCT_IDS.year]

export interface AppleSyncResult {
  plan: 'free' | 'pro'
  source: 'apple' | 'stripe' | null
  expiresAt: string | null
  error?: string
}

export async function loadProProducts(): Promise<StoreProduct[]> {
  const { products } = await DropshipScoutNative.getProducts({ productIds: IOS_PRO_IDS })
  // Monthly first.
  return products.sort((a, b) => IOS_PRO_IDS.indexOf(a.id as never) - IOS_PRO_IDS.indexOf(b.id as never))
}

export async function syncTransactions(transactions: SignedTransaction[]): Promise<AppleSyncResult> {
  const response = await fetch('/api/billing/apple', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transactions: transactions.map(t => t.jws) }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Could not confirm the App Store purchase')
  return data as AppleSyncResult
}

/** Purchase a Pro subscription. appAccountToken ties the transaction to this account's id. */
export async function purchasePro(productId: string, userId: string): Promise<{ status: string; sync?: AppleSyncResult }> {
  const result = await DropshipScoutNative.purchase({ productId, appAccountToken: userId })
  if (result.status !== 'purchased' || !result.transaction) return { status: result.status }
  return { status: 'purchased', sync: await syncTransactions([result.transaction]) }
}

export async function restorePro(): Promise<AppleSyncResult | null> {
  const { transactions } = await DropshipScoutNative.restore()
  if (transactions.length === 0) return null
  return syncTransactions(transactions)
}

/** Quietly refreshes the server with current entitlements (renewals, refunds, Ask to Buy). */
export async function refreshEntitlements(): Promise<AppleSyncResult | null> {
  const { transactions } = await DropshipScoutNative.currentEntitlements()
  if (transactions.length === 0) return null
  return syncTransactions(transactions)
}
