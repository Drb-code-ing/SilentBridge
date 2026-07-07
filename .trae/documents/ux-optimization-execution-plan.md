# SilentBridge UX 优化执行计划

> **目标**：字幕纠错 + 录音可视化 + TTS 朗读，TDD 驱动，每步审核验收，确保无 bug 且体验流畅。
> **状态**：待执行
> **创建时间**：2026-07-07

## 背景与当前状态

### 已完成
- Phase 0 测试基础设施：vitest 已在 `apps/api` 和 `apps/web` 配置完成，smoke test 通过
- 百度 ASR 后端 + MediaRecorder 录音方案已上线
- GLM-4 LLM 集成 + 结构化 prompt（场景示例 + 同音词纠错指令）
- 录音按钮 disabled 修复（`isCapturing && captureMode !== "recording"`）

### TDD 红灯已确认（Phase 1 后端）
- 测试文件：`apps/api/test/agent-run.test.ts`（3 个测试，1 失败 2 通过）
- 失败点：`expect(result.correctedText).toBe("这个药饭后吃一次两片")` — `correctedText` 字段不存在

### 关键文件清单
| 文件 | 角色 | 当前状态 |
|---|---|---|
| `apps/api/src/routes/agent-run.ts` | 后端 agent 路由 | 缺 `correctedText` 字段 |
| `apps/api/src/prompts/agent-system-prompt.ts` | LLM prompt | JSON 格式缺 `correctedText` |
| `apps/api/test/agent-run.test.ts` | 后端 TDD 测试 | 红灯已确认 |
| `apps/web/src/features/demo/api-contracts.ts` | 前端类型 | 缺 `correctedText` 字段 |
| `apps/web/src/features/demo/agent-client.ts` | 前端 agent 调用 | 直接透传 response，无需改 |
| `apps/web/src/features/demo/DemoPage.tsx` | 主页面（~1500 行） | 3 处 setAgentResult 需注入字幕纠错 |
| `apps/web/src/styles/globals.css` | 全局样式 | 需添加波形 + 计时器 + TTS 样式 |

---

## Phase 1：字幕纠错（TDD）

### Step 1.1 — 后端 TDD 红灯（✅ 已完成）
- 测试文件 `apps/api/test/agent-run.test.ts` 已创建
- 红灯确认：`correctedText` 字段不存在

### Step 1.2 — 后端实现（绿灯）
**文件 1**：`apps/api/src/prompts/agent-system-prompt.ts`
- 在 JSON 输出格式中添加 `"correctedText": "纠错后的完整文本"`
- 在关键规则中补充："根据场景修正同音词后，返回完整的纠错后文本（合并所有 transcript），不超过 100 字"
- 在每个场景示例的输出 JSON 中添加 `correctedText` 字段

**文件 2**：`apps/api/src/routes/agent-run.ts`
- `AgentRunResponse` 接口添加 `correctedText?: string`
- 在 proxy 分支解析 `parsed.correctedText`，非空字符串时加入响应
- fallback 分支不返回 `correctedText`（保持 undefined）

**验收**：
```bash
pnpm --filter @silentbridge/api test
```
预期：3 个测试全部通过（绿灯）

### Step 1.3 — 前端类型同步
**文件**：`apps/web/src/features/demo/api-contracts.ts`
- `AgentRunResponse` 接口添加 `correctedText?: string`

**验收**：`pnpm --filter @silentbridge/web typecheck` 通过

### Step 1.4 — 前端 TDD 测试（红灯）
**新建文件**：`apps/web/src/features/demo/caption-correction.test.ts`
- 测试纯函数 `applyCaptionCorrection(captions, correctedText, latestCaptionId)`
- 测试用例：
  1. `correctedText` 存在时，替换最后一条字幕的 text
  2. `correctedText` 为 undefined 时，返回原字幕不变
  3. 字幕为空数组时，返回空数组
  4. `latestCaptionId` 不匹配时，返回原字幕不变

**实现要求**：先把纯函数从 DemoPage 抽出来到 `caption-correction.ts`，便于测试

**验收**：测试运行失败（函数不存在）— 红灯确认

### Step 1.5 — 前端实现（绿灯）
**新建文件**：`apps/web/src/features/demo/caption-correction.ts`
```ts
import type { CaptionLine } from "./demo-content";

export function applyCaptionCorrection(
  captions: CaptionLine[],
  correctedText: string | undefined,
  latestCaptionId: string
): CaptionLine[] {
  if (!correctedText || captions.length === 0) {
    return captions;
  }
  const lastIndex = captions.findIndex((c) => c.id === latestCaptionId);
  if (lastIndex === -1) {
    return captions;
  }
  const updated = [...captions];
  updated[lastIndex] = { ...updated[lastIndex], text: correctedText };
  return updated;
}
```

**修改文件**：`apps/web/src/features/demo/DemoPage.tsx`
- 在 3 处 `setAgentResult` 调用后（L855, L1105, L1342），添加字幕纠错逻辑：
```ts
if (response.correctedText && visibleCaptions.length > 0) {
  const latestId = visibleCaptions[visibleCaptions.length - 1].id;
  setVisibleCaptions(prev => applyCaptionCorrection(prev, response.correctedText, latestId));
}
```
- 注意：fallback 分支（L873）不处理 correctedText

**验收**：
```bash
pnpm --filter @silentbridge/web test
pnpm --filter @silentbridge/web typecheck
```
预期：所有测试通过，typecheck 通过

---

## Phase 2：录音状态可视化

### Step 2.1 — TDD 测试（红灯）
**新建文件**：`apps/web/src/features/demo/recording-timer.test.ts`
- 测试 `formatRecordingDuration(seconds)` 函数
- 测试用例：
  1. 0 秒 → "00:00"
  2. 5 秒 → "00:05"
  3. 65 秒 → "01:05"
  4. 3661 秒 → "61:01"（超过 1 小时，仍用 MM:SS）

### Step 2.2 — 实现计时器纯函数（绿灯）
**新建文件**：`apps/web/src/features/demo/recording-timer.ts`
```ts
export function formatRecordingDuration(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
```

### Step 2.3 — DemoPage 集成计时器
**修改文件**：`apps/web/src/features/demo/DemoPage.tsx`
- 新增 state：`const [recordingSeconds, setRecordingSeconds] = useState(0);`
- 新增 useEffect：当 `captureMode === "recording" && isCapturing` 时，每 1 秒递增
- 录音开始时重置为 0，停止时保留显示直到 asrStatus 变化
- 在 `sb-listen-console` 区域显示计时器（仅录音中显示）

### Step 2.4 — 波形动画 CSS
**修改文件**：`apps/web/src/styles/globals.css`
- 为 `.sb-listen-orb` 添加录音波形动画类 `.sb-listen-orb--recording`
- 使用 CSS keyframes 实现脉冲 + 缩放效果（3 层 span 模拟波形条）
- 录音中（`captureMode === "recording"`）添加该类名

**验收**：
```bash
pnpm --filter @silentbridge/web test
pnpm --filter @silentbridge/web typecheck
```
- 手动验收：启动 dev server，点击"开始收听"进入录音状态，确认：
  - 波形动画可见
  - 计时器从 00:00 开始递增
  - 点击"停止并识别"后动画停止

---

## Phase 3：TTS 朗读建议问题

### Step 3.1 — TDD 测试（红灯）
**新建文件**：`apps/web/src/features/demo/tts-player.test.ts`
- 测试 `createTtsPlayer()` 工厂函数
- 测试用例：
  1. `isTtsAvailable()` 返回 boolean（typeof window.speechSynthesis !== "undefined"）
  2. `speak(text)` 在不可用时返回 false，不抛错
  3. `speak(text)` 在可用时调用 `speechSynthesis.speak`（mock 验证）
  4. `stop()` 调用 `speechSynthesis.cancel`

### Step 3.2 — 实现 TTS 模块（绿灯）
**新建文件**：`apps/web/src/features/demo/tts-player.ts`
```ts
export interface TtsPlayer {
  isAvailable(): boolean;
  speak(text: string): boolean;
  stop(): void;
}

export function createTtsPlayer(): TtsPlayer {
  const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;

  return {
    isAvailable() {
      return Boolean(synth);
    },
    speak(text: string) {
      if (!synth || !text.trim()) return false;
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "zh-CN";
      utterance.rate = 0.95;
      synth.speak(utterance);
      return true;
    },
    stop() {
      synth?.cancel();
    }
  };
}
```

### Step 3.3 — DemoPage 集成 TTS
**修改文件**：`apps/web/src/features/demo/DemoPage.tsx`
- 在 `AgentInsightCard` 组件的"请对方确认"按钮旁，添加"朗读"按钮
- 仅当 `ttsPlayer.isAvailable()` 且 `suggestedQuestion` 非空时显示
- 点击调用 `ttsPlayer.speak(suggestedQuestion)`
- 添加 `isSpeaking` state，朗读中按钮文案变为"停止朗读"

**修改文件**：`apps/web/src/styles/globals.css`
- 添加 `.sb-tts-button` 样式（与 `.sb-secondary-button` 一致但更小）

**验收**：
```bash
pnpm --filter @silentbridge/web test
pnpm --filter @silentbridge/web typecheck
```
- 手动验收：完成一次语音识别后，确认 AgentInsightCard 出现"朗读"按钮，点击能发声

---

## Phase 4：E2E 验证 + 全量检查

### Step 4.1 — 全量单元测试
```bash
pnpm --filter @silentbridge/api test
pnpm --filter @silentbridge/web test
```
预期：所有测试通过（后端 3 个 + 前端 smoke + caption-correction + recording-timer + tts-player）

### Step 4.2 — TypeCheck
```bash
pnpm --filter @silentbridge/api typecheck
pnpm --filter @silentbridge/web typecheck
```

### Step 4.3 — Build
```bash
pnpm --filter @silentbridge/web build
```

### Step 4.4 — 手动 E2E 验收路径
启动 `pnpm --filter @silentbridge/api dev` + `pnpm --filter @silentbridge/web dev`

**路径 A：字幕纠错**
1. 打开 http://localhost:5174/
2. 点击"把手机递给对方" → 进入 bridge
3. 点击"对方看完了，开始收听" → 进入录音
4. 说："这都要饭后吃一次两片"（模拟同音词）
5. 点击"停止并识别"
6. **验收**：
   - 字幕区显示纠错后的文本（"这个药饭后吃一次两片"）
   - AI 整理卡片显示结构化要点（标签：内容格式）
   - 不出现原文整句复制

**路径 B：录音可视化**
1. 从路径 A 第 3 步开始
2. **验收**：
   - 录音中波形动画可见
   - 计时器从 00:00 递增
   - 停止后动画停止

**路径 C：TTS 朗读**
1. 完成路径 A
2. **验收**：
   - AgentInsightCard 出现"朗读"按钮
   - 点击后朗读 suggestedQuestion
   - 朗读中按钮变为"停止朗读"
   - 点击"停止朗读"立即停止

**路径 D：回归测试**
1. 不点击"开始收听"，直接在"备用输入"框输入文字，点"整理回复"
2. **验收**：AI 整理正常，无 correctedText 替换（因为不是语音输入）
3. 点击"请对方确认" → 进入新对话
4. **验收**：新对话流程正常

### Step 4.5 — 完成报告
输出结构化完成报告：
- 文件变更清单（新增/修改）
- 测试结果（单元测试数量 + 通过情况）
- typecheck/build 结果
- E2E 验收路径执行结果
- 已知限制（如 TTS 浏览器兼容性）

---

## 执行顺序与依赖

```
Phase 1.2 (后端绿灯) → Phase 1.3 (前端类型) → Phase 1.4 (前端红灯) → Phase 1.5 (前端绿灯)
                                                                          ↓
Phase 2.1 (计时器红灯) → Phase 2.2 (计时器绿灯) → Phase 2.3 (集成) → Phase 2.4 (CSS)
                                                                          ↓
Phase 3.1 (TTS 红灯) → Phase 3.2 (TTS 绿灯) → Phase 3.3 (集成)
                                                                    ↓
Phase 4.1 → 4.2 → 4.3 → 4.4 → 4.5
```

## 风险与缓解

| 风险 | 缓解措施 |
|---|---|
| LLM 不稳定返回 correctedText | 后端解析时校验非空字符串，前端兜底不替换 |
| TTS 在某些浏览器不可用 | `isAvailable()` 检查，不可用时隐藏按钮 |
| 计时器内存泄漏 | useEffect 清理函数清除 interval |
| 字幕纠错影响非语音输入路径 | 仅在 proxy 分支处理，fallback 分支不动 |
| 百度 ASR 网络超时 | 已有 15s 超时 + error 状态处理 |

## 假设与决策

1. **假设**：GLM-4 能稳定按新 prompt 返回 `correctedText` 字段
   - 决策：后端解析时做容错，字段缺失时返回 undefined，前端不替换字幕
2. **假设**：用户在 Chrome/Edge 浏览器使用，支持 speechSynthesis
   - 决策：不兼容时隐藏 TTS 按钮，不影响核心功能
3. **决策**：字幕纠错只替换最后一条字幕（对应最新一次语音输入），不追溯历史
4. **决策**：计时器使用 MM:SS 格式，不超过 99:59（录音超过 100 分钟极少见）
5. **决策**：TTS 朗读使用 `zh-CN` 语言，rate 0.95（略慢于正常语速，便于听障用户理解）
