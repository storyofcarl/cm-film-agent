// Explicitly deploy the separate approved Studio destination, never the root link.
require("dotenv").config({ quiet: true });
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");
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
  const response = await fetch(
    "https://api.vercel.com/v13/deployments?teamId=" +
      encodeURIComponent(link.orgId),
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.VERCEL_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: link.projectName,
        project: link.projectId,
        target: "production",
        files,
        projectSettings: {
          rootDirectory: "apps/studio",
          framework: "nextjs",
          nodeVersion: "24.x",
        },
        meta: {
          sourceCommit: git("rev-parse", "HEAD").trim(),
          sourceBranch: git("branch", "--show-current").trim(),
        },
      }),
    },
  );
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      "Studio deployment failed: " +
        (data.error?.code || response.status) +
        ": " +
        (data.error?.message || ""),
    );
  const record = {
    id: data.id,
    url: data.url,
    projectId: link.projectId,
    state: data.readyState,
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
