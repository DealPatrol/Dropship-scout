// lib/supabase.ts
// Two clients: one for browser (publishable key), one for server (service role)
// For SSR auth flows, use lib/supabase/client.ts and lib/supabase/server.ts instead.

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// Support both legacy ANON_KEY and the new PUBLISHABLE_DEFAULT_KEY
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Browser client – safe to use in React components
export const supabase = createClient(supabaseUrl, supabasePublishableKey)

// Server client – only use in API routes, never expose to browser
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
