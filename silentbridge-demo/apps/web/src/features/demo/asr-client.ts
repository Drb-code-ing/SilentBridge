import type { DemoFlow } from "./demo-content";
import type { TranscribeRequest, TranscribeResponse } from "./api-contracts";
import { createManualTranscript } from "./real-input-engine";

export async function transcribeAudio(input: {
  sessionId: string;
  flowId: string;
  audioBase64: string;
  audioLength: number;
}): Promise<{ ok: true; transcript: TranscribeResponse["transcript"] } | { ok: false; error: string }> {
  try {
    const response = await fetch("/api/transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: input.sessionId,
        flowId: input.flowId,
        source: "microphone",
        audioBase64: input.audioBase64,
        audioLength: input.audioLength,
      } satisfies TranscribeRequest),
    });

    if (!response.ok) {
      return { ok: false, error: `transcribe-http-${response.status}` };
    }

    const data = (await response.json()) as TranscribeResponse | { ok: false; errorCode: string; message: string };
    if (data.ok && data.transcript.length > 0) {
      return { ok: true, transcript: data.transcript };
    }

    const errorMsg = !data.ok ? data.message : "no-transcript";
    return { ok: false, error: errorMsg };
  } catch (err) {
    const message = err instanceof Error ? err.message : "network-error";
    return { ok: false, error: message };
  }
}

export async function transcribeSession(input: {
  request: TranscribeRequest;
  fallbackFlow: DemoFlow;
}): Promise<TranscribeResponse> {
  if (input.request.source === "manual" && input.request.manualText) {
    return {
      ok: true,
      provider: "manual",
      transcript: createManualTranscript({ text: input.request.manualText })
    };
  }

  if (!shouldUseApiProxy()) {
    return createFallbackTranscription(input.fallbackFlow);
  }

  try {
    const response = await fetch("/api/transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input.request)
    });

    if (!response.ok) {
      throw new Error(`transcribe failed: ${response.status}`);
    }

    const data = (await response.json()) as TranscribeResponse;
    if (data.ok && data.transcript.length > 0) {
      return data;
    }

    throw new Error("transcribe response not ok");
  } catch {
    return createFallbackTranscription(input.fallbackFlow);
  }
}

function createFallbackTranscription(fallbackFlow: DemoFlow): TranscribeResponse {
  return {
    ok: true,
    provider: "fallback",
    transcript: fallbackFlow.captions
  };
}

function shouldUseApiProxy() {
  if (typeof window === "undefined") {
    return false;
  }

  return true;
}
