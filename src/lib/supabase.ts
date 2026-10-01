import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Safe environment variable getter for both Node.js and Vite Browser environments
const getEnvVar = (key: string): string => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return String(process.env[key]).trim();
    }
  } catch {}

  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any)?.env && (import.meta as any).env[key]) {
      return String((import.meta as any).env[key]).trim();
    }
  } catch {}

  return '';
};

const initialUrl = getEnvVar('VITE_SUPABASE_URL') || getEnvVar('SUPABASE_URL');
const initialAnon = getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('SUPABASE_ANON_KEY');
const initialServiceKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

let dynamicUrl = initialUrl;
let dynamicAnon = initialAnon;

export let SUPABASE_URL = initialUrl;
export let SUPABASE_ANON_KEY = initialAnon;
export const SUPABASE_SERVICE_ROLE_KEY = initialServiceKey;

export const isSupabaseConfigured = (): boolean => {
  const url = dynamicUrl || SUPABASE_URL || getEnvVar('VITE_SUPABASE_URL') || getEnvVar('SUPABASE_URL');
  const key = dynamicAnon || SUPABASE_ANON_KEY || getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('SUPABASE_ANON_KEY');
  return (
    Boolean(url) &&
    Boolean(key) &&
    url.startsWith('https://') &&
    !url.includes('placeholder') &&
    !url.includes('your-project')
  );
};

export const getSupabaseConfig = () => ({
  url: dynamicUrl || SUPABASE_URL || getEnvVar('VITE_SUPABASE_URL') || getEnvVar('SUPABASE_URL'),
  anonKey: dynamicAnon || SUPABASE_ANON_KEY || getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('SUPABASE_ANON_KEY'),
});

// Client-side Supabase client with auth persistence
export let supabase: SupabaseClient = isSupabaseConfigured()
  ? createClient(getSupabaseConfig().url, getSupabaseConfig().anonKey, {
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

// Admin Supabase client (used server-side if service role key exists, otherwise anon key)
export const supabaseAdmin: SupabaseClient = isSupabaseConfigured()
  ? createClient(
      getSupabaseConfig().url,
      SUPABASE_SERVICE_ROLE_KEY || getSupabaseConfig().anonKey,
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
