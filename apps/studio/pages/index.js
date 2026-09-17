import Studio from "../components/Studio";
import { createRequestSupabase } from "../../../utils/server/supabase";
import { isApprovedUser } from "../../../utils/server/withAuth";
export default function Home({ userEmail }) {
  return <Studio userEmail={userEmail} />;
}
export async function getServerSideProps({ req, res }) {
  res.setHeader("Cache-Control", "private, no-store");
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL)
    return { redirect: { destination: "/demo", permanent: false } };
  const {
    data: { user },
  } = await createRequestSupabase(req, res).auth.getUser();
  if (!isApprovedUser(user))
    return { redirect: { destination: "/login", permanent: false } };
  return { props: { userEmail: user.email } };
}
