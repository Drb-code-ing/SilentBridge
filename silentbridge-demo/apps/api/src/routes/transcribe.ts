import { getBaiduCredentials } from "../env.js";
import { recognizeSpeech } from "../services/baidu-asr-client.js";

interface TranscribeRequest {
  sessionId: string;
  flowId: string;
  source: "microphone" | "fallback" | "manual";
  audioRef?: string;
  manualText?: string;
  audioBase64?: string;
  audioLength?: number;
}

interface TranscriptSegment {
  id: string;
  speaker: string;
  text: string;
  time: string;
  important?: boolean;
  confidence?: number;
}

interface TranscribeResponse {
  ok: true;
  provider: "proxy" | "fallback" | "manual";
  transcript: TranscriptSegment[];
}

interface TranscribeErrorResponse {
  ok: false;
  errorCode: string;
  message: string;
  fallbackAvailable: boolean;
}

export async function handleTranscribe(
  request: unknown
): Promise<TranscribeResponse | TranscribeErrorResponse> {
  const req = request as TranscribeRequest;

  console.log("[transcribe] received request, source:", req?.source, "audioLength:", req?.audioLength);

  if (!req || typeof req !== "object") {
    return {
      ok: false,
      errorCode: "invalid-request",
      message: "请求格式不正确",
      fallbackAvailable: true,
    };
  }

  if (req.source === "manual" && req.manualText) {
    return {
      ok: true,
      provider: "manual",
      transcript: [
        {
          id: `manual-${Date.now()}`,
          speaker: "对方",
          text: req.manualText,
          time: currentTimeString(),
          important: true,
          confidence: 1,
        },
      ],
    };
  }

  if (!req.audioBase64 || !req.audioLength) {
    console.log("[transcribe] no audio data received");
    return {
      ok: false,
      errorCode: "no-audio",
      message: "没有收到音频数据",
      fallbackAvailable: true,
    };
  }

  const { apiKey, secretKey } = getBaiduCredentials();
  if (!apiKey || !secretKey) {
    console.log("[transcribe] baidu credentials not configured");
    return {
      ok: false,
      errorCode: "asr-not-configured",
      message: "语音识别服务未配置，请在后端设置 BAIDU_API_KEY 和 BAIDU_SECRET_KEY",
      fallbackAvailable: true,
    };
  }

  console.log("[transcribe] calling baidu ASR, audio base64 length:", req.audioBase64.length);

  const result = await recognizeSpeech({
    apiKey,
    secretKey,
    audioBase64: req.audioBase64,
    audioLength: req.audioLength,
  });

  console.log("[transcribe] baidu ASR result:", JSON.stringify(result));

  if (!result.ok || !result.text) {
    return {
      ok: false,
      errorCode: "asr-failed",
      message: result.errorMessage ?? "语音识别失败",
      fallbackAvailable: true,
    };
  }

  return {
    ok: true,
    provider: "proxy",
    transcript: [
      {
        id: `asr-${Date.now()}`,
        speaker: "对方",
        text: result.text,
        time: currentTimeString(),
        important: true,
        confidence: 0.9,
      },
    ],
  };
}

function currentTimeString(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}
