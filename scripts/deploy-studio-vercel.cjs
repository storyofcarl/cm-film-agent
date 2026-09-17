// Explicitly deploy the separate approved Studio destination, never the root link.
require("dotenv").config({ quiet: true });
const fs = require("node:fs");
const crypto = require("node:crypto");
const { execFileSync, spawnSync } = require("node:child_process");
const path = require("node:path");
const link = JSON.parse(fs.readFileSync(".local/studio-vercel.json", "utf8"));
if (
  link.projectName !== "cm-film-agent-studio" ||
  link.orgId !== process.env.VERCEL_ORG_ID
)
  throw new Error(
    "Studio destination does not match the approved team/project.",
  );
const git = (...args) =>
  execFileSync(
    "git",
    ["-c", "safe.directory=" + process.cwd().replaceAll("\\", "/"), ...args],
    { encoding: "utf8" },
  );
async function main() {
  const paths = git(
    "ls-files",
    "--cached",
    "--others",
    "--exclude-standard",
    "-z",
  )
    .split("\0")
    .filter(Boolean);
  const secrets = Object.entries(process.env)
    .filter(
      ([key, value]) =>
        !key.startsWith("NEXT_PUBLIC_") &&
        /KEY|TOKEN|PASSWORD|SECRET|DB_URL/.test(key) &&
        value.length > 10,
    )
    .map(([, value]) => value);
  const files = paths
    .filter(
      (file) => !/^(?:docs|tests|scripts|\.github|electron|tools)\//.test(file),
    )
    .map((file) => {
      if (
        /(^|\/)(?:\.env(?!\.example$)|\.local|\.vercel|node_modules|\.next|artifacts)(\/|$)/.test(
          file,
        )
      )
        throw new Error("Private/build path in upload: " + file);
      const data = fs.readFileSync(file);
      if (secrets.some((secret) => data.includes(Buffer.from(secret))))
        throw new Error("Configured secret detected in " + file);
      return { file, data: data.toString("base64"), encoding: "base64" };
    });
  const uploadRoot = path.resolve(
    ".local",
    "studio-upload-" + crypto.randomUUID(),
  );
  for (const entry of files) {
    const destination = path.join(uploadRoot, entry.file);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, Buffer.from(entry.data, "base64"));
  }
  fs.mkdirSync(path.join(uploadRoot, ".vercel"), { recursive: true });
  fs.writeFileSync(
    path.join(uploadRoot, ".vercel/project.json"),
    JSON.stringify(link),
  );
  const result = spawnSync(
    process.execPath,
    [
      path.resolve("node_modules/vercel/dist/index.js"),
      "deploy",
      "--yes",
      "--prod",
      "--no-wait",
      "--json",
      "--project",
      link.projectId,
      "--scope",
      link.orgId,
      "--token",
      process.env.VERCEL_TOKEN,
      "--meta",
      "sourceCommit=" + git("rev-parse", "HEAD").trim(),
      "--meta",
      "sourceDigest=" +
        crypto.createHash("sha256").update(JSON.stringify(files)).digest("hex"),
    ],
    {
      cwd: uploadRoot,
      env: {
        ...process.env,
        VERCEL_PROJECT_ID: link.projectId,
        VERCEL_ORG_ID: link.orgId,
      },
      encoding: "utf8",
      windowsHide: true,
      maxBuffer: 8 * 1024 * 1024,
    },
  );
  if (result.status !== 0) {
    console.error(
      (result.stderr || "").replaceAll(process.env.VERCEL_TOKEN, "[redacted]"),
    );
    throw new Error("Studio deployment command failed.");
  }
  const data = JSON.parse(result.stdout);
  const deployment = data.deployment || data;
  const record = {
    id: deployment.id,
    url: deployment.url,
    projectId: link.projectId,
    state: deployment.readyState,
    files: files.length,
  };
  fs.writeFileSync(
    ".local/studio-deployment.json",
    JSON.stringify(record, null, 2),
  );
  console.log(JSON.stringify(record));
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
