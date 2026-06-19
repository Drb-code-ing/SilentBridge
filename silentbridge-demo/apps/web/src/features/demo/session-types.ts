import type { AiUnderstanding, DemoFlowId } from "./demo-content";
import type { TranscriptSegmentPayload } from "./api-contracts";

export type SessionStatus =
  | "draft"
  | "showing_prompt"
  | "listening"
  | "transcribing"
  | "understanding"
  | "needs_confirmation"
  | "saved"
  | "failed";

export interface SessionRound {
  id: string;
  roundIndex: number;
  prompt: string;
  transcript: TranscriptSegmentPayload[];
  understanding?: AiUnderstanding;
  provider: "proxy" | "fallback";
  createdAt: number;
}

export interface CommunicationSession {
  id: string;
  flowId: DemoFlowId;
  sourceLabel: string;
  status: SessionStatus;
  currentPrompt: string;
  rounds: SessionRound[];
  createdAt: number;
  updatedAt: number;
  savedRecordId?: string;
  errorMessage?: string;
}
