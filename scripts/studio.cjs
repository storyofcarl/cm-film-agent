const path = require("node:path");
const { spawn } = require("node:child_process");
const root = path.resolve(__dirname, "..");
require("dotenv").config({ path: path.join(root, ".env"), quiet: true });
const command = process.argv[2] || "dev";
const args = [
  require.resolve("next/dist/bin/next"),
  command,
  path.join(root, "apps/studio"),
];
if (["dev", "build"].includes(command)) args.push("--webpack");
args.push(...process.argv.slice(3));
const child = spawn(process.execPath, args, {
  cwd: root,
  env: process.env,
  stdio: "inherit",
  windowsHide: true,
});
child.on("exit", (code) => {
  process.exitCode = code || 0;
});
