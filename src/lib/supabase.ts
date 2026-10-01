import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Safe environment reader that works across Vite browser builds, ES modules, and Node CJS bundles
const getEnvVal = (key: string): string => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return String(process.env[key]).trim();
    }
  } catch {}
  try {
    const metaEnv = (import.meta as any)?.env;
    if (metaEnv && metaEnv[key]) {
      return String(metaEnv[key]).trim();
    }
  } catch {}
  return '';
};

export const SUPABASE_URL = getEnvVal('VITE_SUPABASE_URL') || getEnvVal('SUPABASE_URL');
export const SUPABASE_ANON_KEY = getEnvVal('VITE_SUPABASE_ANON_KEY') || getEnvVal('SUPABASE_ANON_KEY');
export const SUPABASE_SERVICE_ROLE_KEY = getEnvVal('SUPABASE_SERVICE_ROLE_KEY');

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(SUPABASE_URL) &&
    Boolean(SUPABASE_ANON_KEY) &&
    SUPABASE_URL.startsWith('https://') &&
    !SUPABASE_URL.includes('placeholder') &&
    !SUPABASE_URL.includes('your-project')
  );
};

// Client-side Supabase client with auth persistence
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
