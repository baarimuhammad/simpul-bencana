import { zipFunctions } from "@netlify/zip-it-and-ship-it";
import { mkdir } from "node:fs/promises";
await mkdir(".netlify/functions-check", { recursive: true });
const functions = await zipFunctions(
  "netlify/functions",
  ".netlify/functions-check",
  { config: { "*": { nodeBundler: "esbuild", nodeVersion: "22" } } },
);
const api = functions.find((f) => f.name === "api");
if (!api) throw new Error("Function api tidak ditemukan.");
console.log(
  JSON.stringify(
    functions.map(({ name, runtime, path }) => ({ name, runtime, path })),
    null,
    2,
  ),
);
