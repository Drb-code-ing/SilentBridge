import type { DemoFlow } from "./demo-content";
import type { TranscribeRequest, TranscribeResponse } from "./api-contracts";
import { createManualTranscript } from "./real-input-engine";

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

  const search = new URLSearchParams(window.location.search);
  return search.get("api") === "proxy" || window.localStorage.getItem("silentbridge.apiProxy") === "enabled";
}
