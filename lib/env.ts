// lib/env.ts
// Type-safe environment variable access with startup validation

function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required environment variable: ${key}`)
  return value
}

export const env = {
  // Supabase
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  supabaseServiceKey: () => requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  // Anthropic
  anthropicApiKey: () => requireEnv('ANTHROPIC_API_KEY'),
  // App
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  // Cron secret (for vercel cron job protection)
  cronSecret: process.env.CRON_SECRET || '',
}
