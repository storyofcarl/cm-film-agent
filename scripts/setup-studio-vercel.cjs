require("dotenv").config({ quiet: true });
const fs = require("node:fs");
const crypto = require("node:crypto");
const name = "cm-film-agent-studio";
const team = process.env.VERCEL_ORG_ID;
const headers = {
  Authorization: "Bearer " + process.env.VERCEL_TOKEN,
  "Content-Type": "application/json",
};
async function request(endpoint, method = "GET", body) {
  const response = await fetch(
    "https://api.vercel.com" +
      endpoint +
      (endpoint.includes("?") ? "&" : "?") +
      "teamId=" +
      encodeURIComponent(team),
    { method, headers, body: body ? JSON.stringify(body) : undefined },
  );
  const data = await response.json();
  if (!response.ok)
    throw Object.assign(
      new Error(
        "Vercel request failed: " +
          (data.error?.code || response.status) +
          (method === "POST" && endpoint === "/v11/projects"
            ? ": " + data.error?.message
            : ""),
      ),
      { status: response.status },
    );
  return data;
}
async function main() {
  let project;
  try {
    project = await request("/v9/projects/" + name);
  } catch (error) {
    if (error.status !== 404) throw error;
    project = await request("/v11/projects", "POST", {
      name,
      framework: "nextjs",
      rootDirectory: "apps/studio",
      buildCommand: "npm run build",
      installCommand: "cd ../.. && ELECTRON_SKIP_BINARY_DOWNLOAD=1 npm ci",
      publicSource: false,
    });
  }
  fs.mkdirSync(".local", { recursive: true });
  await request("/v9/projects/" + project.id, "PATCH", {
    sourceFilesOutsideRootDirectory: true,
    nodeVersion: "24.x",
  });
  fs.writeFileSync(
    ".local/studio-vercel.json",
    JSON.stringify(
      { projectId: project.id, orgId: team, projectName: name },
      null,
      2,
    ),
  );
  console.log("Separate Studio project ready:", project.name, project.id);
  const cron = crypto.randomBytes(32).toString("hex");
  const privateFile = ".local/studio-automation.env";
  const existing = fs.existsSync(privateFile)
    ? require("dotenv").parse(fs.readFileSync(privateFile))
    : {};
  const cronSecret = existing.CRON_SECRET || cron;
  if (!existing.CRON_SECRET)
    fs.appendFileSync(privateFile, "CRON_SECRET=" + cronSecret + "\n");
  const allowed = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_SECRET_KEY",
    "ANTHROPIC_API_KEY",
    "FAL_API_KEY",
    "WAVESPEED_API_KEY",
    "MINIMAX_API_KEY",
    "REGION",
    "SERVICE",
    "VERSION",
    "BASE_URL",
    "TERMINAL",
    "POLL_INTERVAL_MS",
    "POLL_MAX_ATTEMPTS",
    "MODELARK_API_KEY",
    "MODELARK_API_BASE_URL",
    "MODELARK_MODEL_REASONER",
    "MODELARK_MODEL_SEEDREAM",
    "MODELARK_MODEL_SEEDREAM_PRO",
    "MODELARK_MODEL_SEEDANCE",
    "MODELARK_MODEL_SEEDANCE_FAST",
    "MODELARK_MODEL_SEEDANCE_MINI",
    "MODELARK_MODEL_SEEDANCE_25",
    "BYTEPLUSVOICE_API_KEY",
    "BYTEPLUSVOICE_BASE_URL",
    "MODELARK_MODEL_SEED_AUDIO",
    "MODELARK_ASSET_ACCESS_KEY",
    "MODELARK_ASSET_SECRET_KEY",
    "MODELARK_ASSET_GROUP_ID",
  ];
  const values = [...new Set(allowed)]
    .filter((key) => process.env[key]?.trim())
    .map((key) => ({
      key,
      value: process.env[key],
      target: ["preview", "production"],
      type: "encrypted",
    }));
  values.push(
    {
      key: "CRON_SECRET",
      value: cronSecret,
      target: ["preview", "production"],
      type: "encrypted",
    },
    {
      key: "ELECTRON_SKIP_BINARY_DOWNLOAD",
      value: "1",
      target: ["preview", "production"],
      type: "plain",
    },
  );
  await request(
    "/v10/projects/" + project.id + "/env?upsert=true",
    "POST",
    values,
  );
  console.log(
    "Studio runtime variables synchronized:",
    values.length,
    "(administration tokens and database passwords excluded)",
  );
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
