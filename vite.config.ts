import { defineConfig } from "vitest/config";
import type { Plugin } from "vite";
import { handleApi } from "./server/api.ts";
function localApi(): Plugin {
  return {
    name: "simpul-stateless-api",
    configureServer(server) {
      server.middlewares.use("/api", async (req, res) => {
        const chunks: Buffer[] = [];
        for await (const c of req) chunks.push(Buffer.from(c));
        const method = req.method ?? "GET";
        const request = new Request(`http://localhost/api${req.url ?? ""}`, {
          method,
          headers: req.headers as HeadersInit,
          ...(method === "GET" || method === "HEAD"
            ? {}
            : { body: Buffer.concat(chunks).toString() }),
        });
        const response = await handleApi(request);
        res.statusCode = response.status;
        response.headers.forEach((v, k) => res.setHeader(k, v));
        res.end(await response.text());
      });
    },
  };
}
export default defineConfig({
  server: { allowedHosts: ["terminal.local"] },
  plugins: [localApi()],
  build: { target: "es2022", chunkSizeWarningLimit: 650 },
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
});
