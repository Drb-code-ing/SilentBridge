import { callZhipuChat } from "../services/zhipu-client.js";
import { buildSystemPrompt, buildUserPrompt } from "../prompts/agent-system-prompt.js";

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
  correctedText?: string;
}

export async function handleAgentRun(request: unknown): Promise<AgentRunResponse> {
  const req = request as AgentRunRequest;
  const apiKey = process.env.ZHIPU_API_KEY;

  if (!apiKey) {
    return createFallbackResponse();
  }

  try {
    const systemPrompt = buildSystemPrompt(req.flowId);
    const userPrompt = buildUserPrompt({
      transcript: req.transcript,
      userMessage: req.userMessage
    });

    const result = await callZhipuChat({ apiKey, systemPrompt, userPrompt });
    const parsed = JSON.parse(result.content) as Partial<AgentRunResponse["understanding"] & { correctedText?: string }>;

    const correctedText =
      typeof parsed.correctedText === "string" && parsed.correctedText.trim()
        ? parsed.correctedText.trim()
        : undefined;

    return {
      ok: true,
      provider: "proxy",
      graphName: "silentbridge-glm4-agent",
      visitedNodes: [
        "asr_capture",
        "context_classifier",
        "risk_guard",
        "confirmation_question",
        "record_writer"
      ],
      understanding: {
        confirmed: Array.isArray(parsed.confirmed) ? parsed.confirmed.slice(0, 5) : [],
        missing: Array.isArray(parsed.missing)
          ? parsed.missing.slice(0, 4)
          : ["请对方再确认一次关键信息"],
        risks: Array.isArray(parsed.risks) ? parsed.risks.slice(0, 3) : [],
        suggestedQuestion:
          typeof parsed.suggestedQuestion === "string" && parsed.suggestedQuestion.trim()
            ? parsed.suggestedQuestion
            : "请把关键信息写下来，我需要确认。",
        plainSummary:
          typeof parsed.plainSummary === "string" && parsed.plainSummary.trim()
            ? parsed.plainSummary
            : "已整理对方的话。"
      },
      ...(correctedText ? { correctedText } : {})
    };
  } catch (error) {
    console.error("[agent-run] LLM call failed:", error);
    return createFallbackResponse();
  }
}

function createFallbackResponse(): AgentRunResponse {
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
      missing: ["AI 服务暂时不可用"],
      risks: [{ level: "low", text: "已降级到本地规则引擎整理。" }],
      suggestedQuestion: "请把关键信息写下来，我需要确认。",
      plainSummary: "当前 AI 服务未配置，已使用本地整理。"
    }
  };
}
