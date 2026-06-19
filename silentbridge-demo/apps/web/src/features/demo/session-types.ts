import type { AiUnderstanding, DemoFlowId } from "./demo-content";
import type { TranscriptProvider, TranscriptSegmentPayload } from "./api-contracts";

export type SessionStatus =
  | "draft"
  | "showing_prompt"
  | "listening"
  | "transcribing"
  | "understanding"
  | "needs_confirmation"
  | "saved"
  | "failed";

export type InputMode = "demo_seed" | "manual_reply" | "microphone_ready";

export interface SessionRound {
  id: string;
  roundIndex: number;
  prompt: string;
  transcript: TranscriptSegmentPayload[];
  understanding?: AiUnderstanding;
  provider: TranscriptProvider | "proxy";
  createdAt: number;
}

export interface CommunicationSession {
  id: string;
  flowId: DemoFlowId;
  sourceLabel: string;
  status: SessionStatus;
  currentPrompt: string;
  rounds: SessionRound[];
  inputMode: InputMode;
  replyDraft?: string;
  createdAt: number;
  updatedAt: number;
  savedRecordId?: string;
  errorMessage?: string;
}
