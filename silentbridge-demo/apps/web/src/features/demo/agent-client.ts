import type { DemoFlow } from "./demo-content";
import type { AgentRunRequest, AgentRunResponse } from "./api-contracts";
import { runDemoAgent } from "./agent-graph";

const AGENT_FETCH_TIMEOUT_MS = 10000;

export async function runSessionAgent(input: {
  request: AgentRunRequest;
  fallbackFlow: DemoFlow;
  /** 演示字幕等确定性场景：直接本地整理，避免远程 LLM 拖慢/卡住 */
  preferLocal?: boolean;
}): Promise<AgentRunResponse> {
  if (input.preferLocal || !shouldUseApiProxy()) {
    return createFallbackAgentResponse({ fallbackFlow: input.fallbackFlow, request: input.request });
  }

  try {
    const response = await fetchWithTimeout(
      "/api/agent/run",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input.request)
      },
      AGENT_FETCH_TIMEOUT_MS
    );

    if (!response.ok) {
      throw new Error(`agent failed: ${response.status}`);
    }

    const data = (await response.json()) as AgentRunResponse;
    if (data.ok) {
      return data;
    }

    throw new Error("agent response not ok");
  } catch {
    return createFallbackAgentResponse({ fallbackFlow: input.fallbackFlow, request: input.request });
  }
}

function createFallbackAgentResponse(input: {
  fallbackFlow: DemoFlow;
  request: AgentRunRequest;
}): AgentRunResponse {
  const transcript =
    input.request.transcript.length > 0 ? input.request.transcript : input.fallbackFlow.captions;
  const result = runDemoAgent({
    flow: input.fallbackFlow,
    transcript,
    userMessage: input.request.userMessage
  });

  return {
    ok: true,
    provider: "fallback",
    graphName: result.graphName,
    visitedNodes: result.visitedNodes,
    understanding: result.understanding
  };
}

function shouldUseApiProxy() {
  if (typeof window === "undefined") {
    return false;
  }

  const search = new URLSearchParams(window.location.search);
  if (search.get("api") === "local") {
    return false;
  }
  if (search.get("api") === "proxy") {
    return true;
  }

  const stored = window.localStorage.getItem("silentbridge.apiProxy");
  if (stored === "enabled") {
    return true;
  }
  if (stored === "disabled") {
    return false;
  }

  return true;
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}
