import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

function makeClient(): SupabaseClient {
  try {
    if (supabaseUrl && supabaseAnonKey) {
      return createClient(supabaseUrl, supabaseAnonKey)
    }
  } catch (err) {
    console.error('[v0] Failed to create Supabase client:', err)
  }
  // No valid credentials — the app will run against a non-functional placeholder.
  // Warn loudly so this misconfiguration is not silent (it blocks all reads/writes).
  console.warn(
    '[v0] Supabase is NOT configured. Missing NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Auth and safe_place_pages reads/writes will fail until these environment variables are set.',
  )
  return createClient('https://placeholder.supabase.co', 'placeholder-anon-key')
}

export const supabase = makeClient()
