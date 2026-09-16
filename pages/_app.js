import '../styles/globals.css';
import "@arco-design/web-react/dist/css/arco.css";
import { getBrowserSupabase } from '../utils/supabase/browser';
import GenerationRecovery from '../components/film/GenerationRecovery';

export default function App({ Component, pageProps }) {
  return <>
    <Component {...pageProps} />
    {pageProps.userEmail && <GenerationRecovery />}
    {pageProps.userEmail && <button className="account-signout" title={`Sign out (${pageProps.userEmail})`} onClick={async () => {
      await getBrowserSupabase().auth.signOut();
      window.location.assign('/login');
    }}>Sign out</button>}
  </>;
}
