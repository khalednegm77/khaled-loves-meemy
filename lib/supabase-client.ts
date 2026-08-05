import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy-initialized Supabase client that waits for window vars to be injected
let supabaseInstance: SupabaseClient | null = null
let warningShown = false

function getCredentials() {
  const url = (typeof window !== 'undefined' ? (window as any).NEXT_PUBLIC_SUPABASE_URL : undefined) ||
    process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = (typeof window !== 'undefined' ? (window as any).NEXT_PUBLIC_SUPABASE_ANON_KEY : undefined) ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return { url, key }
}

function ensureInitialized() {
  if (supabaseInstance) return supabaseInstance

  const { url, key } = getCredentials()

  if (url && key) {
    try {
      supabaseInstance = createClient(url, key)
      return supabaseInstance
    } catch (err) {
      console.error('[v0] Failed to create Supabase client:', err)
    }
  }

  if (!warningShown) {
    console.warn(
      '[v0] Supabase is NOT configured. Missing NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
        'Auth and safe_place_pages reads/writes will fail until these environment variables are set.',
    )
    warningShown = true
  }

  supabaseInstance = createClient('https://placeholder.supabase.co', 'placeholder-anon-key')
  return supabaseInstance
}

export function getSupabaseConfigured() {
  const { url, key } = getCredentials()
  return Boolean(url && key)
}

export function getSupabase(): SupabaseClient {
  return ensureInitialized()
}

// For convenience, create a proxy that initializes on first method call
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop: string | symbol) {
    return (ensureInitialized() as any)[prop]
  },
})

// Legacy export for backward compatibility
export const supabaseConfigured = getSupabaseConfigured()
