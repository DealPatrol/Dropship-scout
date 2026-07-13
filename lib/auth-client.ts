import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? window.location.origin,
})

export const { signUp, signIn, signOut, useSession } = authClient
export type { Session } from 'better-auth/types'
