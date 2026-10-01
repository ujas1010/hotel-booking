import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Static access for Vite compilation
const staticUrl = typeof import.meta !== 'undefined' ? String((import.meta as any)?.env?.VITE_SUPABASE_URL || '').trim() : '';
const staticAnon = typeof import.meta !== 'undefined' ? String((import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY || '').trim() : '';

let dynamicUrl = staticUrl;
let dynamicAnon = staticAnon;

export let SUPABASE_URL = staticUrl;
export let SUPABASE_ANON_KEY = staticAnon;
export const SUPABASE_SERVICE_ROLE_KEY = (typeof process !== 'undefined' && process.env ? process.env.SUPABASE_SERVICE_ROLE_KEY : '') || '';

export const isSupabaseConfigured = (): boolean => {
  const url = dynamicUrl || SUPABASE_URL;
  const key = dynamicAnon || SUPABASE_ANON_KEY;
  return (
    Boolean(url) &&
    Boolean(key) &&
    url.startsWith('https://') &&
    !url.includes('placeholder') &&
    !url.includes('your-project')
  );
};

// Client-side Supabase client with auth persistence
export let supabase: SupabaseClient = isSupabaseConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createClient('https://placeholder-project.supabase.co', 'placeholder-anon-key', {
      auth: { persistSession: false },
    });

export function configureSupabase(url: string, anonKey: string): SupabaseClient | null {
  if (!url || !anonKey || !url.startsWith('https://')) return null;
  dynamicUrl = url;
  dynamicAnon = anonKey;
  SUPABASE_URL = url;
  SUPABASE_ANON_KEY = anonKey;
  supabase = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return supabase;
}

// Admin Supabase client (used server-side if service role key exists)
export const supabaseAdmin: SupabaseClient = isSupabaseConfigured()
  ? createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
  : createClient('https://placeholder-project.supabase.co', 'placeholder-service-key', {
      auth: { persistSession: false },
    });
