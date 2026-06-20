import type { DemoFlow, DemoFlowId, RecordItem } from "./demo-content";
import type { CommunicationSession, SessionRound } from "./session-types";
import type { TranscriptProvider } from "./api-contracts";
import type { AgentRunResult } from "./agent-graph";

const RECORD_STORAGE_KEY = "silentbridge.records.v1";

export function createCommunicationSession(input: {
  flowId: DemoFlowId;
  sourceLabel: string;
  prompt: string;
}): CommunicationSession {
  const now = Date.now();

  return {
    id: `session-${input.flowId}-${now}`,
    flowId: input.flowId,
    sourceLabel: input.sourceLabel,
    status: "showing_prompt",
    currentPrompt: input.prompt,
    rounds: [],
    inputMode: "demo_seed",
    createdAt: now,
    updatedAt: now
  };
}

export function createContinuationSession(input: {
  record: RecordItem;
  prompt: string;
}): CommunicationSession {
  const session = createCommunicationSession({
    flowId: input.record.flowId,
    sourceLabel: `${input.record.title} · 继续追问`,
    prompt: input.prompt
  });

  return {
    ...session,
    continuation: {
      parentRecordId: input.record.id,
      parentTitle: input.record.title,
      parentSummary: input.record.summary,
      suggestedPrompt: input.prompt
    }
  };
}

export function appendSessionRound(input: {
  session: CommunicationSession;
  prompt: string;
  transcript: SessionRound["transcript"];
  agentResult: AgentRunResult;
  provider: TranscriptProvider | "proxy";
}): CommunicationSession {
  const now = Date.now();
  const round: SessionRound = {
    id: `round-${input.session.id}-${input.session.rounds.length + 1}`,
    roundIndex: input.session.rounds.length + 1,
    prompt: input.prompt,
    transcript: input.transcript,
    understanding: input.agentResult.understanding,
    provider: input.provider,
    createdAt: now
  };

  return {
    ...input.session,
    status: "needs_confirmation",
    rounds: [...input.session.rounds, round],
    updatedAt: now
  };
}

function isValidRecord(value: unknown): value is RecordItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as RecordItem;
  return (
    typeof record.id === "string" &&
    typeof record.flowId === "string" &&
    typeof record.title === "string" &&
    typeof record.summary === "string" &&
    typeof record.time === "string" &&
    typeof record.place === "string" &&
    Array.isArray(record.keyPoints) &&
    typeof record.nextStep === "string" &&
    typeof record.actionPhrase === "string" &&
    Boolean(record.aiUnderstanding) &&
    Array.isArray(record.aiUnderstanding.confirmed) &&
    Array.isArray(record.aiUnderstanding.missing) &&
    Array.isArray(record.aiUnderstanding.risks) &&
    typeof record.aiUnderstanding.suggestedQuestion === "string"
  );
}

export function loadStoredRecords(fallback: RecordItem[]): RecordItem[] {
  try {
    const raw = window.localStorage.getItem(RECORD_STORAGE_KEY);
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return fallback;
    }

    const valid = parsed.filter(isValidRecord);
    return valid.length > 0 ? valid : fallback;
  } catch {
    return fallback;
  }
}

export function persistRecords(records: RecordItem[]) {
  try {
    window.localStorage.setItem(RECORD_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // localStorage 不可用时静默降级，不影响演示
  }
}

export function createRecordFromSession(input: {
  session: CommunicationSession;
  flow: DemoFlow;
}): RecordItem {
  const latestRound = input.session.rounds[input.session.rounds.length - 1];
  const understanding = latestRound?.understanding ?? input.flow.aiUnderstanding;

  const transcriptText = latestRound?.transcript.map((line) => line.text).join("").trim();
  const shortSummary = transcriptText
    ? transcriptText.length > 42
      ? `${transcriptText.slice(0, 42)}...`
      : transcriptText
    : input.flow.savedRecord.summary;

  const isContinuation = Boolean(input.session.continuation);
  const rawParentTitle = input.session.continuation?.parentTitle ?? input.session.sourceLabel;
  const baseParentTitle = rawParentTitle.replace(/\s*[··]\s*(继续追问|追问)\s*$/, "");
  const recordTitle = isContinuation ? `${baseParentTitle} · 追问` : input.session.sourceLabel;

  return {
    ...input.flow.savedRecord,
    id: `record-${input.session.id}-r${input.session.rounds.length}`,
    time: "刚刚",
    title: recordTitle,
    summary: shortSummary,
    keyPoints: latestRound?.understanding?.confirmed.slice(0, 3) ?? input.flow.savedRecord.keyPoints,
    nextStep: latestRound?.understanding?.suggestedQuestion ?? input.flow.savedRecord.nextStep,
    aiUnderstanding: understanding
  };
}
