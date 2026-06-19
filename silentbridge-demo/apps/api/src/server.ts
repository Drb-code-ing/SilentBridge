import { createServer } from "node:http";
import { getServerEnv } from "./env.js";
import { handleTranscribe } from "./routes/transcribe.js";
import { handleAgentRun } from "./routes/agent-run.js";

const PORT = Number(process.env.PORT) || 8787;

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "", `http://localhost:${PORT}`);

  if (url.pathname === "/api/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, ...getServerEnv() }));
    return;
  }

  if (url.pathname === "/api/transcribe" && req.method === "POST") {
    const body = await readJsonBody(req);
    const result = await handleTranscribe(body);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result));
    return;
  }

  if (url.pathname === "/api/agent/run" && req.method === "POST") {
    const body = await readJsonBody(req);
    const result = await handleAgentRun(body);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result));
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
});

server.listen(PORT, () => {
  console.log(`[silentbridge-api] listening on http://localhost:${PORT}`);
});

function readJsonBody(req: import("node:http").IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}
