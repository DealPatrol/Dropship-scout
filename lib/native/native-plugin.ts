// lib/native/native-plugin.ts
// JS side of the app's own Swift plugin (ios/App/App/DropshipScoutNativePlugin.swift).
// StoreKit 2 subscriptions + Face ID / passcode lock. No third-party SDK.

import { registerPlugin, type PluginListenerHandle } from '@capacitor/core'

export interface StoreProduct {
  id: string
  displayName: string
  description: string
  displayPrice: string
  price: number
  /** "month" or "year" for auto-renewable subscriptions. */
  period: string | null
  /** Display text of an introductory offer, if App Store Connect has one. */
  introOffer: string | null
}

export interface SignedTransaction {
  productId: string
  originalTransactionId: string
  transactionId: string
  /** StoreKit 2 JWS (jwsRepresentation). The server verifies it against Apple's root CA. */
  jws: string
  expiresDate: string | null
  revoked: boolean
}

export type PurchaseStatus = 'purchased' | 'cancelled' | 'pending' | 'unknown'

export interface DropshipScoutNativePlugin {
  getProducts(options: { productIds: string[] }): Promise<{ products: StoreProduct[] }>
  purchase(options: { productId: string; appAccountToken?: string }): Promise<{ status: PurchaseStatus; transaction?: SignedTransaction }>
  restore(): Promise<{ transactions: SignedTransaction[] }>
  currentEntitlements(): Promise<{ transactions: SignedTransaction[] }>
  manageSubscriptions(): Promise<void>
  biometryInfo(): Promise<{ available: boolean; type: 'faceId' | 'touchId' | 'opticId' | 'passcode' }>
  authenticate(options: { reason: string }): Promise<{ ok: boolean; error?: string }>
  addListener(event: 'transactionUpdated', listener: (data: { transaction: SignedTransaction }) => void): Promise<PluginListenerHandle>
}

export const DropshipScoutNative = registerPlugin<DropshipScoutNativePlugin>('DropshipScoutNative')
