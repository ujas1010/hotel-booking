import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getEnv = (key: string, fallback: string = ''): string => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
      return (import.meta as any).env[key];
    }
  } catch {}
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] || fallback;
    }
  } catch {}
  return fallback;
};

export const SUPABASE_URL = getEnv('VITE_SUPABASE_URL', '').trim();
export const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY', '').trim();
export const SUPABASE_SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY', '').trim();

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(SUPABASE_URL) &&
    Boolean(SUPABASE_ANON_KEY) &&
    SUPABASE_URL.startsWith('https://') &&
    !SUPABASE_URL.includes('placeholder') &&
    !SUPABASE_URL.includes('your-project')
  );
};

// Client-side Supabase client with auth persistence (dummy fallback if unconfigured)
export const supabase: SupabaseClient = isSupabaseConfigured()
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
