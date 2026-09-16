import { createRequestSupabase } from '../../utils/server/supabase';
import { isApprovedUser } from '../../utils/server/withAuth';

export async function getServerSideProps({ req, res, query }) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');
  if (typeof query.token_hash !== 'string' || !['invite', 'recovery'].includes(query.type)) {
    return { props: { error: 'This account setup link is invalid.' } };
  }
  const supabase = createRequestSupabase(req, res);
  const { data, error } = await supabase.auth.verifyOtp({ token_hash: query.token_hash, type: query.type });
  if (error || !isApprovedUser(data?.user)) return { props: { error: 'This link has expired or the account is not approved. Ask your workspace owner for a new setup link.' } };
  return { redirect: { destination: '/login?setup=1', permanent: false } };
}
export default function Confirm({ error }) {
  return <main style={{ padding: 48 }}><h1>Account setup</h1><p>{error}</p><a href="/login">Return to sign in</a></main>;
}
