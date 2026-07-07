export interface TranscriptSegmentPayload {
  id: string;
  speaker: string;
  text: string;
  time: string;
  important?: boolean;
  confidence?: number;
}

export type TranscriptSource = "microphone" | "fallback" | "manual";
export type TranscriptProvider = "proxy" | "fallback" | "manual" | "browser";

export interface TranscribeRequest {
  sessionId: string;
  flowId: string;
  source: TranscriptSource;
  audioRef?: string;
  manualText?: string;
  audioBase64?: string;
  audioLength?: number;
}

export interface TranscribeResponse {
  ok: true;
  provider: TranscriptProvider;
  transcript: TranscriptSegmentPayload[];
}

export interface ApiErrorResponse {
  ok: false;
  errorCode: string;
  message: string;
  fallbackAvailable: boolean;
}

export interface AgentRunRequest {
  sessionId: string;
  flowId: string;
  transcript: TranscriptSegmentPayload[];
  userMessage: string;
  round: number;
}

export interface AgentRunResponse {
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
