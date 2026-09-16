import { createBrowserClient } from '@supabase/ssr';

let client;
export const getBrowserSupabase = () => {
  if (!client) client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  return client;
};
