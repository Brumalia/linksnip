import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Allow build to pass with placeholder credentials
// Real credentials must be provided in production
function createSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Use dummy URL during build if not configured
  // This allows the build to pass; real values needed at runtime
  const url = (supabaseUrl && supabaseUrl.startsWith('http')) 
    ? supabaseUrl 
    : 'https://placeholder.supabase.co';
  const key = supabaseAnonKey || 'placeholder-key';

  return createClient(url, key);
}

export const supabase = createSupabaseClient();
