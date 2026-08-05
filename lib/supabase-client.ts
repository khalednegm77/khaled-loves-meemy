import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

console.log("[v0] Supabase URL set:", Boolean(supabaseUrl), "| URL starts with:", supabaseUrl?.slice(0, 30))
console.log("[v0] Supabase Anon Key set:", Boolean(supabaseAnonKey))

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

function makeClient(): SupabaseClient {
  try {
    if (supabaseUrl && supabaseAnonKey) {
      return createClient(supabaseUrl, supabaseAnonKey)
    }
  } catch {
    // fall through to placeholder
  }
  return createClient('https://placeholder.supabase.co', 'placeholder-anon-key')
}

export const supabase = makeClient()
