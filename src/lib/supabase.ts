import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Normalizes a Supabase URL value so both direct Project API URLs
 * (`https://<ref>.supabase.co`) and mistakenly pasted Supabase Dashboard URLs
 * (`https://supabase.com/dashboard/project/<ref>/settings/api-keys`) resolve
 * to the valid Supabase API origin.
 */
export function normalizeSupabaseUrl(rawUrl?: string | null): string | null {
  const trimmed = (rawUrl ?? '').trim();
  if (!trimmed || trimmed.includes('YOUR_SUPABASE')) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return null;
  }

  // Detect Supabase Dashboard URLs and extract the project ref
  const host = parsed.hostname.toLowerCase();
  if (host === 'supabase.com' || host === 'app.supabase.com' || host === 'www.supabase.com') {
    const match = parsed.pathname.match(/\/(?:dashboard\/)?project\/([a-z0-9]{10,40})(?:\/|$)/i);
    if (match?.[1]) {
      return `https://${match[1].toLowerCase()}.supabase.co`;
    }
    return null;
  }

  // Strip accidental paths like /rest/v1 or /auth/v1
  return parsed.origin;
}

export function isValidSupabaseKey(rawKey?: string | null): boolean {
  const trimmed = (rawKey ?? '').trim();
  if (!trimmed) return false;
  if (trimmed.includes('YOUR_SUPABASE') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return false;
  }
  return trimmed.length >= 20;
}

const rawSupabaseUrl =
  typeof import.meta !== 'undefined' && import.meta.env
    ? (import.meta.env.VITE_SUPABASE_URL as string | undefined)
    : undefined;
const rawSupabaseAnonKey =
  typeof import.meta !== 'undefined' && import.meta.env
    ? (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)
    : undefined;

export const resolvedSupabaseUrl = normalizeSupabaseUrl(rawSupabaseUrl);
const supabaseAnonKey = (rawSupabaseAnonKey ?? '').trim();

export const isSupabaseConfigured = Boolean(
  resolvedSupabaseUrl && isValidSupabaseKey(supabaseAnonKey),
);

export const supabase: SupabaseClient | null = isSupabaseConfigured && resolvedSupabaseUrl
  ? createClient(resolvedSupabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
