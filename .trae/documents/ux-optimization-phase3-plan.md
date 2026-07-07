# SilentBridge UX 优化 Phase 3：失败恢复 + 权限引导 + 记录页 + 组件拆分

## Context

上一轮 Phase 2 完成了 AI 加载态骨架卡和字幕纠错可视化。用户要求继续修复剩余 4 个体验痛点，并强调"分步优化，每一步完成都要审核、验证，确保项目的稳定、可用"。

本计划分 4 步推进，每步独立 TDD + 验证（typecheck/build/test 全过），完成一步审核通过后再细化下一步。当前文件只对 Step 1 给出详细 TDD 步骤；Step 2-4 给出概要，待前一步完成后补充细节。

## 当前状态分析

经实际读取确认：

- **失败恢复**：`DemoPage.tsx` 中 ASR 失败（L1380-1391）和 AI 整理失败（L1440-1447）都设 `asrStatus="error"`。但 AI 整理失败时字幕已识别成功（L1394 已 `setVisibleCaptions`），却因 `asrStatus="error"` 导致 `captionsDone=false`，字幕区无法进入"已抓到重点"状态。错误提示只有 `flowNotice` 一行字，无结构化恢复选项。
- **麦克风权限**：`audio-capture-client.ts` 的 `requestMicrophoneAccess` 已返回详细的 `AudioCaptureFailureReason`（6 种），但 `DemoPage.tsx` L1325 只用统一一句话提示，未区分原因，也无"如何重新授权"的步骤。
- **历史记录页**：`RecordsView`（L612-726）有 list/detail 两模式，支持删除/重置/继续追问。无搜索、筛选、排序。`RecordItem` 类型在 `demo-content.ts` L23-34。
- **DemoPage 结构**：主组件 L796-1570（约 770 行）。已拆分的模块有 19 个（caption-correction/recording-timer/tts-player/agent-loading-state/AgentLoadingCard/session-store 等）。未拆分的组件有 Mascot/AppTopBar/HomeView/ProgressDots/DisplayCard/CaptionPanel/AgentInsightCard/BridgeView/RecordsView/PhrasesView/BottomNav 共 11 个。

---

## Step 1 — 失败恢复路径（详细 TDD）

**目标**：区分"ASR 失败"和"AI 整理失败"两种场景，提供结构化恢复选项；AI 整理失败时保留已识别字幕，不让用户白说一遍。

### Step 1.1 — TDD 红灯：失败场景推断纯函数

**新建** `apps/web/src/features/demo/failure-recovery.ts`（先只放类型和函数签名，不实现逻辑）

**新建** `apps/web/src/features/demo/failure-recovery.test.ts`：

测试 `inferFailureScenario(state)` 纯函数：
- ASR 失败：`asrStatus="error"` + `visibleCaptions=[]` + `permissionState!="denied"` → `"asr-failed"`
- AI 整理失败：`asrStatus="error"` + `visibleCaptions.length>0` + `!agentResult` → `"agent-failed"`
- 麦克风被拒：`asrStatus="error"` + `permissionState="denied"` + `visibleCaptions=[]` → `"microphone-denied"`
- 无失败：`asrStatus="done"` → `"none"`
- ASR 失败但已有旧字幕（edge case）：`asrStatus="error"` + `visibleCaptions.length>0` + `agentResult` 存在 → `"asr-failed"`（agent 已成功，是新一轮 ASR 失败）

测试 `getRecoveryOptions(scenario)` 纯函数：
- `"asr-failed"` → 3 个选项：retry-listen / manual-input / demo-captions
- `"agent-failed"` → 3 个选项：retry-agent / view-captions / manual-input
- `"microphone-denied"` → 2 个选项：manual-input / demo-captions
- `"none"` → 空数组

**验收**：运行测试，2 个 describe 块的预期失败确认红灯。

### Step 1.2 — 绿灯实现

**实现** `failure-recovery.ts`：

```ts
export type FailureScenario = "asr-failed" | "agent-failed" | "microphone-denied" | "none";

export interface RecoveryOption {
  id: "retry-listen" | "manual-input" | "demo-captions" | "retry-agent" | "view-captions";
  label: string;
  hint: string;
}

export function inferFailureScenario(state: {
  asrStatus: string;
  agentResult: unknown;
  visibleCaptions: unknown[];
  permissionState: string;
}): FailureScenario {
  if (state.asrStatus !== "error") return "none";
  if (state.visibleCaptions.length > 0 && !state.agentResult) return "agent-failed";
  if (state.permissionState === "denied" && state.visibleCaptions.length === 0) return "microphone-denied";
  return "asr-failed";
}

export function getRecoveryOptions(scenario: FailureScenario): RecoveryOption[] {
  switch (scenario) {
    case "asr-failed":
      return [
        { id: "retry-listen", label: "重新收听", hint: "再试一次语音识别" },
        { id: "manual-input", label: "手动输入", hint: "让对方直接打字" },
        { id: "demo-captions", label: "演示字幕", hint: "用演示流程跑通" }
      ];
    case "agent-failed":
      return [
        { id: "retry-agent", label: "重新整理", hint: "再试一次 AI 整理" },
        { id: "view-captions", label: "查看字幕", hint: "字幕已识别，可手动整理" },
        { id: "manual-input", label: "手动输入", hint: "直接打字回复" }
      ];
    case "microphone-denied":
      return [
        { id: "manual-input", label: "手动输入", hint: "不需要麦克风" },
        { id: "demo-captions", label: "演示字幕", hint: "用演示流程跑通" }
      ];
    default:
      return [];
  }
}
```

**验收**：`pnpm --filter @silentbridge/web exec vitest run failure-recovery` 全部通过。

### Step 1.3 — 集成到 DemoPage

**修改** `apps/web/src/features/demo/DemoPage.tsx`：

1. import `inferFailureScenario` 和 `getRecoveryOptions`
2. 在 `BridgeView` 中，当 `asrStatus === "error"` 时，计算 `failureScenario = inferFailureScenario({ asrStatus, agentResult, visibleCaptions, permissionState: audioCaptureState.permissionState })` 和 `recoveryOptions = getRecoveryOptions(failureScenario)`
3. 渲染一个结构化的恢复选项区（替代原 error 状态下的单一 primary 按钮）：
   - 每个 option 是一个按钮，点击触发对应 action
   - "agent-failed" 场景下保留字幕区显示（`captionsDone` 逻辑调整：当 `visibleCaptions.length > 0` 且 `asrStatus === "error"` 时也允许显示字幕）
4. 各 option 的 action 映射：
   - retry-listen → `onUseMicrophone`
   - manual-input → 聚焦 replyDraft 输入框（`onProcessReply` 已有的手动输入路径）
   - demo-captions → `onStartFallbackDemo`
   - retry-agent → 重新调用 `runSessionAgent`（需把 agent 调用抽成可复用函数）
   - view-captions → 保持字幕显示，`asrStatus` 设为 `"done"`（让用户看到字幕并手动整理）

**注意**：retry-agent 需要复用 `handleStopRecording` 中 L1399-1447 的 agent 调用逻辑。为避免重复，抽成 `runAgentForCurrentTranscript(transcript)` 内部函数。

### Step 1.4 — CSS 样式

**修改** `apps/web/src/styles/globals.css`：

新增 `.sb-recovery-options` 恢复选项区样式：
- 卡片容器，圆角，浅色背景
- 每个 option 是横向按钮，左侧 label（粗体），右侧 hint（灰色小字）
- 按钮间距 0.5rem

### Step 1.5 — 验证

1. `pnpm --filter @silentbridge/web exec vitest run failure-recovery` → 全过
2. `pnpm --filter @silentbridge/web test` → 全部 web 测试通过
3. `pnpm --filter @silentbridge/api test` → 全部 api 测试通过
4. `pnpm typecheck` → 通过
5. `pnpm build` → 通过
6. **审核节点**：暂停，等用户确认后再进入 Step 2

---

## Step 2 — 麦克风权限引导（概要，待 Step 1 完成后细化）

**目标**：根据 `AudioCaptureFailureReason` 显示分场景引导卡片，而非一句话提示。

**方向**：
- 新建 `microphone-permission-guide.ts` 纯函数：输入 `AudioCaptureFailureReason`，返回 `{ title, steps: string[], fallbackHint }`
  - permission-denied：说明如何点击地址栏锁图标重新授权
  - no-device：说明需要插入麦克风设备
  - hardware-error：说明麦克风可能被其他程序占用
  - insecure-context：说明需要 HTTPS 或 localhost
  - no-browser-api：说明浏览器不支持，建议换浏览器
- 在 DemoPage 中，当 `failureScenario === "microphone-denied"` 时渲染引导卡片
- TDD：纯函数测试 + 卡片组件测试

---

## Step 3 — 历史记录页优化（概要，待 Step 2 完成后细化）

**目标**：为 RecordsView 增加搜索和筛选功能。

**方向**：
- 新建 `record-filter.ts` 纯函数 `filterRecords(records, query, flowIdFilter)`：
  - query 匹配 title/summary/place/keyPoints（不区分大小写）
  - flowIdFilter 为 "all" 或具体 flowId
- RecordsView list 模式顶部新增搜索框 + 场景筛选 chips
- TDD：纯函数测试覆盖空查询、部分匹配、场景筛选、组合筛选
- CSS：搜索框和 chips 样式

---

## Step 4 — DemoPage 组件拆分（概要，待 Step 3 完成后细化）

**目标**：把 1500+ 行的 DemoPage 拆成更小模块，降低维护成本。

**方向**（按风险从低到高排序，每拆一个跑一次测试）：
1. 先拆无状态展示组件：Mascot / AppTopBar / ProgressDots / DisplayCard / BottomNav → 各自独立 .tsx 文件
2. 再拆有少量 props 的组件：CaptionPanel / AgentInsightCard / PhrasesView
3. 再拆大组件：HomeView / RecordsView / BridgeView
4. 最后考虑抽 `useBridgeSession` 自定义 hook 管理主组件状态
- 每拆一个组件：确保 typecheck + test + build 全过，再做下一个
- 不改变任何功能行为，纯结构重构

**风险缓解**：如果某次拆分后测试失败且难以修复，回退该次拆分，记录原因，下次再处理。

---

## Assumptions & Decisions

1. **分步执行**：每步完成后暂停，等用户审核确认再进入下一步。Step 2-4 的详细计划在前一步完成后补充到本文件。
2. **TDD 优先**：每步先写纯函数测试（红灯），再实现（绿灯），再集成，最后 CSS。
3. **不改变现有状态机**：`asrStatus` 的 7 个值不变，只是在 `error` 状态下提供更丰富的恢复选项。
4. **AI 整理失败保留字幕**：核心改进点——AI 整理失败时字幕已识别，不应丢失。
5. **Step 4 风险最高**：重构放最后，每拆一个组件独立验证，可随时回退。
6. **retry-agent 复用现有逻辑**：不新建 agent 调用路径，抽 `handleStopRecording` 内的 agent 调用为可复用函数。

## Verification Steps（每步通用）

1. 对应纯函数测试全过
2. `pnpm --filter @silentbridge/web test` 全过
3. `pnpm --filter @silentbridge/api test` 全过
4. `pnpm typecheck` 通过
5. `pnpm build` 通过
6. 暂停等用户审核
