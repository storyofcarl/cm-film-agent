// Additive private storage for Studio only; no policies expose server records.
require("dotenv").config({ quiet: true });
const { createClient } = require("@supabase/supabase-js");
const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
async function main() {
  const name = "studio-records";
  const existing = await client.storage.getBucket(name);
  if (existing.data) {
    if (existing.data.public)
      throw new Error("Studio records bucket must remain private.");
    console.log("Private Studio records bucket already exists.");
    return;
  }
  if (
    existing.error &&
    !["404", "400"].includes(String(existing.error.statusCode))
  )
    throw new Error("Could not inspect Studio records storage.");
  const created = await client.storage.createBucket(name, {
    public: false,
    fileSizeLimit: 4 * 1024 * 1024,
    allowedMimeTypes: ["application/json"],
  });
  if (created.error)
    throw new Error(
      "Could not create private Studio records storage: " +
        created.error.message,
    );
  console.log(
    "Created private Studio records bucket; no client-write policies added.",
  );
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
