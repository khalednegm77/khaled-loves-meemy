import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

function makeClient(): SupabaseClient {
  if (supabaseConfigured) {
    console.log('[v0] Supabase configured with URL:', supabaseUrl?.substring(0, 30) + '...')
    return createClient(supabaseUrl!, supabaseAnonKey!)
  }

  console.warn(
    '[v0] Supabase NOT configured. Missing NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY.',
  )
  return createClient('https://placeholder.supabase.co', 'placeholder-anon-key')
}

export const supabase = makeClient()
