import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { getServerEnv } from "./env.js";
import { handleTranscribe } from "./routes/transcribe.js";
import { handleAgentRun } from "./routes/agent-run.js";

const app = new Hono();

app.get("/api/health", (c) => {
  return c.json({ ok: true, ...getServerEnv() });
});

app.post("/api/transcribe", async (c) => {
  const body = await c.req.json();
  const result = await handleTranscribe(body);
  return c.json(result);
});

app.post("/api/agent/run", async (c) => {
  const body = await c.req.json();
  const result = await handleAgentRun(body);
  return c.json(result);
});

app.onError((err, c) => {
  console.error("[silentbridge-api] unhandled error:", err);
  return c.json({ ok: false, error: "internal-server-error" }, 500);
});

app.notFound((c) => {
  return c.json({ ok: false, error: "not-found" }, 404);
});

const PORT = Number(process.env.PORT) || 8787;

if (process.env.VERCEL !== "1") {
  serve({ fetch: app.fetch, port: PORT }, (info) => {
    console.log(`[silentbridge-api] listening on http://localhost:${info.port}`);
  });
}

export default app;
