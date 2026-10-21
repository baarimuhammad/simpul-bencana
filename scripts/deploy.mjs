import { existsSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
const windows = process.platform === "win32";
const npm = windows ? "npm.cmd" : "npm";
const npx = windows ? "npx.cmd" : "npx";
// A clean extraction can deploy with one command, even before its first dev run.
if (!existsSync("node_modules/vite")) {
  const install = spawnSync(npm, ["ci"], { stdio: "inherit", shell: windows });
  if (install.status) process.exit(install.status);
}
const child = spawn(
  npx,
  [
    "--yes",
    "netlify-cli@27.14.0",
    "deploy",
    "--build",
    "--prod",
    ...process.argv.slice(2),
  ],
  { stdio: "inherit", shell: windows },
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 0));
