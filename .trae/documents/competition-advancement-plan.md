# SilentBridge 初赛晋级提升计划

## Context（背景与目标）

### 当前项目状态

经过 15 个 phase 的迭代开发，SilentBridge 已具备完整的核心交互链路：4 个场景（药店/政务/交通/通用）、实时字幕、AI 重点提炼、快捷沟通卡、会话摘要、记录管理、浏览器语音识别（Web Speech API）、sessionStorage 状态持久化。

**已完成的部分（来自此前 real-agent-implementation-plan.md）：**
- Phase A：前端规则引擎重写（`real-input-engine.ts` 场景化抽取器）✅
- Phase C.1-3：`apps/api/package.json` 更新、`server.ts` 用 Hono 重写、`zhipu-client.ts` 和 `agent-system-prompt.ts` 已创建 ✅

**未完成的部分：**
- Phase C.4-8：`agent-run.ts` 仍是占位实现、`env.ts` 未读 ZHIPU_API_KEY、无 `vercel.json`、前端 `agent-client.ts` 默认未启用 proxy、DemoPage 无 AI 模式指示器
- `pnpm install` 因 EPERM 权限失败（pnpm store 写入被拒）

### 晋级差距分析

从 `TRAE执行包/04_合规检查清单.md` 和 `02_TRAE_IDE初赛Demo开发任务.md` 的要求出发，对照当前项目，识别出以下差距：

| 差距 | 严重度 | 说明 |
|---|---|---|
| Agent 仍返回 mock 数据 | **致命** | `agent-run.ts` 占位实现，未调用 LLM；这是核心卖点 |
| 无在线体验链接 | **致命** | 合规清单要求"可提供体验链接或 HTML Zip" |
| 无产品介绍首页 | **高** | 评审第一印象差，直接进交互页看不到产品全貌 |
| README 严重过时 | **高** | 仍写 Phase 01-06，无 apps/api，无 Hono/LLM，无在线链接 |
| 移动端适配未验证 | **高** | 合规清单要求"桌面端和移动端均检查过" |
| 证据链未填写 | **高** | Session ID 和截图均为空 |
| 无错误边界 | **中** | 任何组件异常会白屏，影响评审体验 |
| pnpm install 失败 | **阻塞** | EPERM 权限问题阻塞后续所有工作 |

### 目标

完成上述差距，让 SilentBridge 达到初赛晋级水平：真实 LLM 接入 + 在线可体验 + 完整文档证据 + 移动端适配 + 产品化首屏。

### 用户决策

- 添加简洁产品介绍首页（Landing Page）
- 部署到 Vercel 提供在线体验链接
- 继续此前的 A+C 混合方案（LLM 优先 + 规则兜底）

---

## 执行计划

### 阶段 0：解除阻塞 — 修复 pnpm install

**问题**：`E:\.pnpm-store` 写入时 EPERM，pnpm 无法将 tarball 重命名到 store。

**解决步骤**：
1. 检查 `E:\.pnpm-store` 是否存在权限问题（可能被其他进程占用或只读）
2. 配置 pnpm 使用项目内 store：在 `silentbridge-demo/.npmrc` 中设置 `store-dir=.pnpm-store-local`（项目根已存在该目录，说明可能曾尝试此方案）
3. 重新运行 `pnpm install --no-frozen-lockfile`（在 `silentbridge-demo` 目录下）
4. 验证：`pnpm typecheck` 通过

**改动文件**：
- `silentbridge-demo/.npmrc`（新建或确认存在）：`store-dir=.pnpm-store-local`

**验收**：`pnpm install` 成功，`pnpm typecheck` 在 apps/web 和 apps/api 都通过

---

### 阶段 1：完成 Phase C — LLM 真实接入

这是核心卖点，必须完成。基于已有的 `real-agent-implementation-plan.md`，完成剩余的 C.4-C.8。

#### 1.1 重写 `apps/api/src/routes/agent-run.ts`（Phase C.4）

**当前状态**：占位实现，返回静态 "未配置" 文案。

**改动**：调用 `callZhipuChat`，解析 JSON 响应，失败时降级。

```ts
import { callZhipuChat } from "../services/zhipu-client.js";
import { buildSystemPrompt, buildUserPrompt } from "../prompts/agent-system-prompt.js";

export async function handleAgentRun(request: unknown): Promise<AgentRunResponse> {
  const req = request as AgentRunRequest;
  const apiKey = process.env.ZHIPU_API_KEY;

  if (!apiKey) {
    return createFallbackResponse();
  }

  try {
    const systemPrompt = buildSystemPrompt(req.flowId);
    const userPrompt = buildUserPrompt({
      transcript: req.transcript,
      userMessage: req.userMessage
    });

    const result = await callZhipuChat({ apiKey, systemPrompt, userPrompt });
    const parsed = JSON.parse(result.content) as AgentRunResponse["understanding"];

    return {
      ok: true,
      provider: "proxy",
      graphName: "silentbridge-glm4-agent",
      visitedNodes: ["asr_capture", "context_classifier", "risk_guard", "confirmation_question", "record_writer"],
      understanding: {
        confirmed: Array.isArray(parsed.confirmed) ? parsed.confirmed.slice(0, 5) : [],
        missing: Array.isArray(parsed.missing) ? parsed.missing.slice(0, 4) : ["请对方再确认一次关键信息"],
        risks: Array.isArray(parsed.risks) ? parsed.risks.slice(0, 3) : [],
        suggestedQuestion: typeof parsed.suggestedQuestion === "string" ? parsed.suggestedQuestion : "请把关键信息写下来，我需要确认。",
        plainSummary: typeof parsed.plainSummary === "string" ? parsed.plainSummary : "已整理对方的话。"
      }
    };
  } catch (error) {
    console.error("[agent-run] LLM call failed:", error);
    return createFallbackResponse();
  }
}
```

`createFallbackResponse()` 返回 `provider: "fallback"` 标记，前端会再降级到规则引擎。

#### 1.2 更新 `apps/api/src/env.ts`（Phase C.5）

**改动**：暴露 `hasZhipuKey` 标志（不暴露 key 本身）。

```ts
export function getServerEnv() {
  return {
    asrApiKeyConfigured: Boolean(process.env.ASR_API_KEY),
    agentApiKeyConfigured: Boolean(process.env.AGENT_API_KEY),
    hasZhipuKey: Boolean(process.env.ZHIPU_API_KEY)
  };
}
```

#### 1.3 创建 `apps/api/.env.example`（Phase C.5）

```
# 智谱 GLM-4-Flash API Key（永久免费，注册地址 https://bigmodel.cn）
ZHIPU_API_KEY=

# 本地开发端口（默认 8787）
PORT=8787
```

#### 1.4 创建 `apps/api/vercel.json` 和根 `vercel.json`（Phase C.6）

`apps/api/vercel.json`：
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/server.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "src/server.ts" }
  ]
}
```

根 `silentbridge-demo/vercel.json`：配置前端 + 后端协同部署（具体配置在部署时按 Vercel 实际要求调整）。

#### 1.5 更新根 `package.json` 脚本（Phase C.6）

```json
{
  "scripts": {
    "dev": "pnpm --filter @silentbridge/web dev",
    "dev:api": "pnpm --filter @silentbridge/api dev",
    "dev:all": "pnpm -r --parallel dev",
    "build": "pnpm --filter @silentbridge/web build",
    "build:api": "pnpm --filter @silentbridge/api build",
    "preview": "pnpm --filter @silentbridge/web preview",
    "typecheck": "pnpm -r typecheck"
  }
}
```

#### 1.6 修改 `apps/web/src/features/demo/agent-client.ts`（Phase C.7）

**改动**：`shouldUseApiProxy()` 默认返回 `true`（后端不可用时自动降级到规则引擎）。

```ts
function shouldUseApiProxy() {
  if (typeof window === "undefined") return false;
  const search = new URLSearchParams(window.location.search);
  if (search.get("api") === "local") return false;
  if (search.get("api") === "proxy") return true;
  const stored = window.localStorage.getItem("silentbridge.apiProxy");
  if (stored === "enabled") return true;
  if (stored === "disabled") return false;
  return true; // 默认启用
}
```

#### 1.7 更新 `DemoPage.tsx` AI 模式指示器（Phase C.8）

在 `sb-safety-strip` 区域显示当前 Agent 来源（GLM-4 实时整理 / 本地规则整理）。

**改动文件**：`apps/web/src/features/demo/DemoPage.tsx`

在现有的 runtime status 显示区域，根据 `agentProvider`（从 AgentRunResponse.provider 获取）显示标签：
- `provider === "proxy"` → "GLM-4 实时整理"
- `provider === "fallback"` → "本地规则整理"

#### 1.8 创建 `apps/api/.env.local`（本地开发用，不提交）

用户需要自行填入 ZHIPU_API_KEY。在 `.gitignore` 中确认 `.env.local` 被忽略。

**验收**：
- `pnpm typecheck` 通过
- `pnpm dev:api` 启动后端，`curl http://localhost:8787/api/health` 返回 `hasZhipuKey: true`
- `pnpm dev` 启动前端，浏览器走完整流程，AgentInsightCard 显示 LLM 生成的差异化内容
- 关闭后端后重试，自动降级到规则引擎，不白屏

---

### 阶段 2：产品介绍首页（Landing Page）

**目标**：让评审进入后先看到产品价值，再进入演示。

#### 2.1 新建 `apps/web/src/features/landing/LandingPage.tsx`

**内容结构**（单页，约 200 行）：
1. **Hero 区**：产品名 "SilentBridge 无声桥"、一句话价值主张 "让听障者在每次对话中被看见、被理解"、两个按钮："进入演示" / "了解更多"
2. **痛点区**：3 个目标用户场景卡片（听障人士日常沟通 / 临时失语患者就医 / 不便开口的政务办理）
3. **特性区**：3 个核心能力卡片（实时语音转写 / AI 重点提炼 / 一键确认回复）
4. **技术区**：简述技术栈（TRAE IDE + React + GLM-4 + Web Speech API），强调 "由 TRAE IDE 创建"
5. **底部**：进入演示按钮 + 合规说明

**视觉**：遵循现有 Tailwind 风格，白底 + 黑色大字 + 薄荷绿点缀，避免蓝紫渐变。

#### 2.2 修改 `apps/web/src/app/App.tsx` 添加路由

用简单的 state 切换（不引入 react-router，保持轻量）：

```tsx
import { useState } from "react";
import { LandingPage } from "../features/landing/LandingPage";
import { DemoPage } from "../features/demo/DemoPage";

type View = "landing" | "demo";

function App() {
  const [view, setView] = useState<View>("landing");
  if (view === "landing") {
    return <LandingPage onEnterDemo={() => setView("demo")} />;
  }
  return <DemoPage onBackHome={() => setView("landing")} />;
}
```

**改动**：
- 新建 `apps/web/src/features/landing/LandingPage.tsx`
- 修改 `apps/web/src/app/App.tsx`
- `DemoPage` 的顶部 "回到首页" 按钮需调用 `onBackHome` 回调（修改 DemoPage 的 props）

**验收**：
- 首次进入显示 Landing Page
- 点击 "进入演示" 跳转到 DemoPage
- DemoPage 顶部 "无声桥" logo 可点击返回 Landing Page

---

### 阶段 3：错误边界与体验优化

#### 3.1 添加 React ErrorBoundary

**新建** `apps/web/src/components/ErrorBoundary.tsx`：

捕获子组件异常，显示友好的错误提示（而非白屏），提供"重试"按钮。

**修改** `apps/web/src/app/App.tsx`：用 ErrorBoundary 包裹 DemoPage。

#### 3.2 移动端适配验证

**检查项**：
- 390px 宽度下所有卡片、按钮、文字无溢出
- 顶部栏、快捷沟通卡、大字展示卡在窄屏下可正常滚动
- 字幕区域在小屏下可读
- 触摸目标尺寸 ≥ 44px

**改动**：根据检查结果调整 `apps/web/src/styles/globals.css` 中的响应式样式（如有溢出）。

**验收**：Chrome DevTools 切换到 iPhone 12 (390px) 视图，所有页面无横向滚动、无文字截断。

---

### 阶段 4：文档完善

#### 4.1 重写 `silentbridge-demo/README.md`

**当前问题**：仍写 Phase 01-06，无 apps/api，无 Hono/LLM，无在线链接。

**重写内容**：
1. 产品简介（一句话价值主张）
2. 在线体验链接（Vercel URL，部署后填入）
3. 核心功能列表（4 个场景 + 5 个核心能力）
4. 技术栈（前端：React + Vite + Tailwind；后端：Hono + 智谱 GLM-4-Flash；部署：Vercel）
5. 快速开始（安装、配置 .env.local、启动前端/后端/全栈）
6. 项目结构（更新为含 apps/api 的 monorepo 结构）
7. 部署说明（Vercel + 环境变量配置）
8. 合规说明（由 TRAE IDE 创建，保留 Session ID 和截图）

#### 4.2 更新 `TRAE执行包/03_证据链记录表.md`

填写初赛阶段的 Session ID 和产物文件（从 `docs/evidence/session-registry.md` 汇总）。

#### 4.3 确认 `docs/evidence/session-log.md` 完整性

检查是否记录了所有关键 Session ID（至少 3 个），如不足需补充。

**验收**：README 反映当前项目真实状态，证据链记录表填写完整。

---

### 阶段 5：Vercel 部署

#### 5.1 准备部署配置

- 确认根 `vercel.json` 配置正确（前端 + 后端协同）
- 确认 `apps/api/vercel.json` 配置正确
- 确认 `.gitignore` 忽略 `.env.local`、`node_modules`、`dist`

#### 5.2 部署到 Vercel

**步骤**：
1. 在 Vercel 导入 Git 仓库（或用 Vercel CLI）
2. 配置环境变量：`ZHIPU_API_KEY`（在 Vercel Dashboard 设置）
3. 部署
4. 验证：
   - 访问 `https://<project>.vercel.app/` 显示 Landing Page
   - 进入演示，走完整流程，Agent 返回 LLM 生成内容
   - `https://<project>.vercel.app/api/health` 返回 `hasZhipuKey: true`

#### 5.3 记录在线链接

将 Vercel URL 填入：
- `README.md` 的 "在线体验" 区
- `TRAE执行包/03_证据链记录表.md`
- `报名材料/报名要求核对清单.md` 的 "可交互 Demo 链接"

**验收**：在线链接可访问，LLM 功能正常，移动端可用。

---

## 执行顺序

| 序号 | 阶段 | 任务 | 预计工作量 |
|---|---|---|---|
| 1 | 阶段 0 | 修复 pnpm install（.npmrc 配置） | 5 分钟 |
| 2 | 阶段 1.1-1.2 | 重写 agent-run.ts + 更新 env.ts | 15 分钟 |
| 3 | 阶段 1.3-1.5 | 创建 .env.example、vercel.json、更新根 package.json | 10 分钟 |
| 4 | 阶段 1.6-1.7 | 修改前端 agent-client.ts + DemoPage 指示器 | 15 分钟 |
| 5 | 阶段 1.8 | typecheck + 本地 E2E 验证 | 10 分钟 |
| 6 | 阶段 2 | 创建 Landing Page + 修改 App.tsx | 30 分钟 |
| 7 | 阶段 3 | ErrorBoundary + 移动端验证 | 20 分钟 |
| 8 | 阶段 4 | 重写 README + 证据链整理 | 20 分钟 |
| 9 | 阶段 5 | Vercel 部署 + 验证 | 20 分钟 |

**总计**：约 2.5 小时

---

## 风险与降级

| 风险 | 降级方案 |
|---|---|
| pnpm install 持续失败 | 改用 npm install，或清理 .pnpm-store 后重试 |
| ZHIPU_API_KEY 未配置 | 后端返回 fallback → 前端走规则引擎，demo 仍可用 |
| Vercel 部署失败 | 导出 HTML Zip 作为备份（LLM 不可用，规则引擎兜底） |
| LLM 调用超时 | 12s 超时 → 降级到规则引擎 |
| 移动端样式溢出 | 增加响应式断点调整 |

**核心保证**：任何情况下，demo 都能用规则引擎跑通，不会因为后端问题白屏。

---

## 不在本次范围

- 真实 ASR 后端（浏览器 Web Speech API 已够用）
- 用户登录 / 数据库持久化
- 真实医院/政务数据接入
- 单元测试（初赛不强制，复赛再补）
- PWA / 离线支持
- 复赛的多场景模板配置后台

---

## 验收清单

完成以下所有项即达到晋级水平：

- [ ] `pnpm install` 成功
- [ ] `pnpm typecheck` 通过
- [ ] `pnpm build` 通过
- [ ] `agent-run.ts` 调用真实 LLM（配置 key 后）
- [ ] 前端默认走 proxy，后端不可用时降级到规则引擎
- [ ] DemoPage 显示 AI 模式指示器
- [ ] Landing Page 可正常显示和跳转
- [ ] ErrorBoundary 就位
- [ ] 移动端 390px 无溢出
- [ ] README 反映当前项目状态
- [ ] 证据链记录表填写完整
- [ ] Vercel 部署成功，在线链接可访问
- [ ] 在线链接下 LLM 功能正常
