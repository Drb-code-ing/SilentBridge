import type { AppTab, BridgeStep, CaptionLine, DemoFlowId } from "./demo-content";
import type { AsrStatus } from "./asr-simulator";
import type { AgentRunResult } from "./agent-graph";
import type { CommunicationSession } from "./session-types";

const STORAGE_KEY = "silentbridge.bridgeProgress.v2";
const appTabs = ["home", "bridge", "records", "phrases"] as const satisfies readonly AppTab[];
const bridgeSteps = ["show", "listen"] as const satisfies readonly BridgeStep[];
const demoFlowIds = ["clinic", "pharmacy", "service", "traffic", "generic"] as const satisfies readonly DemoFlowId[];
const agentProviders = ["proxy", "fallback"] as const;

export interface BridgeProgressDraft {
  activeTab: AppTab;
  bridgeStep: BridgeStep;
  displayMessage: string;
  bridgeSourceLabel: string;
  activeFlowId: DemoFlowId;
  activeSession: CommunicationSession;
  visibleCaptions: CaptionLine[];
  asrStatus: AsrStatus;
  agentResult?: AgentRunResult;
  agentProvider: "proxy" | "fallback";
  replyDraft: string;
  processedReplyDraft: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === "string" && allowed.includes(value as T);
}

function isCommunicationSession(value: unknown): value is CommunicationSession {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    isOneOf(value.flowId, demoFlowIds) &&
    typeof value.sourceLabel === "string" &&
    typeof value.currentPrompt === "string" &&
    Array.isArray(value.rounds)
  );
}

function isAgentRunResult(value: unknown): value is AgentRunResult {
  if (!isRecord(value) || !isRecord(value.understanding)) {
    return false;
  }

  return (
    typeof value.graphName === "string" &&
    Array.isArray(value.visitedNodes) &&
    Array.isArray(value.understanding.confirmed) &&
    Array.isArray(value.understanding.missing) &&
    Array.isArray(value.understanding.risks) &&
    typeof value.understanding.suggestedQuestion === "string" &&
    typeof value.understanding.plainSummary === "string"
  );
}

function stringOr(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

export function loadBridgeProgressDraft(): BridgeProgressDraft | undefined {
  try {
    if (typeof window === "undefined") {
      return undefined;
    }

    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return undefined;
    }

    const parsed = JSON.parse(raw) as unknown;

    if (
      !isRecord(parsed) ||
      !isOneOf(parsed.activeTab, appTabs) ||
      !isOneOf(parsed.bridgeStep, bridgeSteps) ||
      !isOneOf(parsed.activeFlowId, demoFlowIds) ||
      !isCommunicationSession(parsed.activeSession)
    ) {
      clearBridgeProgressDraft();
      return undefined;
    }

    const agentResult = isAgentRunResult(parsed.agentResult) ? parsed.agentResult : undefined;
    const restoredCaptions = Array.isArray(parsed.visibleCaptions) ? (parsed.visibleCaptions as CaptionLine[]) : [];

    return {
      activeTab: parsed.activeTab,
      bridgeStep: parsed.bridgeStep,
      displayMessage: stringOr(parsed.displayMessage, ""),
      bridgeSourceLabel: stringOr(parsed.bridgeSourceLabel, "通用沟通"),
      activeFlowId: parsed.activeFlowId,
      activeSession: parsed.activeSession,
      visibleCaptions: agentResult ? restoredCaptions : [],
      asrStatus: agentResult ? "done" : "idle",
      agentResult,
      agentProvider: isOneOf(parsed.agentProvider, agentProviders) ? parsed.agentProvider : "fallback",
      replyDraft: stringOr(parsed.replyDraft, ""),
      processedReplyDraft: stringOr(parsed.processedReplyDraft, "")
    };
  } catch {
    clearBridgeProgressDraft();
    return undefined;
  }
}

export function saveBridgeProgressDraft(draft: BridgeProgressDraft) {
  try {
    if (typeof window === "undefined") {
      return;
    }

    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // sessionStorage 不可用时静默降级
  }
}

export function clearBridgeProgressDraft() {
  try {
    if (typeof window === "undefined") {
      return;
    }

    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // 静默降级
  }
}
