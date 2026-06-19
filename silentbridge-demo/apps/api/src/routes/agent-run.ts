interface AgentRunRequest {
  sessionId: string;
  flowId: string;
  transcript: Array<{
    id: string;
    speaker: string;
    text: string;
    time: string;
    important?: boolean;
  }>;
  userMessage: string;
  round: number;
}

interface AgentRunResponse {
  ok: true;
  provider: "proxy" | "fallback";
  graphName: string;
  visitedNodes: string[];
  understanding: {
    confirmed: string[];
    missing: string[];
    risks: Array<{ level: "low" | "medium" | "high"; text: string }>;
    suggestedQuestion: string;
    plainSummary: string;
  };
}

export async function handleAgentRun(_request: unknown): Promise<AgentRunResponse> {
  return {
    ok: true,
    provider: "fallback",
    graphName: "silentbridge-proxy-placeholder",
    visitedNodes: [
      "asr_capture",
      "context_classifier",
      "risk_guard",
      "confirmation_question",
      "record_writer"
    ],
    understanding: {
      confirmed: [],
      missing: ["真实 Agent 服务尚未配置"],
      risks: [{ level: "low", text: "当前使用本地 fallback，比赛演示不受影响。" }],
      suggestedQuestion: "请把关键信息写下来，我需要确认。",
      plainSummary: "当前后端代理已预留，真实模型服务未配置时自动回落。"
    }
  };
}
