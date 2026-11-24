// lib/apple/app-store-jws.ts
// Verifies StoreKit 2 / App Store Server Notification JWS payloads without a
// third-party SDK: the x5c chain must end at Apple Root CA - G3 (pinned below),
// each certificate must be signed by the next, the leaf and intermediate must
// carry Apple's marker OIDs, and the ES256 signature must verify with the leaf.

import { X509Certificate } from 'node:crypto'
import { compactVerify, decodeProtectedHeader } from 'jose'

/** https://www.apple.com/certificateauthority/AppleRootCA-G3.cer (SHA-256 63:34:3A:BF:...:91:79) */
export const APPLE_ROOT_CA_G3_PEM = `-----BEGIN CERTIFICATE-----
MIICQzCCAcmgAwIBAgIILcX8iNLFS5UwCgYIKoZIzj0EAwMwZzEbMBkGA1UEAwwS
QXBwbGUgUm9vdCBDQSAtIEczMSYwJAYDVQQLDB1BcHBsZSBDZXJ0aWZpY2F0aW9u
IEF1dGhvcml0eTETMBEGA1UECgwKQXBwbGUgSW5jLjELMAkGA1UEBhMCVVMwHhcN
MTQwNDMwMTgxOTA2WhcNMzkwNDMwMTgxOTA2WjBnMRswGQYDVQQDDBJBcHBsZSBS
b290IENBIC0gRzMxJjAkBgNVBAsMHUFwcGxlIENlcnRpZmljYXRpb24gQXV0aG9y
aXR5MRMwEQYDVQQKDApBcHBsZSBJbmMuMQswCQYDVQQGEwJVUzB2MBAGByqGSM49
AgEGBSuBBAAiA2IABJjpLz1AcqTtkyJygRMc3RCV8cWjTnHcFBbZDuWmBSp3ZHtf
TjjTuxxEtX/1H7YyYl3J6YRbTzBPEVoA/VhYDKX1DyxNB0cTddqXl5dvMVztK517
IDvYuVTZXpmkOlEKMaNCMEAwHQYDVR0OBBYEFLuw3qFYM4iapIqZ3r6966/ayySr
MA8GA1UdEwEB/wQFMAMBAf8wDgYDVR0PAQH/BAQDAgEGMAoGCCqGSM49BAMDA2gA
MGUCMQCD6cHEFl4aXTQY2e3v9GwOAEZLuN+yRhHFD/3meoyhpmvOwgPUnPWTxnS4
at+qIxUCMG1mihDK1A3UT82NQz60imOlM27jbdoXt2QfyFMm+YhidDkLF1vLUagM
6BgD56KyKA==
-----END CERTIFICATE-----
`

export const APPLE_ROOT_CA_G3_SHA256 = '63:34:3A:BF:B8:9A:6A:03:EB:B5:7E:9B:3F:5F:A7:BE:7C:4F:5C:75:6F:30:17:B3:A8:C4:88:C3:65:3E:91:79'

// DER encodings of the extension OIDs Apple puts in StoreKit signing certificates.
// 1.2.840.113635.100.6.11.1 (leaf: Mac App Store receipt signing)
const LEAF_OID = Buffer.from('060a2a864886f76364060b01', 'hex')
// 1.2.840.113635.100.6.2.1 (intermediate: Apple Worldwide Developer Relations CA)
const INTERMEDIATE_OID = Buffer.from('060a2a864886f76364060201', 'hex')

export class AppleJwsError extends Error {}

export interface VerifyOptions {
  /** Trusted root PEM. Defaults to Apple Root CA - G3; tests pass their own. */
  rootPem?: string
  /** Skip the Apple marker OIDs (tests only). */
  skipOidCheck?: boolean
  now?: Date
}

function decodeSegment(segment: string): unknown {
  return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'))
}

export async function verifyAppleJws<T = Record<string, unknown>>(jws: string, options: VerifyOptions = {}): Promise<T> {
  if (typeof jws !== 'string' || jws.split('.').length !== 3 || jws.length > 20_000) {
    throw new AppleJwsError('Malformed signed payload')
  }
  let header: ReturnType<typeof decodeProtectedHeader>
  try {
    header = decodeProtectedHeader(jws)
  } catch {
    throw new AppleJwsError('Malformed signed payload header')
  }
  if (header.alg !== 'ES256') throw new AppleJwsError('Unexpected signing algorithm')
  const x5c = header.x5c
  if (!Array.isArray(x5c) || x5c.length !== 3) throw new AppleJwsError('Missing certificate chain')

  let certs: X509Certificate[]
  try {
    certs = x5c.map(b64 => new X509Certificate(Buffer.from(b64, 'base64')))
  } catch {
    throw new AppleJwsError('Invalid certificate chain')
  }
  const [leaf, intermediate, root] = certs
  const trusted = new X509Certificate(options.rootPem ?? APPLE_ROOT_CA_G3_PEM)
  if (!root.raw.equals(trusted.raw)) throw new AppleJwsError('Certificate chain is not rooted in Apple Root CA - G3')

  const now = (options.now ?? new Date()).getTime()
  for (const cert of certs) {
    if (Date.parse(cert.validFrom) > now || Date.parse(cert.validTo) < now) throw new AppleJwsError('Certificate expired or not yet valid')
  }
  if (!leaf.verify(intermediate.publicKey) || !leaf.checkIssued(intermediate)) throw new AppleJwsError('Leaf certificate not issued by the intermediate')
  if (!intermediate.verify(root.publicKey) || !intermediate.checkIssued(root)) throw new AppleJwsError('Intermediate certificate not issued by the root')
  if (!intermediate.ca) throw new AppleJwsError('Intermediate is not a CA')
  if (!options.skipOidCheck && (!leaf.raw.includes(LEAF_OID) || !intermediate.raw.includes(INTERMEDIATE_OID))) {
    throw new AppleJwsError('Certificates are not App Store signing certificates')
  }

  try {
    const { payload } = await compactVerify(jws, leaf.publicKey, { algorithms: ['ES256'] })
    return JSON.parse(new TextDecoder().decode(payload)) as T
  } catch {
    throw new AppleJwsError('Signature verification failed')
  }
}

/** Unverified peek (for logging only). Never trust the result. */
export function peekJwsPayload(jws: string): unknown {
  try {
    return decodeSegment(jws.split('.')[1] ?? '')
  } catch {
    return null
  }
}

/** Fields of JWSTransactionDecodedPayload that the server uses. */
export interface AppleTransactionPayload {
  transactionId: string
  originalTransactionId: string
  bundleId: string
  productId: string
  purchaseDate: number
  expiresDate?: number
  revocationDate?: number
  appAccountToken?: string
  environment: 'Production' | 'Sandbox' | 'Xcode' | 'LocalTesting'
  type: string
  signedDate: number
}

/** Fields of ResponseBodyV2DecodedPayload (App Store Server Notifications V2). */
export interface AppleNotificationPayload {
  notificationType: string
  subtype?: string
  notificationUUID: string
  signedDate: number
  data?: {
    bundleId?: string
    environment?: string
    signedTransactionInfo?: string
    signedRenewalInfo?: string
  }
}
