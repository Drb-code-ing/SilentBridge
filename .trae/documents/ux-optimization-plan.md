# SilentBridge UX 优化计划：字幕纠错 + 录音可视化 + TTS 朗读

## Context（背景）

当前 SilentBridge 已完成百度 ASR + GLM-4 提炼的核心链路，但存在三个影响真实使用体验的问题：

1. **字幕与提炼不一致**：百度 ASR 可能将"这个药"识别成"这都要"。GLM-4 在提炼时会自动纠错，但字幕区仍显示原始错误文本，用户困惑。
2. **录音状态不够直观**：录音时只有文字提示"正在录音"，没有波形动画或计时器，用户不确定是否在录音。
3. **建议问题无法直接使用**：AI 生成的 `suggestedQuestion` 没有显示在 UI 上，只有一个"请对方确认"按钮。听障人士打字慢，需要 TTS 朗读让对方直接听到。

用户要求：TDD 测试、e2e 验证、每步审核验收。

---

## Phase 0：测试基础设施

**目标**：安装 vitest，配置测试环境，确保 `pnpm test` 可运行。

### 改动文件

1. `apps/web/package.json` — 添加 devDependencies：
   - `vitest` ^1.6.0
   - `@testing-library/react` ^15.0.0
   - `@testing-library/jest-dom` ^6.4.0
   - `jsdom` ^24.0.0
   - 添加 scripts：`"test": "vitest run"`, `"test:watch": "vitest"`

2. `apps/web/vitest.config.ts`（新建）— 复用 vite alias：
   ```ts
   import { defineConfig } from "vitest/config";
   import react from "@vitejs/plugin-react";
   import path from "path";
   export default defineConfig({
     plugins: [react()],
     test: { environment: "jsdom", globals: true },
     resolve: { alias: { "@silentbridge/shared": path.resolve(__dirname, "../../packages/shared/src") } }
   });
   ```

3. `apps/web/src/test/setup.ts`（新建）— `import "@testing-library/jest-dom";`

### 验收
- `pnpm --filter @silentbridge/web test` 运行无报错（即使没有测试文件）
- `pnpm typecheck` 通过

---

## Phase 1：字幕纠错（优化 1）

### TDD 流程

#### Step 1.1 — 后端测试先行

新建 `apps/api/test/agent-run.test.mjs`：
```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { handleAgentRun } from "../src/routes/agent-run.ts";
// 测试：mock LLM 返回 correctedText，handleAgentRun 应透传该字段
```

但 `tsx` 不支持 `node --test`，改用 vitest 统一测试后端。

**调整方案**：在 `apps/api` 也安装 vitest，测试用 vitest 运行。

新建 `apps/api/test/agent-run.test.ts`：
- 测试 1：`handleAgentRun` 在 LLM 返回 `correctedText` 时，响应中包含该字段
- 测试 2：`handleAgentRun` 在 LLM 不返回 `correctedText` 时，字段为 `undefined`
- 测试 3：fallback 响应中 `correctedText` 为 `undefined`

#### Step 1.2 — 后端实现

1. `apps/api/src/prompts/agent-system-prompt.ts`：
   - JSON 输出格式添加 `"correctedText": "纠错后的完整文本"`
   - 规则补充："根据场景修正同音词后，返回完整的纠错后文本，不超过 100 字"

2. `apps/api/src/routes/agent-run.ts` L18-L30：
   - `AgentRunResponse` 接口添加 `correctedText?: string`
   - L61-L75：解析 `parsed.correctedText`，非空字符串时加入响应
   - `createFallbackResponse` 中不添加 `correctedText`

3. `apps/web/src/features/demo/api-contracts.ts` L44-L56：
   - `AgentRunResponse` 添加 `correctedText?: string`

#### Step 1.3 — 前端测试

新建 `apps/web/src/features/demo/__tests__/caption-correction.test.ts`：
- 测试：收到含 `correctedText` 的响应后，字幕首行文本被替换

#### Step 1.4 — 前端实现

`apps/web/src/features/demo/DemoPage.tsx`：
- 新建辅助函数 `applyCorrectedText(correctedText, visibleCaptions)`：返回新的字幕数组，首行 text 替换为纠错文本
- 在 3 处 `setAgentResult` 调用后（L855、L1105、L1342），若 `response.correctedText` 存在，调用 `setVisibleCaptions(prev => applyCorrectedText(response.correctedText, prev))`

### 验收标准
- 百度 ASR 返回"这都要饭后吃" → GLM-4 返回 `correctedText: "这个药饭后吃"` → 字幕区显示"这个药饭后吃"
- GLM-4 不返回 `correctedText` 时 → 字幕保持原始文本，不报错
- 所有测试通过

---

## Phase 2：录音状态可视化（优化 2）

### TDD 流程

#### Step 2.1 — Hook 测试先行

新建 `apps/web/src/features/demo/__tests__/use-recording-timer.test.ts`：
- 测试 1：`isRecording=true` 时，1 秒后 `seconds` 为 1
- 测试 2：`isRecording=false` 时，`seconds` 为 0
- 测试 3：组件卸载时 interval 被清除

#### Step 2.2 — Hook 实现

新建 `apps/web/src/features/demo/use-recording-timer.ts`：
```ts
export function useRecordingTimer(isRecording: boolean): number {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!isRecording) { setSeconds(0); return; }
    const id = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [isRecording]);
  return seconds;
}
```

#### Step 2.3 — 组件测试

新建 `apps/web/src/features/demo/__tests__/waveform.test.tsx`：
- 测试：`isRecording=true` 时渲染波形元素
- 测试：`isRecording=false` 时不渲染波形

#### Step 2.4 — 组件实现

1. `apps/web/src/styles/globals.css`：
   - 新增 `.sb-waveform`（5 根竖条容器）+ `@keyframes sbWaveBar`（高度交替变化）
   - 新增 `.sb-record-timer`（计时器样式）
   - 在 `.sb-listen-console--listening` 下显示波形

2. `apps/web/src/features/demo/DemoPage.tsx`：
   - `BridgeView` 组件中调用 `useRecordingTimer(isRecording)`
   - L462-L471 `sb-listen-orb` 下方：`isRecording` 时渲染 `<div className="sb-waveform">` 5 个 span + 计时器 `MM:SS`

### 验收标准
- 录音时显示动态波形 + 实时计时器（00:01, 00:02, ...）
- 停止录音后波形消失、计时器归零
- 组件卸载无 interval 泄漏（测试验证）
- 所有测试通过

---

## Phase 3：TTS 朗读建议问题（优化 3）

### TDD 流程

#### Step 3.1 — 组件测试先行

新建 `apps/web/src/features/demo/__tests__/agent-insight-card.test.tsx`：
- 测试 1：`suggestedQuestion` 非空时渲染文本
- 测试 2：`suggestedQuestion` 非空时渲染喇叭按钮
- 测试 3：点击喇叭按钮调用 `window.speechSynthesis.speak`
- 测试 4：`speechSynthesis` 不存在时不渲染喇叭按钮

#### Step 3.2 — 组件实现

1. `apps/web/src/features/demo/DemoPage.tsx` L293-L297（`AgentInsightCard`）：
   - `plainSummary` 下方新增建议问题展示区：
     ```tsx
     {understanding.suggestedQuestion && (
       <div className="sb-suggested-question">
         <span>建议确认</span>
         <p>{understanding.suggestedQuestion}</p>
         {canSpeak && (
           <button className="sb-speak-button" onClick={handleSpeak}>
             {isSpeaking ? "正在朗读..." : "朗读"}
           </button>
         )}
       </div>
     )}
     ```
   - `AgentInsightCard` 内部新增 `isSpeaking` state + `handleSpeak` 函数
   - `handleSpeak`：`new SpeechSynthesisUtterance(understanding.suggestedQuestion)`，设置 `lang='zh-CN'`，`onstart/onend` 更新 state

2. `apps/web/src/styles/globals.css`：
   - `.sb-suggested-question`：卡片样式（浅色背景 + 圆角）
   - `.sb-speak-button`：小按钮样式（喇叭图标 + 文字）
   - `.is-speaking`：朗读中动画

### 验收标准
- AI 结果区显示建议问题文本
- 点击"朗读"按钮 → 浏览器朗读中文
- 朗读中按钮变为"正在朗读..."
- 不支持 `speechSynthesis` 的浏览器隐藏按钮
- 所有测试通过

---

## Phase 4：E2E 验证

### 手动 E2E 测试流程

1. 启动 `pnpm dev:all`
2. 打开 http://localhost:5174/
3. 进入演示 → 选药店场景
4. 点击"开始收听" → 确认波形动画 + 计时器显示
5. 对着麦克风说"这个布洛芬片饭后吃一次两片"
6. 点击"停止并识别"
7. **验证 1**：字幕显示纠错后文本（不是原始识别文本）
8. **验证 2**：AI 提炼区显示结构化要点
9. **验证 3**：建议问题文本可见 + 朗读按钮可点击
10. 点击"朗读" → 确认浏览器朗读中文

### 自动化测试

```bash
pnpm --filter @silentbridge/web test    # 前端 vitest
pnpm --filter @silentbridge/api test    # 后端 vitest
pnpm typecheck                         # 类型检查
pnpm build                            # 生产构建
```

---

## 审核节点

| 节点 | 审核内容 | 验收标准 |
|------|----------|----------|
| Phase 0 完成 | 测试基础设施 | `pnpm test` 运行无报错 |
| Phase 1 完成 | 字幕纠错 | 测试通过 + 手动验证字幕替换 |
| Phase 2 完成 | 录音可视化 | 测试通过 + 手动验证波形和计时器 |
| Phase 3 完成 | TTS 朗读 | 测试通过 + 手动验证朗读功能 |
| Phase 4 完成 | E2E 验证 | 全流程通过 + typecheck + build |

---

## 潜在风险与应对

1. **GLM-4 不返回 `correctedText`** → 默认 `undefined`，字幕保持原始文本，不报错
2. **`speechSynthesis` 浏览器不支持** → 检测 `typeof window.speechSynthesis !== "undefined"`，不支持时隐藏按钮
3. **vitest 安装失败** → 回退到 Node.js 脚本测试（如之前的 test-agent.mjs 方式）
4. **interval 泄漏** → `useEffect` 依赖 `isRecording` 且返回清理函数，测试验证卸载后无泄漏
5. **CSS 动画性能** → 波形只用 `transform: scaleY()`，不触发布局重排

---

## 关键文件清单

| 文件 | 改动类型 |
|------|----------|
| `apps/web/package.json` | 添加 vitest 依赖 |
| `apps/api/package.json` | 添加 vitest 依赖 |
| `apps/web/vitest.config.ts` | 新建 |
| `apps/web/src/test/setup.ts` | 新建 |
| `apps/api/src/prompts/agent-system-prompt.ts` | 修改：添加 correctedText |
| `apps/api/src/routes/agent-run.ts` | 修改：解析 correctedText |
| `apps/web/src/features/demo/api-contracts.ts` | 修改：添加 correctedText 字段 |
| `apps/web/src/features/demo/DemoPage.tsx` | 修改：字幕替换 + 波形 + TTS |
| `apps/web/src/features/demo/use-recording-timer.ts` | 新建 |
| `apps/web/src/styles/globals.css` | 修改：波形 + 计时器 + TTS 样式 |
| `apps/api/test/agent-run.test.ts` | 新建：后端测试 |
| `apps/web/src/features/demo/__tests__/caption-correction.test.ts` | 新建 |
| `apps/web/src/features/demo/__tests__/use-recording-timer.test.ts` | 新建 |
| `apps/web/src/features/demo/__tests__/waveform.test.tsx` | 新建 |
| `apps/web/src/features/demo/__tests__/agent-insight-card.test.tsx` | 新建 |
