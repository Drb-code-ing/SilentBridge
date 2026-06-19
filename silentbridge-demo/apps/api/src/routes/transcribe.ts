interface TranscribeRequest {
  sessionId: string;
  flowId: string;
  source: "microphone" | "fallback";
  audioRef?: string;
}

interface TranscribeResponse {
  ok: true;
  provider: "proxy" | "fallback";
  transcript: Array<{
    id: string;
    speaker: string;
    text: string;
    time: string;
    important?: boolean;
  }>;
}

export async function handleTranscribe(_request: unknown): Promise<TranscribeResponse> {
  return {
    ok: true,
    provider: "fallback",
    transcript: []
  };
}
