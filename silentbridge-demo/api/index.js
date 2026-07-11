// SilentBridge Vercel API - pure JS, no monorepo imports, no Hono
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

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "Content-Type, Authorization"
    }
  });
}

async function baiduToken(apiKey, secretKey) {
  const url =
    "https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=" +
    encodeURIComponent(apiKey) +
    "&client_secret=" +
    encodeURIComponent(secretKey);
  const res = await fetch(url, { method: "POST" });
  const data = await res.json();
  if (!data.access_token) {
    throw new Error("failed-to-get-baidu-token");
  }
  return data.access_token;
}

async function baiduAsr(apiKey, secretKey, audioBase64, audioLength) {
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
  const data = await res.json();
  if (data.err_no !== 0) {
    return { ok: false, errorMessage: data.err_msg || "baidu-asr-error", errorCode: data.err_no };
  }
  return { ok: true, text: (data.result && data.result[0]) || "" };
}

async function handleTranscribe(req) {
  if (!req || typeof req !== "object") {
    return {
      ok: false,
      errorCode: "invalid-request",
      message: "请求格式不正确",
      fallbackAvailable: true
    };
  }

  if (req.source === "manual" && req.manualText) {
    return {
      ok: true,
      provider: "manual",
      transcript: [
        {
          id: "manual-" + Date.now(),
          speaker: "对方",
          text: String(req.manualText),
          time: nowTime(),
          important: true,
          confidence: 1
        }
      ]
    };
  }

  if (!req.audioBase64 || !req.audioLength) {
    return {
      ok: false,
      errorCode: "no-audio",
      message: "没有收到音频数据",
      fallbackAvailable: true
    };
  }

  const apiKey = process.env.BAIDU_API_KEY || "";
  const secretKey = process.env.BAIDU_SECRET_KEY || "";
  if (!apiKey || !secretKey) {
    return {
      ok: false,
      errorCode: "asr-not-configured",
      message: "语音识别服务未配置（缺少 BAIDU_API_KEY / BAIDU_SECRET_KEY）",
      fallbackAvailable: true
    };
  }

  try {
    const result = await baiduAsr(apiKey, secretKey, req.audioBase64, req.audioLength);
    if (!result.ok || !result.text) {
      return {
        ok: false,
        errorCode: "asr-failed",
        message: result.errorMessage || "语音识别失败",
        fallbackAvailable: true
      };
    }
    return {
      ok: true,
      provider: "proxy",
      transcript: [
        {
          id: "asr-" + Date.now(),
          speaker: "对方",
          text: result.text,
          time: nowTime(),
          important: true,
          confidence: 0.9
        }
      ]
    };
  } catch (e) {
    return {
      ok: false,
      errorCode: "asr-failed",
      message: e instanceof Error ? e.message : "asr-error",
      fallbackAvailable: true
    };
  }
}

function fallbackAgent(extra) {
  return {
    ok: true,
    provider: "fallback",
    graphName: "silentbridge-proxy-placeholder",
    visitedNodes: ["fallback"],
    understanding: {
      confirmed: [],
      missing: ["AI 服务暂时不可用"],
      risks: [{ level: "low", text: "已降级到本地规则引擎整理。" }],
      suggestedQuestion: "请把关键信息写下来，我需要确认。",
      plainSummary: extra || "当前 AI 服务未配置或调用失败，已使用本地整理。"
    }
  };
}

async function handleAgentRun(req) {
  const apiKey = process.env.ZHIPU_API_KEY;
  if (!apiKey) return fallbackAgent("未配置 ZHIPU_API_KEY");

  const sceneMap = {
    clinic: "医院问诊",
    pharmacy: "药店",
    service: "政务窗口",
    traffic: "交通问路",
    generic: "通用沟通"
  };
  const scene = sceneMap[(req && req.flowId) || "generic"] || "通用沟通";
  const lines = Array.isArray(req && req.transcript) ? req.transcript : [];
  const transcriptText = lines
    .map(function (l) {
      return "[" + (l.time || "") + "] " + (l.speaker || "") + "：" + (l.text || "");
    })
    .join("\n");

  const systemPrompt =
    "你是 SilentBridge 无声桥 AI 沟通副驾驶。场景：" +
    scene +
    "。把对方的话提炼成 JSON：confirmed/missing/risks/suggestedQuestion/plainSummary/correctedText。confirmed 用“标签：内容”。不要编造，不要医疗诊断。只返回 JSON。";
  const userPrompt =
    "对方说的话：\n" +
    transcriptText +
    "\n\n用户想表达：" +
    ((req && req.userMessage) || "（无）") +
    "\n请返回 JSON。";

  const controller = new AbortController();
  const timer = setTimeout(function () {
    controller.abort();
  }, 12000);

  try {
    const res = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey
      },
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
    if (!res.ok) {
      throw new Error("zhipu " + res.status + " " + (await res.text()));
    }
    const data = await res.json();
    const content =
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content;
    if (!content) throw new Error("empty zhipu content");
    const parsed = JSON.parse(content);
    const out = {
      ok: true,
      provider: "proxy",
      graphName: "silentbridge-glm4-agent",
      visitedNodes: [
        "asr_capture",
        "context_classifier",
        "risk_guard",
        "confirmation_question",
        "record_writer"
      ],
      understanding: {
        confirmed: Array.isArray(parsed.confirmed) ? parsed.confirmed.slice(0, 5) : [],
        missing: Array.isArray(parsed.missing)
          ? parsed.missing.slice(0, 4)
          : ["请对方再确认一次关键信息"],
        risks: Array.isArray(parsed.risks) ? parsed.risks.slice(0, 3) : [],
        suggestedQuestion:
          typeof parsed.suggestedQuestion === "string" && parsed.suggestedQuestion.trim()
            ? parsed.suggestedQuestion
            : "请把关键信息写下来，我需要确认。",
        plainSummary:
          typeof parsed.plainSummary === "string" && parsed.plainSummary.trim()
            ? parsed.plainSummary
            : "已整理对方的话。"
      }
    };
    if (typeof parsed.correctedText === "string" && parsed.correctedText.trim()) {
      out.correctedText = parsed.correctedText.trim();
    }
    return out;
  } catch (e) {
    console.error("[agent-run]", e);
    return fallbackAgent(e instanceof Error ? e.message : "agent-failed");
  } finally {
    clearTimeout(timer);
  }
}

function getPathname(req) {
  try {
    return new URL(req.url).pathname;
  } catch (e) {
    return "";
  }
}

export default async function handler(req) {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET,POST,OPTIONS",
          "access-control-allow-headers": "Content-Type, Authorization"
        }
      });
    }

    const pathname = getPathname(req);

    if (
      req.method === "GET" &&
      (pathname === "/api/health" || pathname === "/health" || pathname === "/api" || pathname === "/")
    ) {
      return json({ ok: true, runtime: "vercel-js", ...envFlags() });
    }

    if (req.method === "POST" && (pathname === "/api/transcribe" || pathname.endsWith("/transcribe"))) {
      const body = await req.json();
      return json(await handleTranscribe(body));
    }

    if (req.method === "POST" && (pathname === "/api/agent/run" || pathname.endsWith("/agent/run"))) {
      const body = await req.json();
      return json(await handleAgentRun(body));
    }

    return json({ ok: false, error: "not-found", path: pathname }, 404);
  } catch (e) {
    console.error("[api handler]", e);
    return json(
      {
        ok: false,
        error: "internal-server-error",
        message: e instanceof Error ? e.message : "unknown"
      },
      500
    );
  }
}
