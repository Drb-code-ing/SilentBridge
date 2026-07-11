import { Hono } from "hono";
import { handle } from "hono/vercel";

export const config = {
  runtime: "nodejs",
  maxDuration: 30
};

function envFlags() {
  return {
    asrApiKeyConfigured: Boolean(process.env.ASR_API_KEY),
    agentApiKeyConfigured: Boolean(process.env.AGENT_API_KEY),
    hasZhipuKey: Boolean(process.env.ZHIPU_API_KEY),
    hasBaiduAsr: Boolean(process.env.BAIDU_API_KEY && process.env.BAIDU_SECRET_KEY)
  };
}

function nowTime() {
  const d = new Date();
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}

async function baiduToken(apiKey: string, secretKey: string) {
  const url = "https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=" + apiKey + "&client_secret=" + secretKey;
  const res = await fetch(url, { method: "POST" });
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("failed-to-get-baidu-token");
  return data.access_token;
}

async function baiduAsr(apiKey: string, secretKey: string, audioBase64: string, audioLength: number) {
  const token = await baiduToken(apiKey, secretKey);
  const res = await fetch("https://vop.baidu.com/server_api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      format: "wav",
      rate: 16000,
      channel: 1,
      cuid: "silentbridge-demo",
      token,
      speech: audioBase64,
      len: audioLength
    })
  });
  const data = (await res.json()) as { err_no?: number; err_msg?: string; result?: string[] };
  if (data.err_no !== 0) return { ok: false as const, errorMessage: data.err_msg || "baidu-asr-error" };
  return { ok: true as const, text: (data.result && data.result[0]) || "" };
}

async function handleTranscribe(req: any) {
  if (!req || typeof req !== "object") {
    return { ok: false, errorCode: "invalid-request", message: "请求格式不正确", fallbackAvailable: true };
  }
  if (req.source === "manual" && req.manualText) {
    return {
      ok: true,
      provider: "manual",
      transcript: [{ id: "manual-" + Date.now(), speaker: "对方", text: req.manualText, time: nowTime(), important: true, confidence: 1 }]
    };
  }
  if (!req.audioBase64 || !req.audioLength) {
    return { ok: false, errorCode: "no-audio", message: "没有收到音频数据", fallbackAvailable: true };
  }
  const apiKey = process.env.BAIDU_API_KEY || "";
  const secretKey = process.env.BAIDU_SECRET_KEY || "";
  if (!apiKey || !secretKey) {
    return { ok: false, errorCode: "asr-not-configured", message: "语音识别服务未配置", fallbackAvailable: true };
  }
  try {
    const result = await baiduAsr(apiKey, secretKey, req.audioBase64, req.audioLength);
    if (!result.ok || !("text" in result) || !result.text) {
      return { ok: false, errorCode: "asr-failed", message: ("errorMessage" in result && result.errorMessage) || "语音识别失败", fallbackAvailable: true };
    }
    return {
      ok: true,
      provider: "proxy",
      transcript: [{ id: "asr-" + Date.now(), speaker: "对方", text: result.text, time: nowTime(), important: true, confidence: 0.9 }]
    };
  } catch (e) {
    return { ok: false, errorCode: "asr-failed", message: e instanceof Error ? e.message : "asr-error", fallbackAvailable: true };
  }
}

function fallbackAgent() {
  return {
    ok: true,
    provider: "fallback",
    graphName: "silentbridge-proxy-placeholder",
    visitedNodes: ["fallback"],
    understanding: {
      confirmed: [] as string[],
      missing: ["AI 服务暂时不可用"],
      risks: [{ level: "low", text: "已降级到本地规则引擎整理。" }],
      suggestedQuestion: "请把关键信息写下来，我需要确认。",
      plainSummary: "当前 AI 服务未配置或调用失败，已使用本地整理。"
    }
  };
}

async function handleAgentRun(req: any) {
  const apiKey = process.env.ZHIPU_API_KEY;
  if (!apiKey) return fallbackAgent();
  const sceneMap: Record<string, string> = { clinic: "医院问诊", pharmacy: "药店", service: "政务窗口", traffic: "交通问路", generic: "通用沟通" };
  const scene = sceneMap[(req && req.flowId) || "generic"] || "通用沟通";
  const lines = Array.isArray(req && req.transcript) ? req.transcript : [];
  const transcriptText = lines.map((l: any) => "[" + (l.time || "") + "] " + (l.speaker || "") + "：" + (l.text || "")).join("\n");
  const systemPrompt = "你是 SilentBridge 无声桥 AI 沟通副驾驶。场景：" + scene + "。把对方的话提炼成 JSON：confirmed/missing/risks/suggestedQuestion/plainSummary/correctedText。confirmed 用标签：内容。不要编造，不要医疗诊断。只返回 JSON。";
  const userPrompt = "对方说的话：\n" + transcriptText + "\n\n用户想表达：" + ((req && req.userMessage) || "（无）") + "\n请返回 JSON。";
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey },
      body: JSON.stringify({
        model: "glm-4-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      }),
      signal: controller.signal
    });
    if (!res.ok) throw new Error("zhipu " + res.status + " " + (await res.text()));
    const data = (await res.json()) as any;
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error("empty zhipu content");
    const parsed = JSON.parse(content);
    return {
      ok: true,
      provider: "proxy",
      graphName: "silentbridge-glm4-agent",
      visitedNodes: ["asr_capture", "context_classifier", "risk_guard", "confirmation_question", "record_writer"],
      understanding: {
        confirmed: Array.isArray(parsed.confirmed) ? parsed.confirmed.slice(0, 5) : [],
        missing: Array.isArray(parsed.missing) ? parsed.missing.slice(0, 4) : ["请对方再确认一次关键信息"],
        risks: Array.isArray(parsed.risks) ? parsed.risks.slice(0, 3) : [],
        suggestedQuestion: typeof parsed.suggestedQuestion === "string" && parsed.suggestedQuestion.trim() ? parsed.suggestedQuestion : "请把关键信息写下来，我需要确认。",
        plainSummary: typeof parsed.plainSummary === "string" && parsed.plainSummary.trim() ? parsed.plainSummary : "已整理对方的话。"
      },
      ...(typeof parsed.correctedText === "string" && parsed.correctedText.trim() ? { correctedText: parsed.correctedText.trim() } : {})
    };
  } catch (e) {
    console.error("[agent-run]", e);
    return fallbackAgent();
  } finally {
    clearTimeout(t);
  }
}

const app = new Hono().basePath("/api");

app.get("/health", (c) => c.json({ ok: true, runtime: "vercel-inline", ...envFlags() }));

app.post("/transcribe", async (c) => {
  try {
    return c.json(await handleTranscribe(await c.req.json()));
  } catch (e) {
    console.error(e);
    return c.json({ ok: false, errorCode: "internal-error", message: e instanceof Error ? e.message : "fail", fallbackAvailable: true }, 500);
  }
});

app.post("/agent/run", async (c) => {
  try {
    return c.json(await handleAgentRun(await c.req.json()));
  } catch (e) {
    console.error(e);
    return c.json(fallbackAgent());
  }
});

app.notFound((c) => c.json({ ok: false, error: "not-found", path: c.req.path }, 404));
app.onError((err, c) => {
  console.error(err);
  return c.json({ ok: false, error: "internal-server-error" }, 500);
});

export default handle(app);
