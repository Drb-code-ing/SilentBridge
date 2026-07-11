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
    if (typeof window === "undefined") {
      return fallback;
    }

    const raw = window.localStorage.getItem(RECORD_STORAGE_KEY);
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return fallback;
    }

    const valid = parsed.filter(isValidRecord);
    // 用户曾保存过但全部校验失败时，不静默覆盖成种子数据
    if (valid.length === 0 && parsed.length > 0) {
      console.warn("[session-store] stored records failed validation, using fallback seeds");
    }
    return valid.length > 0 ? valid : fallback;
  } catch {
    return fallback;
  }
}

export function persistRecords(records: RecordItem[]): { ok: boolean; error?: string } {
  try {
    if (typeof window === "undefined") {
      return { ok: false, error: "no-window" };
    }

    window.localStorage.setItem(RECORD_STORAGE_KEY, JSON.stringify(records));
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "storage-unavailable";
    console.warn("[session-store] persistRecords failed:", message);
    return { ok: false, error: message };
  }
}

export function canCreateRecordFromSession(session: CommunicationSession): boolean {
  return session.rounds.length > 0 && Boolean(session.rounds[session.rounds.length - 1]?.understanding);
}

function formatRecordTime(now = new Date()): string {
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  return `${month}/${day} ${hour}:${minute}`;
}

export function createRecordFromSession(input: {
  session: CommunicationSession;
  flow: DemoFlow;
  now?: Date;
}): RecordItem | null {
  if (!canCreateRecordFromSession(input.session)) {
    return null;
  }

  const latestRound = input.session.rounds[input.session.rounds.length - 1];
  const understanding = latestRound.understanding!;

  const confirmed = understanding.confirmed.filter(Boolean);
  const missing = understanding.missing.filter(Boolean);
  const structuredSummary =
    understanding.plainSummary?.trim() ||
    (confirmed.length > 0
      ? `${confirmed.slice(0, 3).join("；")}${missing[0] ? `。待确认：${missing[0]}` : "。"}`
      : input.flow.savedRecord.summary);

  const isContinuation = Boolean(input.session.continuation);
  const rawParentTitle = input.session.continuation?.parentTitle ?? input.session.sourceLabel;
  const baseParentTitle = rawParentTitle.replace(/\s*[··]\s*(继续追问|追问|一键演示)\s*$/g, "");
  const cleanedSource = input.session.sourceLabel.replace(
    /\s*[··]\s*(一键演示|继续追问|追问确认|当场追问|追问)\s*$/g,
    ""
  );
  const recordTitle = isContinuation
    ? `${baseParentTitle} · 追问`
    : cleanedSource || input.flow.savedRecord.title;

  const keyPoints =
    confirmed.length > 0 ? confirmed.slice(0, 4) : input.flow.savedRecord.keyPoints;

  return {
    ...input.flow.savedRecord,
    // 以会话场景为准，避免模板 flowId 与真实会话不一致
    flowId: input.session.flowId,
    id: `record-${input.session.id}-r${input.session.rounds.length}-${Date.now()}`,
    time: formatRecordTime(input.now),
    title: recordTitle,
    place: input.flow.savedRecord.place,
    summary: structuredSummary,
    keyPoints,
    nextStep: understanding.suggestedQuestion || input.flow.savedRecord.nextStep,
    actionPhrase: understanding.suggestedQuestion || input.flow.savedRecord.actionPhrase,
    aiUnderstanding: understanding
  };
}
