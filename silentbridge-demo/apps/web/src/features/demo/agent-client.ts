import type { DemoFlow } from "./demo-content";
import type { AgentRunRequest, AgentRunResponse } from "./api-contracts";
import { runDemoAgent } from "./agent-graph";

export async function runSessionAgent(input: {
  request: AgentRunRequest;
  fallbackFlow: DemoFlow;
}): Promise<AgentRunResponse> {
  if (!shouldUseApiProxy()) {
    return createFallbackAgentResponse(input.fallbackFlow);
  }

  try {
    const response = await fetch("/api/agent/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input.request)
    });

    if (!response.ok) {
      throw new Error(`agent failed: ${response.status}`);
    }

    const data = (await response.json()) as AgentRunResponse;
    if (data.ok) {
      return data;
    }

    throw new Error("agent response not ok");
  } catch {
    return createFallbackAgentResponse(input.fallbackFlow);
  }
}

function createFallbackAgentResponse(fallbackFlow: DemoFlow): AgentRunResponse {
  const result = runDemoAgent({
    flow: fallbackFlow,
    transcript: fallbackFlow.captions
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
  return search.get("api") === "proxy" || window.localStorage.getItem("silentbridge.apiProxy") === "enabled";
}
