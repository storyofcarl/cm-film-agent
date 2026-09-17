import Link from "next/link";
export async function getServerSideProps(context) {
  const { getServerSideProps: confirm } =
    await import("../../../../pages/auth/confirm");
  return confirm(context);
}
export default function Confirm({ error }) {
  return (
    <main style={{ padding: 48 }}>
      <h1>Account setup</h1>
      <p>{error}</p>
      <Link href="/login">Return to sign in</Link>
    </main>
  );
}
