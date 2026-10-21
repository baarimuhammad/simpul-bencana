import { existsSync } from "node:fs";
import { spawnSync, spawn } from "node:child_process";
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
if (!existsSync("node_modules/vite")) {
  const install = spawnSync(npm, ["ci"], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (install.status) process.exit(install.status);
}
const child = spawn(npm, ["run", "dev:vite", "--", ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: process.platform === "win32",
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 0));
