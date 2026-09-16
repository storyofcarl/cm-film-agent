import { useEffect, useState } from 'react';
import Head from 'next/head';
import { getBrowserSupabase } from '../utils/supabase/browser';
import styles from '../styles/Login.module.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [setup, setSetup] = useState(false);
  useEffect(() => {
    const client = getBrowserSupabase();
    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (session && ['INITIAL_SESSION', 'SIGNED_IN'].includes(event) && new URLSearchParams(window.location.search).has('setup'))) setSetup(true);
    });
    return () => subscription.unsubscribe();
  }, []);
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true); setMessage('');
    const client = getBrowserSupabase();
    try {
      const { error } = setup
        ? await client.auth.updateUser({ password })
        : await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const response = await fetch('/api/auth/session');
      if (!response.ok) {
        await client.auth.signOut();
        throw new Error('Your account has not been granted access to this workspace.');
      }
      window.location.assign('/');
    } catch (error) { setMessage(error.message || 'Unable to sign in. Please try again.'); }
    finally { setBusy(false); }
  };
  return <main className={styles.page}>
    <Head><title>Sign in · Film Agent</title><meta name="robots" content="noindex,nofollow" /></Head>
    <section className={styles.intro}>
      <div className={styles.brand}><span className={styles.mark}>F</span> FILM AGENT</div>
      <div><p className={styles.eyebrow}>YOUR PRODUCTION WORKSPACE</p><h1>Bring your<br />next story to life.</h1>
        <p className={styles.description}>Shape the brief. Build your world. Direct every shot.<br />One workspace from first idea to final cut.</p></div>
      <div className={styles.steps}><span>01 &nbsp; DEVELOP</span><span>02 &nbsp; DIRECT</span><span>03 &nbsp; CREATE</span></div>
    </section>
    <section className={styles.panel}>
      <form className={styles.form} onSubmit={submit}>
        <p className={styles.eyebrow}>PRIVATE STUDIO</p>
        <h2>{setup ? 'Set your password' : 'Welcome back'}</h2>
        <p className={styles.hint}>{setup ? 'Choose a password to finish setting up your account.' : 'Sign in to continue your production.'}</p>
        {!setup && <label>Email address<input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@studio.com" /></label>}
        <label>Password<input type="password" minLength={setup ? 12 : undefined} autoComplete={setup ? 'new-password' : 'current-password'} required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        {message && <p role="alert" className={styles.error}>{message}</p>}
        <button disabled={busy} type="submit">{busy ? 'Please wait…' : setup ? 'Open your studio' : 'Sign in'} <span aria-hidden="true">→</span></button>
        <p className={styles.footnote}>Access is by invitation. Contact your workspace owner for an account.</p>
      </form>
    </section>
  </main>;
}
