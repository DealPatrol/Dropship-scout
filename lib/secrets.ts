import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'

const PREFIX = 'enc:v1'

function encryptionKey(): Buffer {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('Missing required environment variable: AUTH_SECRET')
  return createHash('sha256').update(secret).digest()
}

export function encryptSecret(value: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [PREFIX, iv.toString('base64url'), tag.toString('base64url'), encrypted.toString('base64url')].join(':')
}

export function decryptSecret(value: string): string {
  if (!value.startsWith(`${PREFIX}:`)) return value

  const [, , ivEncoded, tagEncoded, encryptedEncoded] = value.split(':')
  if (!ivEncoded || !tagEncoded || !encryptedEncoded) {
    throw new Error('Stored secret is malformed')
  }

  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivEncoded, 'base64url'))
  decipher.setAuthTag(Buffer.from(tagEncoded, 'base64url'))
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedEncoded, 'base64url')),
    decipher.final(),
  ]).toString('utf8')
}
