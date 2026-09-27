import { beforeAll, describe, expect, it } from 'vitest'
import { createSessionToken, verifySessionToken } from '@/lib/session'

describe('session authentication', () => {
  beforeAll(() => {
    process.env.AUTH_SECRET = 'test-secret-that-is-long-enough-for-session-signing'
  })

  it('round-trips a signed user session', async () => {
    const user = { id: '1ad96106-6055-4b8f-bcea-7d9cbba22035', email: 'cole@example.com' }
    const token = await createSessionToken(user)

    await expect(verifySessionToken(token)).resolves.toEqual(user)
  })

  it('rejects a tampered session token', async () => {
    const token = await createSessionToken({ id: 'user-1', email: 'cole@example.com' })

    await expect(verifySessionToken(`${token}tampered`)).resolves.toBeNull()
  })
})
