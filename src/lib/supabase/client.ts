import { createBrowserClient } from '@supabase/ssr'
import { getSupabasePublishableKey } from './env'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getSupabasePublishableKey()
  )
}
