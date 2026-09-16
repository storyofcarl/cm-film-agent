import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { stringifySetCookie } from 'cookie';

export const createRequestSupabase = (req, res) => createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  {
    cookies: {
      getAll: () => Object.entries(req.cookies || {}).map(([name, value]) => ({ name, value })),
      setAll: (cookies) => {
        const previous = res.getHeader('Set-Cookie') || [];
        res.setHeader('Set-Cookie', [...(Array.isArray(previous) ? previous : [previous]),
          ...cookies.map(({ name, value, options }) => stringifySetCookie({ name, value, ...options }))]);
      },
    },
  },
);

// Administrative operations only. Normal application queries use the caller's
// authenticated client so Postgres and Storage RLS remain the final boundary.
export const createAdminSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
