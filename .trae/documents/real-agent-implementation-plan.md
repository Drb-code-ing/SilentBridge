# SilentBridge 真实 Agent 实现计划（A + C 混合方案）

## Context（背景与目标）

### 问题诊断

当前 SilentBridge 的 Agent 反馈链路存在核心缺陷：

1. **`agent-client.ts` 的 `shouldUseApiProxy()` 默认返回 false**，前端永远走 fallback 路径
2. **`runDemoAgent`** 调用 `createUnderstandingFromTranscript`，但该函数是**模板填空**而非真实理解：
   - `confirmed` 只是把 transcript 文本截断 46 字符 + 一句固定模板
   - `missing` / `risks` 只用两个正则切换固定模板
   - `suggestedQuestion` 是**固定字符串**，无论用户说什么都返回同一句
3. **后端 `apps/api/src/routes/agent-run.ts` 是占位实现**，返回静态 "未配置" 文案，未调用任何 LLM

**结果：** 用户用语音说「我头疼」和「我要办身份证」返回的理解卡片结构几乎一样，只是 firstFact 不同。这不是 agent，是模板填空。

### 目标

让 Agent **真正基于用户语音内容生成有差异、有意义的反馈**，采用 A + C 混合方案：

- **方案 A（规则兜底）**：重写 `createUnderstandingFromTranscript`，按场景做真实关键词抽取、缺失项识别、动态生成 suggestedQuestion。纯前端、即时生效、赛题合规。
- **方案 C（LLM 优先）**：在 apps/api 实现 Hono 后端，接入智谱 GLM-4-Flash（永久免费），部署到 Vercel。真实 LLM 生成，但需要 API key 和部署。
- **混合策略**：默认走 LLM 代理；后端不可用或未配置时自动降级到规则引擎；规则引擎仍比当前模板填空强得多。

### 用户决策

- LLM 提供商：智谱 GLM-4-Flash（永久免费，128K 上下文，30 并发）
- 部署平台：Vercel
- 不要求全部前端，允许引入后端

---

## 架构总览

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (apps/web)                                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ DemoPage.tsx                                          │  │
│  │  ├─ runBrowserSpeechPipeline ──┐                      │  │
│  │  └─ runManualReplyPipeline ────┤                      │  │
│  │                                 ▼                      │  │
│  │  runSessionAgent(request)                              │  │
│  │  ├─ shouldUseApiProxy() ?                              │  │
│  │  │   ├─ YES → fetch /api/agent/run ──┐                │  │
│  │  │   └─ NO  → createUnderstandingFromTranscript()     │  │
│  │  │            (方案 A：增强规则引擎)                    │  │
│  │  │                                                    │  │
│  │  └─ on error → fallback to createUnderstandingFromTranscript() │
│  └───────────────────────────────────────────────────────┘  │
│                          │                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │ Vite proxy /api → localhost:8787
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend (apps/api) - Hono on Vercel                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ POST /api/agent/run                                   │  │
│  │  ├─ read ZHIPU_API_KEY from env                       │  │
│  │  ├─ if not configured → return rule-engine fallback   │  │
│  │  ├─ build system prompt (scene-aware)                 │  │
│  │  ├─ call GLM-4-Flash via fetch                        │  │
│  │  ├─ parse JSON response                               │  │
│  │  └─ return AgentRunResponse                           │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  智谱 BigModel API                                            │
│  https://open.bigmodel.cn/api/paas/v4/chat/completions       │
│  model: glm-4-flash (永久免费)                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase A：增强规则引擎（前端，立即可做）

### 目标

重写 `createUnderstandingFromTranscript`，让它基于 transcript 真实内容生成有差异的 `AiUnderstanding`，而不是模板填空。

### 改动文件

**`apps/web/src/features/demo/real-input-engine.ts`**（重写核心函数）

新增场景化抽取逻辑：

```ts
// 新增：场景化关键词抽取
interface SceneFactExtractor {
  confirmed: string[];      // 从文本中抽取的客观事实
  missing: string[];        // 该场景应有哪些关键信息但缺失
  risks: RiskItem[];        // 识别的风险点
  suggestedQuestion: string;// 基于缺失项动态生成
}

// 按 flowId 分派到不同抽取器
function extractFactsByScene(flowId: DemoFlowId, text: string): SceneFactExtractor {
  switch (flowId) {
    case "pharmacy": return extractMedicalFacts(text);
    case "service":  return extractServiceFacts(text);
    case "traffic":  return extractTrafficFacts(text);
    default:         return extractGenericFacts(text);
  }
}
```

**各场景抽取规则：**

- **`extractMedicalFacts`（药店/医疗）**
  - 抽取：药名（`/[\u4e00-\u9fa5]{2,6}(片|丸|胶囊|冲剂|口服液)/`）、剂量（`/一次\d+|一天\d+次|饭前|饭后|睡前/`）、禁忌（`/不能|避免|禁忌|同服/`）、症状（`/疼|炎|烧|咳|晕|过敏/`）、复诊（`/复诊|复查|回医院|急诊/`）
  - 缺失检测：药名？剂量？禁忌？复诊时间？
  - 风险：发现"不能同服"标记 high；发现症状但无剂量标记 medium
  - suggestedQuestion：根据缺失项拼接，如"请把药名、用量和不能一起吃的东西写下来"

- **`extractServiceFacts`（政务窗口）**
  - 抽取：材料（`/身份证|照片|复印件|户口本|材料/`）、窗口（`/\d+号窗口|综合业务/`）、步骤（`/取号|排队|办理|填表/`）、截止（`/今天|明天|上午|下午|截止/`）
  - 缺失检测：材料清单？窗口号？截止时间？
  - 风险：材料不全标记 medium；截止时间紧迫标记 high
  - suggestedQuestion：如"请再写一下还缺哪些材料，以及今天最晚几点能办"

- **`extractTrafficFacts`（交通问路）**
  - 抽取：方向（`/左|右|前|后|往|朝/`）、线路（`/\d+号线|\d+路/`）、站点（`/站|换乘|出口|入口/`）、距离（`/\d+米|远|近/`）
  - 缺失检测：入口？换乘站？站数？
  - 风险：方向有"对面"标记 high；换乘未明确标记 medium
  - suggestedQuestion：如"请再写一下我要从哪个出口进站，换乘后坐几站"

- **`extractGenericFacts`（通用）**
  - 抽取：时间（`/今天|明天|\d+点|\d+分/`）、地点（`/[省市路街号室楼]/`）、动作（`/需要|必须|请|确认/`）
  - 缺失检测：时间？地点？下一步？
  - suggestedQuestion：基于缺失项动态拼接

### 改动 `createUnderstandingFromTranscript`

```ts
export function createUnderstandingFromTranscript(input: {
  flow: DemoFlow;
  transcript: TranscriptSegmentPayload[] | CaptionLine[];
  userMessage: string;
}): AiUnderstanding {
  const joinedText = input.transcript.map((line) => line.text).join(" ").trim();
  if (!joinedText) {
    return input.flow.aiUnderstanding;
  }

  const extracted = extractFactsByScene(input.flow.id, joinedText);
  const firstFact = joinedText.length > 46 ? `${joinedText.slice(0, 46)}...` : joinedText;

  return {
    confirmed: extracted.confirmed.length > 0
      ? extracted.confirmed
      : [firstFact, `用户想表达：${input.userMessage}`],
    missing: extracted.missing,
    risks: extracted.risks.length > 0 ? extracted.risks : [{
      level: "low",
      text: "信息已记录，但仍建议确认下一步动作。"
    }],
    suggestedQuestion: extracted.suggestedQuestion,
    plainSummary: `对方大意是：${firstFact}`
  };
}
```

### 验收

- 用不同 transcript 内容调用，返回的 confirmed/missing/suggestedQuestion 应有实质差异
- `pnpm typecheck` 通过
- 现有 demo 流程不被破坏（fallback 路径仍可用）

---

## Phase C：后端 LLM 代理（Hono + 智谱 GLM-4-Flash + Vercel）

### 目标

在 apps/api 实现真实 LLM 调用，部署到 Vercel，前端默认走代理路径。

### 改动文件清单

#### 新建文件

| 文件路径 | 作用 |
|---|---|
| `apps/api/src/services/zhipu-client.ts` | 智谱 GLM-4-Flash API 客户端 |
| `apps/api/src/prompts/agent-system-prompt.ts` | 系统提示词模板（场景感知） |
| `apps/api/vercel.json` | Vercel 部署配置 |
| `apps/api/.env.example` | 环境变量文档 |
| `.gitignore` | 补充 `.env`、`.env.local` |

#### 修改文件

| 文件路径 | 改动 |
|---|---|
| `apps/api/package.json` | 添加 `hono` 依赖、`dev`/`start` 脚本、`@types/node` |
| `apps/api/src/server.ts` | 用 Hono 重写（保留原生路由逻辑） |
| `apps/api/src/env.ts` | 读取 `ZHIPU_API_KEY`，暴露 `hasZhipuKey` 标志 |
| `apps/api/src/routes/agent-run.ts` | 实现 LLM 调用 + fallback 逻辑 |
| `apps/api/src/routes/transcribe.ts` | 保持现状（初赛不需要真实 ASR 后端） |
| `package.json`（根） | 添加 `dev:api`、`dev:all` 脚本 |
| `apps/web/src/features/demo/agent-client.ts` | 默认启用 proxy；失败时降级到规则引擎 |
| `apps/web/src/features/demo/DemoPage.tsx` | UI 显示"AI 模式"指示器 |

### 详细设计

#### 1. `apps/api/src/services/zhipu-client.ts`

```ts
interface ZhipuChatRequest {
  model: "glm-4-flash";
  messages: Array<{ role: "system" | "user"; content: string }>;
  response_format?: { type: "json_object" };
  temperature?: number;
}

interface ZhipuChatResponse {
  choices: Array<{
    message: { content: string };
  }>;
}

const ZHIPU_ENDPOINT = "https://open.bigmodel.cn/api/paas/v4/chat/completions";

export async function callZhipuChat(input: {
  apiKey: string;
  systemPrompt: string;
  userPrompt: string;
}): Promise<string> {
  const body: ZhipuChatRequest = {
    model: "glm-4-flash",
    messages: [
      { role: "system", content: input.systemPrompt },
      { role: "user", content: input.userPrompt }
    ],
    response_format: { type: "json_object" },
    temperature: 0.3
  };

  const response = await fetch(ZHIPU_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${input.apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`zhipu api error: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as ZhipuChatResponse;
  return data.choices[0]?.message?.content ?? "";
}
```

#### 2. `apps/api/src/prompts/agent-system-prompt.ts`

场景感知的系统提示词，根据 flowId 切换场景描述：

```ts
const SCENE_CONTEXT: Record<string, string> = {
  pharmacy: "药店/医疗场景。重点关注：药名、用量、服药时间、禁忌、症状、复诊时间。",
  service:  "政务窗口场景。重点关注：所需材料、窗口号、办理步骤、截止时间、费用。",
  traffic:  "交通问路场景。重点关注：方向、线路、站点、换乘、出口、距离。",
  generic:  "通用沟通场景。重点关注：时间、地点、关键信息、下一步动作。"
};

export function buildSystemPrompt(flowId: string): string {
  const scene = SCENE_CONTEXT[flowId] ?? SCENE_CONTEXT.generic;
  return `你是 SilentBridge 无声桥的 AI 沟通副驾驶，帮助听障用户理解对话重点。

当前场景：${scene}

任务：分析用户提供的转写文本，提取用户需要确认的关键信息。

输出格式（严格 JSON，不要任何额外文本）：
{
  "confirmed": ["已确认的事实1", "已确认的事实2"],
  "missing": ["还需确认的信息1"],
  "risks": [{"level": "low|medium|high", "text": "风险描述"}],
  "suggestedQuestion": "一句话建议用户向对方确认的问题",
  "plainSummary": "一句话用通俗语言总结对方大意"
}

规则：
1. confirmed：从文本中提取的客观事实（药名、剂量、时间、地点、材料、步骤等），每条不超过 30 字
2. missing：根据场景判断还缺少哪些关键信息，每条不超过 20 字
3. risks：识别可能的误解风险（用药错误、材料遗漏、方向错误等），level 用 low/medium/high
4. suggestedQuestion：基于 missing 生成一个自然的确认问题，不超过 50 字
5. plainSummary：用通俗语言总结对方说了什么，不超过 40 字
6. 不要给出医疗诊断或专业建议，只做信息整理
7. 语言用中文，语气平和、得体
8. 如果信息不完整，宁可多列 missing，不要编造 confirmed`;
}

export function buildUserPrompt(input: {
  transcript: Array<{ speaker: string; text: string; time: string }>;
  userMessage: string;
}): string {
  const transcriptText = input.transcript
    .map((line) => `[${line.time}] ${line.speaker}：${line.text}`)
    .join("\n");
  return `转写文本：
${transcriptText}

用户想表达：${input.userMessage}

请分析并返回 JSON。`;
}
```

#### 3. `apps/api/src/routes/agent-run.ts`（重写）

```ts
import { callZhipuChat } from "../services/zhipu-client.js";
import { buildSystemPrompt, buildUserPrompt } from "../prompts/agent-system-prompt.js";

interface AgentRunRequest {
  sessionId: string;
  flowId: string;
  transcript: Array<{ id: string; speaker: string; text: string; time: string; important?: boolean }>;
  userMessage: string;
  round: number;
}

interface AgentRunResponse {
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
}

export async function handleAgentRun(request: unknown): Promise<AgentRunResponse> {
  const req = request as AgentRunRequest;
  const apiKey = process.env.ZHIPU_API_KEY;

  // 无 API key → 返回 fallback 标记，前端会再降级到规则引擎
  if (!apiKey) {
    return createFallbackResponse();
  }

  try {
    const systemPrompt = buildSystemPrompt(req.flowId);
    const userPrompt = buildUserPrompt({
      transcript: req.transcript,
      userMessage: req.userMessage
    });

    const rawContent = await callZhipuChat({ apiKey, systemPrompt, userPrompt });
    const parsed = JSON.parse(rawContent) as AgentRunResponse["understanding"];

    return {
      ok: true,
      provider: "proxy",
      graphName: "silentbridge-glm4-agent",
      visitedNodes: ["asr_capture", "context_classifier", "risk_guard", "confirmation_question", "record_writer"],
      understanding: {
        confirmed: Array.isArray(parsed.confirmed) ? parsed.confirmed : [],
        missing: Array.isArray(parsed.missing) ? parsed.missing : [],
        risks: Array.isArray(parsed.risks) ? parsed.risks : [],
        suggestedQuestion: typeof parsed.suggestedQuestion === "string" ? parsed.suggestedQuestion : "请把关键信息写下来，我需要确认。",
        plainSummary: typeof parsed.plainSummary === "string" ? parsed.plainSummary : "已整理对方的话。"
      }
    };
  } catch (error) {
    console.error("[agent-run] LLM call failed:", error);
    return createFallbackResponse();
  }
}

function createFallbackResponse(): AgentRunResponse {
  return {
    ok: true,
    provider: "fallback",
    graphName: "silentbridge-proxy-placeholder",
    visitedNodes: ["asr_capture", "context_classifier", "risk_guard", "confirmation_question", "record_writer"],
    understanding: {
      confirmed: [],
      missing: ["AI 服务暂时不可用"],
      risks: [{ level: "low", text: "已降级到本地规则引擎整理。" }],
      suggestedQuestion: "请把关键信息写下来，我需要确认。",
      plainSummary: "当前 AI 服务未配置，已使用本地整理。"
    }
  };
}
```

#### 4. `apps/api/src/server.ts`（用 Hono 重写）

```ts
import { Hono } from "hono";
import { handleAgentRun } from "./routes/agent-run.js";
import { handleTranscribe } from "./routes/transcribe.js";
import { getServerEnv } from "./env.js";

const app = new Hono();

app.get("/api/health", (c) => c.json({ ok: true, ...getServerEnv() }));
app.post("/api/transcribe", async (c) => {
  const body = await c.req.json();
  const result = await handleTranscribe(body);
  return c.json(result);
});
app.post("/api/agent/run", async (c) => {
  const body = await c.req.json();
  const result = await handleAgentRun(body);
  return c.json(result);
});

// Vercel serverless export
export default app;
```

#### 5. `apps/api/package.json`

```json
{
  "name": "@silentbridge/api",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "start": "node --import tsx src/server.ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "hono": "^4.6.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsx": "^4.19.0"
  }
}
```

#### 6. 本地 dev 入口（保留 `src/server.ts` 末尾）

```ts
// 仅本地 dev 启动 HTTP server，Vercel 部署时用 default export
if (process.env.NODE_ENV !== "production") {
  const PORT = Number(process.env.PORT) || 8787;
  Bun.serve({ port: PORT, fetch: app.fetch });  // 或用 @hono/node-server
}
```

**更稳的方案**：用 `@hono/node-server` 保持 Node.js 兼容（不依赖 Bun）：

```ts
import { serve } from "@hono/node-server";

if (process.env.NODE_ENV !== "production") {
  const PORT = Number(process.env.PORT) || 8787;
  serve({ fetch: app.fetch, port: PORT }, (info) => {
    console.log(`[silentbridge-api] listening on http://localhost:${info.port}`);
  });
}
```

#### 7. `apps/api/vercel.json`

```json
{
  "version": 2,
  "builds": [
    {
      "src": "apps/api/src/server.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "apps/api/src/server.ts" }
  ]
}
```

**注**：Vercel 部署配置可能需要在根目录 `vercel.json`，具体部署时调整。

#### 8. `apps/api/.env.example`

```
# 智谱 GLM-4-Flash API Key（永久免费，注册地址 https://bigmodel.cn）
ZHIPU_API_KEY=

# 本地开发端口（默认 8787）
PORT=8787
```

#### 9. 根 `package.json` 脚本

```json
{
  "scripts": {
    "dev": "pnpm --filter @silentbridge/web dev",
    "dev:api": "pnpm --filter @silentbridge/api dev",
    "dev:all": "pnpm -r --parallel dev",
    "build": "pnpm --filter @silentbridge/web build",
    "preview": "pnpm --filter @silentbridge/web preview",
    "typecheck": "pnpm -r typecheck"
  }
}
```

### 前端集成改动

#### `apps/web/src/features/demo/agent-client.ts`

修改 `shouldUseApiProxy()` 默认行为：

```ts
function shouldUseApiProxy() {
  if (typeof window === "undefined") {
    return false;
  }

  const search = new URLSearchParams(window.location.search);
  // 显式禁用：?api=local
  if (search.get("api") === "local") {
    return false;
  }
  // 显式启用：?api=proxy
  if (search.get("api") === "proxy") {
    return true;
  }
  // localStorage 控制
  const stored = window.localStorage.getItem("silentbridge.apiProxy");
  if (stored === "enabled") {
    return true;
  }
  if (stored === "disabled") {
    return false;
  }
  // 默认：尝试启用（后端不可用时 fetch 会失败，自动降级）
  return true;
}
```

#### `apps/web/src/features/demo/DemoPage.tsx`

在 `sb-safety-strip` 区域添加 AI 模式指示器：

```tsx
<aside className="sb-safety-strip">
  <span>AI 模式</span>
  <p>{runtimeStatus.privacyNote}</p>
  <div className="sb-runtime-tags">
    <span>{agentProvider === "proxy" ? "GLM-4 实时整理" : "本地规则整理"}</span>
    <span>不会在前端保存密钥</span>
  </div>
</aside>
```

---

## 验证方案

### Phase A 验证（规则引擎）

1. `pnpm typecheck` 通过
2. 单元测试：对不同 transcript 调用 `createUnderstandingFromTranscript`，确认返回差异化结果
3. 手动验证：
   - 输入「这个药饭后吃，一天三次」→ confirmed 包含"饭后""一天三次"，missing 包含"药名"
   - 输入「需要身份证和照片，到 3 号窗口」→ confirmed 包含"身份证""照片""3 号窗口"，missing 包含"截止时间"
   - 输入「坐 2 号线到人民广场」→ confirmed 包含"2 号线""人民广场"，missing 包含"出口""换乘"

### Phase C 验证（LLM 代理）

1. 配置 `.env.local`：`ZHIPU_API_KEY=your_key`
2. 启动后端：`pnpm dev:api`（监听 8787）
3. 健康检查：`curl http://localhost:8787/api/health` → 返回 `{ ok: true, agentApiKeyConfigured: true }`
4. 启动前端：`pnpm dev`（5173）
5. 浏览器访问 `http://localhost:5173`（默认启用 proxy）
6. 走完整流程：首页 → 开桥 → 收听（语音或手动输入）→ 查看 AgentInsightCard
7. 确认 `agentProvider` 显示 "proxy"，理解卡片内容基于真实语音内容生成
8. 关闭后端后重试：应自动降级到规则引擎，`agentProvider` 显示 "fallback"

### 端到端验证

1. `pnpm typecheck` 通过
2. `pnpm build` 通过
3. 移动端 390px 视觉无溢出
4. 无后端时 demo 仍可用（规则引擎兜底）
5. 有后端时 LLM 生成内容有明显差异化

---

## 执行顺序

1. **Phase A.1**：重写 `real-input-engine.ts` 的 `createUnderstandingFromTranscript`
2. **Phase A.2**：`pnpm typecheck` 验证
3. **Phase C.1**：添加 apps/api 依赖（hono、tsx、@hono/node-server、@types/node）
4. **Phase C.2**：重写 `apps/api/src/server.ts`（Hono）
5. **Phase C.3**：新建 `services/zhipu-client.ts`、`prompts/agent-system-prompt.ts`
6. **Phase C.4**：重写 `routes/agent-run.ts` 调用 LLM
7. **Phase C.5**：更新 `env.ts`、添加 `.env.example`
8. **Phase C.6**：添加 `vercel.json`、更新根 `package.json` 脚本
9. **Phase C.7**：修改前端 `agent-client.ts` 默认启用 proxy
10. **Phase C.8**：更新 DemoPage.tsx 的 AI 模式指示器
11. **验证**：typecheck + build + 手动 E2E 测试

---

## 风险与降级

| 风险 | 降级方案 |
|---|---|
| 智谱 API 调用失败（网络/限流） | `agent-run.ts` try/catch → 返回 fallback 标记 → 前端再降级到规则引擎 |
| ZHIPU_API_KEY 未配置 | 后端返回 provider: "fallback" → 前端走规则引擎 |
| Vercel 部署冷启动慢 | LLM 调用有 10s 超时 → 超时降级到规则引擎 |
| LLM 返回非 JSON | `JSON.parse` 失败 → 降级到规则引擎 |
| 前端 fetch /api 失败（后端未启动） | 现有 `agent-client.ts` 已有 try/catch → 降级到 `runDemoAgent` |

**核心保证：** 任何情况下，demo 都能用规则引擎跑通，不会因为后端问题白屏。

---

## 不在本次范围

- 真实 ASR 后端（`/api/transcribe` 保持占位，浏览器 Web Speech API 已够用）
- 用户登录 / 数据库持久化
- 真实医院/政务数据接入
- LangGraph 服务端编排（复赛扩展）
- 复赛的多场景模板配置后台
