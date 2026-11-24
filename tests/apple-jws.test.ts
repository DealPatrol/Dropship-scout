import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { CompactSign, importPKCS8 } from 'jose'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { APPLE_ROOT_CA_G3_PEM, APPLE_ROOT_CA_G3_SHA256, AppleJwsError, verifyAppleJws, type AppleTransactionPayload } from '@/lib/apple/app-store-jws'
import { X509Certificate } from 'node:crypto'
import { checkTransactionForUser, isActive, pickEntitlement } from '@/lib/apple/entitlement'
import { IOS_BUNDLE_ID, IOS_PRO_PRODUCT_IDS } from '@/lib/native/platform'

// A throwaway chain generated per run with openssl (NOT Apple). Production pins Apple Root CA - G3.
let dir = ''
let chain: { root: string; int: string; leaf: string; leafKey: string; otherRoot: string }

function sh(...args: string[]) {
  execFileSync('openssl', args, { cwd: dir, stdio: 'ignore' })
}

function der(pem: string): string {
  return pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '')
}

async function sign(payload: object, x5c = [der(chain.leaf), der(chain.int), der(chain.root)]): Promise<string> {
  const key = await importPKCS8(chain.leafKey, 'ES256')
  return new CompactSign(new TextEncoder().encode(JSON.stringify(payload))).setProtectedHeader({ alg: 'ES256', x5c }).sign(key)
}

beforeAll(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'ds-jws-'))
  writeFileSync(path.join(dir, 'ca.ext'), 'basicConstraints=critical,CA:TRUE\nkeyUsage=critical,keyCertSign,cRLSign\n')
  writeFileSync(path.join(dir, 'leaf.ext'), 'basicConstraints=critical,CA:FALSE\nkeyUsage=critical,digitalSignature\n')
  for (const name of ['root', 'int', 'leaf', 'other']) sh('ecparam', '-name', 'prime256v1', '-genkey', '-noout', '-out', `${name}.key`)
  sh('req', '-x509', '-new', '-key', 'root.key', '-sha256', '-days', '3650', '-subj', '/CN=Test Root', '-addext', 'basicConstraints=critical,CA:TRUE', '-addext', 'keyUsage=critical,keyCertSign,cRLSign', '-out', 'root.pem')
  sh('req', '-x509', '-new', '-key', 'other.key', '-sha256', '-days', '3650', '-subj', '/CN=Other Root', '-addext', 'basicConstraints=critical,CA:TRUE', '-out', 'other.pem')
  sh('req', '-new', '-key', 'int.key', '-subj', '/CN=Test Intermediate', '-out', 'int.csr')
  sh('x509', '-req', '-in', 'int.csr', '-CA', 'root.pem', '-CAkey', 'root.key', '-CAcreateserial', '-days', '3000', '-sha256', '-extfile', 'ca.ext', '-out', 'int.pem')
  sh('req', '-new', '-key', 'leaf.key', '-subj', '/CN=Test Leaf', '-out', 'leaf.csr')
  sh('x509', '-req', '-in', 'leaf.csr', '-CA', 'int.pem', '-CAkey', 'int.key', '-CAcreateserial', '-days', '2000', '-sha256', '-extfile', 'leaf.ext', '-out', 'leaf.pem')
  sh('pkcs8', '-topk8', '-nocrypt', '-in', 'leaf.key', '-out', 'leaf.pk8')
  const read = (f: string) => readFileSync(path.join(dir, f), 'utf8')
  chain = { root: read('root.pem'), int: read('int.pem'), leaf: read('leaf.pem'), leafKey: read('leaf.pk8'), otherRoot: read('other.pem') }
})

afterAll(() => {
  if (dir) rmSync(dir, { recursive: true, force: true })
})

const userId = '3f2b6c1e-8d4a-4f6b-9a1e-2c3d4e5f6a7b'
function tx(overrides: Partial<AppleTransactionPayload> = {}): AppleTransactionPayload {
  return {
    transactionId: '2000000123',
    originalTransactionId: '2000000100',
    bundleId: IOS_BUNDLE_ID,
    productId: IOS_PRO_PRODUCT_IDS.month,
    purchaseDate: Date.now() - 1000,
    expiresDate: Date.now() + 30 * 86400_000,
    appAccountToken: userId,
    environment: 'Sandbox',
    type: 'Auto-Renewable Subscription',
    signedDate: Date.now(),
    ...overrides,
  }
}

describe('Apple JWS verification', () => {
  it('pins the real Apple Root CA - G3', () => {
    expect(new X509Certificate(APPLE_ROOT_CA_G3_PEM).fingerprint256).toBe(APPLE_ROOT_CA_G3_SHA256)
  })

  it('accepts a payload signed by a chain to the trusted root', async () => {
    const jws = await sign(tx())
    const payload = await verifyAppleJws<AppleTransactionPayload>(jws, { rootPem: chain.root, skipOidCheck: true })
    expect(payload.productId).toBe(IOS_PRO_PRODUCT_IDS.month)
  })

  it('rejects the chain against the pinned Apple root', async () => {
    await expect(verifyAppleJws(await sign(tx()))).rejects.toBeInstanceOf(AppleJwsError)
  })

  it('rejects a chain ending in a different root', async () => {
    await expect(verifyAppleJws(await sign(tx()), { rootPem: chain.otherRoot, skipOidCheck: true })).rejects.toThrow(/not rooted/)
  })

  it('requires the Apple marker OIDs when not skipped', async () => {
    await expect(verifyAppleJws(await sign(tx()), { rootPem: chain.root })).rejects.toThrow(/App Store signing/)
  })

  it('rejects a tampered payload', async () => {
    const [h, , s] = (await sign(tx())).split('.')
    const forged = Buffer.from(JSON.stringify(tx({ productId: IOS_PRO_PRODUCT_IDS.year }))).toString('base64url')
    await expect(verifyAppleJws(`${h}.${forged}.${s}`, { rootPem: chain.root, skipOidCheck: true })).rejects.toThrow(/Signature/)
  })

  it('rejects malformed input and missing chains', async () => {
    await expect(verifyAppleJws('nope')).rejects.toBeInstanceOf(AppleJwsError)
    await expect(verifyAppleJws(await sign(tx(), [der(chain.leaf)]), { rootPem: chain.root })).rejects.toThrow(/chain/)
  })
})

describe('entitlement rules', () => {
  it('links only to the account in appAccountToken', () => {
    expect(checkTransactionForUser(tx(), userId, null).ok).toBe(true)
    expect(checkTransactionForUser(tx({ appAccountToken: userId.toUpperCase() }), userId, null).ok).toBe(true)
    const other = checkTransactionForUser(tx({ appAccountToken: '00000000-0000-4000-8000-000000000000' }), userId, null)
    expect(other.ok).toBe(false)
  })

  it('accepts a token-less transaction only when already linked', () => {
    expect(checkTransactionForUser(tx({ appAccountToken: undefined }), userId, null).ok).toBe(false)
    expect(checkTransactionForUser(tx({ appAccountToken: undefined }), userId, '2000000100').ok).toBe(true)
  })

  it('rejects other apps and products', () => {
    expect(checkTransactionForUser(tx({ bundleId: 'com.example.other' }), userId, null).ok).toBe(false)
    expect(checkTransactionForUser(tx({ productId: 'com.colecollins.dropshipscout.coins' }), userId, null).ok).toBe(false)
  })

  it('treats expiry with a grace window and revocation as inactive', () => {
    const now = Date.now()
    expect(isActive({ expiresDate: now + 1000 }, now)).toBe(true)
    expect(isActive({ expiresDate: now - 86400_000 }, now)).toBe(true)
    expect(isActive({ expiresDate: now - 4 * 86400_000 }, now)).toBe(false)
    expect(isActive({ expiresDate: now + 1000, revocationDate: now }, now)).toBe(false)
  })

  it('picks the latest non-revoked transaction', () => {
    const a = tx({ transactionId: 'a', expiresDate: 10 })
    const b = tx({ transactionId: 'b', expiresDate: 30, revocationDate: 5 })
    const c = tx({ transactionId: 'c', expiresDate: 20 })
    expect(pickEntitlement([a, b, c])?.transactionId).toBe('c')
    expect(pickEntitlement([])).toBeNull()
  })
})
