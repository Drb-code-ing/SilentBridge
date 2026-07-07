const BAIDU_TOKEN_URL = "https://aip.baidubce.com/oauth/2.0/token";
const BAIDU_ASR_URL = "https://vop.baidu.com/server_api";
const REQUEST_TIMEOUT_MS = 15000;

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getBaiduAccessToken(apiKey: string, secretKey: string): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const url = `${BAIDU_TOKEN_URL}?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`;
  const response = await fetch(url, { method: "POST" });
  const data = (await response.json()) as { access_token?: string; expires_in?: number };

  if (!data.access_token) {
    throw new Error("failed-to-get-baidu-token");
  }

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + ((data.expires_in ?? 2592000) - 300) * 1000,
  };
  return cachedToken.token;
}

export interface BaiduAsrResult {
  text: string;
  ok: boolean;
  errorCode?: number;
  errorMessage?: string;
}

export async function recognizeSpeech(input: {
  apiKey: string;
  secretKey: string;
  audioBase64: string;
  audioLength: number;
}): Promise<BaiduAsrResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const token = await getBaiduAccessToken(input.apiKey, input.secretKey);

    const body = {
      format: "wav",
      rate: 16000,
      channel: 1,
      cuid: "silentbridge-demo",
      token,
      speech: input.audioBase64,
      len: input.audioLength,
    };

    const response = await fetch(BAIDU_ASR_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const data = (await response.json()) as {
      err_no?: number;
      err_msg?: string;
      result?: string[];
    };

    if (data.err_no !== 0) {
      return {
        text: "",
        ok: false,
        errorCode: data.err_no,
        errorMessage: data.err_msg ?? "baidu-asr-error",
      };
    }

    const text = data.result?.[0] ?? "";
    return { text, ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown-error";
    return {
      text: "",
      ok: false,
      errorCode: -1,
      errorMessage: message,
    };
  } finally {
    clearTimeout(timeout);
  }
}
