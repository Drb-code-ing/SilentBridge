﻿﻿﻿# SilentBridge 无声桥 - 证据链文档

## 项目名称
SilentBridge 无声桥

## 当前阶段
UX 优化 Phase 3 - 失败恢复 + 权限引导 + 记录页 + 组件拆分（已完成）

## Session ID 管理
所有 Trae session ID 统一维护在 `session-registry.md`。本文件只记录阶段过程、验收和证据截图。

---

## Phase 01 - Project Skeleton

### Session Registry Reference
See `session-registry.md` row: `Phase 01 - Project Skeleton`.

### 创建时间
2026-06-17 19:59:47

### 截图清单
- assets/01-trae-task-plan.png - TRAE SOLO Agent 创建项目骨架任务计划
- assets/02-trae-install-process.png - TRAE 执行 pnpm install 过程截图
- assets/03-trae-file-tree.png - TRAE 生成 silentbridge-demo 文件树截图

### 验收项
- [x] pnpm install 成功
- [x] pnpm typecheck 成功
- [x] pnpm build 成功
- [x] packages/shared 类型定义完整
- [x] 四个场景 mock 数据创建完成

---

## Phase 02 - Open Communication Engine

### Session Registry Reference
See `session-registry.md` row: `Phase 02 - Open Communication Engine`.

### 创建时间
2026-06-17 22:24:13

### 截图清单
- assets/04-trae-phase02-task-execution.png - TRAE 执行 Phase 02 开放式沟通任务引擎开发过程截图
- assets/05-trae-phase02-completion-summary.png - TRAE 完成 Phase 02 任务、文件清单和启动开发服务器截图
- assets/06-trae-phase02-page-refactor.png - TRAE 执行 Phase 02 页面重构和视觉升级过程截图
- 待补充：390px 手机宽度下的沟通任务启动器成果截图
- 待补充：390px 手机宽度下的字幕流模拟中成果截图
- 待补充：390px 手机宽度下的大字展示卡更新后成果截图
- 待补充：1440px 桌面增强布局成果截图

### 页面重构补充记录
- Session Registry Reference：See `session-registry.md` row: `Phase 02 - Page Refactor Supplement`.
- 创建时间：2026-06-17 22:39:42
- 过程截图：assets/06-trae-phase02-page-refactor.png
- 主要内容：重构页面视觉、全局样式、UI 组件和 Feature 组件；截图显示包含 typecheck/build 验证步骤。

### 本阶段验收项
- [x] 页面不再以四个固定 tab 作为唯一入口
- [x] 四个场景作为 preset 仍可点击
- [x] 自定义情境输入可生成沟通任务卡
- [x] 点击"开始模拟"后字幕逐条出现（每800ms）
- [x] 点击快捷沟通卡或回复建议后，大字展示卡更新
- [x] 医院类内容能显示更高风险等级（critical）
- [x] 桌面端布局清晰，无明显重叠
- [x] 390px 手机宽度下完整可用，无横向滚动
- [x] 360px 手机宽度下主要按钮、字幕和大字卡不溢出
- [x] 手机端首屏能看到任务输入或 preset，不被介绍文案占满
- [x] 手机端主要按钮高度不低于 44px
- [x] 大字展示卡适合递给对方阅读
- [x] pnpm typecheck 通过
- [x] pnpm build 通过

### 验收记录
- 2026-06-17：执行 `pnpm typecheck`，packages/shared 与 apps/web 均通过 TypeScript 检查。
- 2026-06-17：执行 `pnpm build`，未通过；Vite/PostCSS 报错：`apps/web/src/styles/globals.css:67:23 Unclosed bracket`。需要修复后重新构建并补充最终成果截图。
- 2026-06-17 22:39：页面重构后复验 `pnpm --filter @silentbridge/web typecheck`，未通过；TypeScript 报错：`src/components/ui/Button.tsx(2,11): error TS1005: '}' expected` 与 `src/features/demo/DemoPage.tsx(1,9): error TS1005: '}' expected`。
- 2026-06-17 22:39：页面重构后复验 `pnpm build`，未通过；构建停在同一组 TypeScript 语法错误，需要修复后重新验收。
- 2026-06-17：完成页面重构验收，执行 `pnpm --filter @silentbridge/web typecheck`，通过。
- 2026-06-17：完成页面重构验收，执行 `pnpm build`，通过，Vite 成功生成 dist 产物。

### Phase 02 新增文件清单

#### apps/web/src/components/ui
- Button.tsx - 通用按钮组件
- Card.tsx - 通用卡片组件
- StatusBadge.tsx - 状态徽章组件
- SegmentedControl.tsx - 分段控制器组件

#### apps/web/src/features/demo
- demo-state.ts - Demo 状态类型定义和初始状态
- DemoPage.tsx - 主 Demo 页面组件
- CommunicationStarter.tsx - 沟通任务启动器组件
- PresetScenarioGrid.tsx - 推荐场景横向滑动网格组件
- ContextCard.tsx - 当前任务卡组件
- TranscriptStream.tsx - 字幕流组件
- InsightPanel.tsx - 重点理解面板组件
- ExpressionPanel.tsx - 表达辅助面板组件
- DisplayCard.tsx - 大字展示卡组件

### Phase 02 修改文件清单

#### packages/shared/src/scenarios/scenario-types.ts
- 新增 CommunicationDomain 类型
- 新增 UserNeed 类型
- 新增 RiskLevel 类型
- 新增 AssistMode 类型
- 新增 CommunicationContext 接口

#### packages/shared/src/scenarios/scenario-data.ts
- 新增 dailyLifeFallbackTranscript - 日常场景备用字幕数据
- 新增 createContextFromScenario 函数
- 新增 createCustomContext 函数

#### packages/shared/src/index.ts
- 导出新增的类型和函数

#### apps/web/src/app/App.tsx
- 改为使用 DemoPage 组件

### 下一阶段计划
Phase 03 - LLM 集成和完整交互功能

---

## Phase 03 - Field Flow Redesign

### Session Registry Reference
See `session-registry.md` row: `Phase 03 - Field Flow Redesign`.

### 创建时间
2026-06-18

### 执行目标
将初赛 demo 从"功能集合页"重构为"评委三秒能上手的移动端现场沟通流程"。

### 核心变更
1. 移动端优先的单任务流程，而非三栏功能台
2. 清晰的 4 步流程：给对方看 → 听见现场 → 抓住重点 → 我来确认
3. 新增快捷入口 chips：药店问药、地铁问路、餐厅沟通、银行办理、房东沟通
4. 新增沟通留存卡片（ConversationSummaryCard）
5. 添加步骤编号和动画效果

### 验收项
- [x] 390px 手机宽度下第一屏不用学习即可操作
- [x] 360px 宽度下无横向滚动
- [x] 展示卡底部和正文均清晰可读
- [x] 评委点击一次推荐场景或输入一句话，就能看到完整沟通流程
- [x] 页面不是普通三栏 dashboard
- [x] `pnpm --filter @silentbridge/web typecheck` 通过
- [x] `pnpm build` 通过

### 验收记录
- 2026-06-18：执行 `pnpm --filter @silentbridge/web typecheck`，通过
- 2026-06-18：执行 `pnpm build`，通过，Vite 成功生成 dist 产物

### Phase 03 修改文件清单

#### apps/web/src/styles/globals.css
- 新增 stepEnter 动画
- 新增 fadeIn 动画
- 新增 slideDown 动画
- 新增 phone-container 响应式容器样式

#### apps/web/src/features/demo/PresetScenarioGrid.tsx
- 新增 quickChips 快捷入口（药店问药、地铁问路等）
- 优化选中状态样式

#### apps/web/src/features/demo/CommunicationStarter.tsx
- 更新标题文案："现在遇到什么沟通困难？"
- 添加 BRIDGE STARTER 标签

#### apps/web/src/features/demo/DisplayCard.tsx
- 新增 step 属性，显示步骤编号
- 优化步骤指示器样式

#### apps/web/src/features/demo/TranscriptStream.tsx
- 新增 step 属性，显示步骤编号
- 优化布局结构

#### apps/web/src/features/demo/InsightPanel.tsx
- 新增 step 属性，显示步骤编号
- 优化卡片样式

#### apps/web/src/features/demo/ExpressionPanel.tsx
- 新增 step 属性，显示步骤编号
- 优化按钮布局

#### apps/web/src/features/demo/DemoPage.tsx
- 重构为移动端优先的单任务流程页面
- 添加 landing 状态和 active task 状态的条件渲染
- 任务生成后自动滚动到流程区
- 模拟完成后显示沟通留存卡片

#### apps/web/src/features/demo/ConversationSummaryCard.tsx (新增)
- 新增沟通留存卡片组件
- 显示场景、关键信息、待确认事项、下一步

### 截图清单
- `docs/evidence/assets/07-trae-phase03-redesign-entry-before-feedback.png` - Phase 03 重构后的移动端入口效果
- `docs/evidence/assets/08-trae-phase03-session-and-dev-server.png` - Trae 执行过程、提示词和本地 dev server 证据
- `docs/evidence/assets/09-trae-phase03-redesign-mobile-preview.png` - Phase 03 重构后的 390px 移动端预览

### 当前复核备注
Phase 03 已完成一轮结构优化和证据归档，但当前视觉记忆点、首屏叙事和低学习成本仍未达到最终参赛版本标准。该版本作为 Trae 重构过程留痕，后续需要继续设计复审和二次打磨。

### 下一阶段计划
Phase 04 - LLM 集成和真实语音识别

---

## Phase 04 - Mobile App Entry Architecture

### 创建时间
2026-06-18

### 执行目标
将初赛 demo 从线性流程页升级为真实移动 App 入口骨架，降低评委上手成本，并展示产品长期使用价值。

### 核心变更
1. 新增底部主导航：`首页 / 开桥 / 记录 / 话术`
2. 首页提供立即开桥、常用场景、最近记录和快速展示卡
3. 开桥页改为现场工作台，支持展示、字幕、确认、留存自由切换
4. 新增沟通记录列表和详情，支持从历史记录继续沟通
5. 新增可扩展话术库，点击话术后直接进入开桥展示
6. 重做移动端样式，固定手机壳高度，内容区内部滚动，底部导航固定在视口底部

### 验收项
- [x] 390px 手机宽度下首页可直接点击“立即开桥”
- [x] 390px 手机宽度下开桥工作台可切换展示、字幕、确认、留存
- [x] 话术库点击话术后可更新大字展示卡并跳转到开桥
- [x] 沟通记录可查看详情并继续沟通
- [x] 360px 和 390px 手机宽度下无横向滚动
- [x] 底部导航保持在手机视口底部
- [x] `pnpm --filter @silentbridge/web typecheck` 通过
- [x] `pnpm build` 通过

### 验收记录
- 2026-06-18：执行 `pnpm --filter @silentbridge/web typecheck`，通过。
- 2026-06-18：执行 `pnpm build`，通过，Vite 成功生成 dist 产物。
- 2026-06-18：390x844 浏览器验收通过，立即开桥、字幕模拟、话术跳转、记录继续沟通均正常。
- 2026-06-18：390x844 浏览器验收 `html/body scrollWidth = 390`，无横向溢出。
- 2026-06-18：360x780 浏览器验收 `html/body scrollWidth = 360`，无横向溢出。

### Phase 04 修改文件清单

#### apps/web/src/features/demo/DemoPage.tsx
- 重构为移动端 App 入口骨架
- 新增首页、开桥、记录、话术四个主入口
- 新增开桥工作台模式切换
- 新增记录继续沟通和话术跳转逻辑

#### apps/web/src/styles/globals.css
- 重做移动端 App shell
- 新增底部导航、工作台、记录、话术库样式
- 固定手机壳高度，内容区内部滚动
- 优化 360px 和 390px 移动端布局

### 截图清单
- `docs/evidence/assets/10-phase04-app-home-390.png` - Phase 04 移动 App 首页骨架

### 下一阶段计划
Phase 05 - 真实语音识别、转写和 AI 摘要链路

---

## Phase 09 - Logic Closure

- Time: 2026-06-18
- Session Registry Reference: See `session-registry.md` row: `Phase 09 - Logic Closure`.
- Goal: Close the mobile demo flow from home to communication, saved record, history review, and continue conversation.
- Changes:
  - Split demo constants and types into demo-content.ts.
  - Removed saved-only intermediate bridge step.
  - Saved conversations now navigate directly to selected record detail.
  - Record continue and phrase selection now return to bridge with clear source labels.
  - Added scenario-specific flow data so pharmacy, service, traffic, and generic phrase paths use matching captions and saved records.
  - Increased mobile bottom spacing around bridge actions.
  - Added Phase 09 screenshots.
  - Archived Phase 09 execution and completion evidence screenshots.
- Verification:
  - Private Phase 09 logic closure regression check: passed
  - pnpm --filter @silentbridge/web typecheck: passed
  - pnpm build: passed
  - 390px and 360px browser checks: passed
  - Service scenario browser check no longer shows pharmacy captions: passed
- Evidence:
  - assets/11-phase09-home-390.png
  - assets/12-phase09-bridge-listen-390.png
  - assets/13-phase09-record-saved-390.png
  - assets/14-phase09-phrase-to-bridge-360.png
  - assets/15-trae-phase09-plan-execution.png
  - assets/16-trae-phase09-completion-summary.png
  - assets/17-phase09-service-flow-390.png

---

## Phase 10 - AI Understanding Loop

- Time: 2026-06-19
- Session Registry Reference: See `session-registry.md` row: `Phase 10 - AI Understanding Loop`.
- Goal: Add frontend-only ASR simulation and Agent understanding loop to show confirmed facts, missing information, risks, and follow-up confirmation.
- Changes:
  - Added LangGraph-style Agent graph config in agent-graph.ts.
  - Added frontend ASR simulator state in asr-simulator.ts.
  - Added AiUnderstanding type to demo-content.ts with confirmed, missing, risks, suggestedQuestion, and plainSummary fields.
  - Extended DemoFlow and RecordItem with aiUnderstanding.
  - Added 小桥理解 card after transcript completion with confirmed/missing/risks/summary.
  - Added one-tap confirmation question loop that returns to bridge with suggestedQuestion.
  - Added AI understanding details to saved records.
  - Added ASR status panel with idle/listening/transcribing/done states.
  - Added Phase 10 CSS styles for ASR panel, agent card, risk list, and record AI block.
  - Reset app content scroll position when switching tabs or bridge steps so saved record details open from the top.
- Verification:
  - pnpm --filter @silentbridge/web typecheck: passed
  - pnpm build: passed
  - 390px browser check: home -> ASR listening -> Agent insight -> confirmation question -> saved record AI detail passed
  - 390px width check: body/html scrollWidth = 390 passed
  - 360px width check: body/html scrollWidth = 360 passed
  - Saved record page opens with title visible after saving from a scrolled bridge page: passed
  - No API key is used in frontend: passed
  - Console warning/error count: 0
- Evidence:
  - assets/18-trae-phase10-plan-execution.png
  - assets/19-trae-phase10-completion-summary.png

---

## Phase 11 - Real Business Loop

- Time: 2026-06-19
- Session Registry Reference: See `session-registry.md` row: `Phase 11 - Real Business Loop`.
- Goal: Replace static placeholder-driven demo logic with a real session-based business flow while retaining local fallback reliability.
- Changes:
  - Added CommunicationSession model with SessionRound and SessionStatus.
  - Added ASR client contract with proxy-first and fallback behavior.
  - Added Agent client contract with proxy-first and fallback behavior.
  - Added localStorage-backed records with load and persist functions.
  - Added API proxy skeleton in apps/api with /api/health, /api/transcribe, /api/agent/run routes.
  - DemoPage now creates sessions on bridge open, appends rounds after ASR+Agent, and persists records to localStorage.
  - Agent insight card displays provider source (proxy or fallback).
  - No API key exposed to frontend.
- Verification:
  - pnpm --filter @silentbridge/web typecheck: passed
  - pnpm build: passed
  - No frontend API key usage: passed
  - Browser flow: create session -> transcribe -> run agent -> confirm -> save -> reload records: passed
- Evidence:
  - assets/20-trae-phase11-plan-execution.png
  - assets/21-trae-phase11-completion-summary.png

---

## Phase 12 - Real Input Pilot

- Time: 2026-06-19
- Session Registry Reference: See `session-registry.md` row: `Phase 12 - Real Input Pilot`.
- Goal: Make the demo respond to real typed communication content instead of only fixed fallback scripts.
- Changes:
  - Added real input engine with text normalization, flow inference, manual transcript builder, and dynamic understanding builder.
  - Added manual transcript path in ASR client.
  - Updated fallback Agent to use real transcript text via createUnderstandingFromTranscript.
  - Updated mobile bridge flow with reply input area and demo reply button.
  - Updated saved records to reflect real session content (title, summary, keyPoints, nextStep).
  - Added home page message draft input.
  - Added mobile-native input CSS styles.
- Verification:
  - pnpm typecheck: passed
  - pnpm build: passed
  - Browser flow: free input -> manual reply -> Agent understanding -> save -> reload record: passed
  - 360px mobile overflow check: passed
  - Console warning/error check: passed
- Evidence:
  - assets/22-trae-phase12-real-input-plan.png
  - assets/23-trae-phase12-completion-summary.png

---

## Phase 13 - Core Function Completion

- Time: 2026-06-19
- Session Registry Reference: See `session-registry.md` row: `Phase 13 - Core Function Completion`.
- Goal: Complete the core mobile product workflow before judge-demo polish.
- Changes:
  - Added microphone entry skeleton with graceful manual fallback.
  - Added retry/cancel/start-new controls for bridge flow recovery.
  - Added contextual follow-up from saved records.
  - Added record delete/reset management.
  - Added runtime status card for ASR/Agent configuration transparency.
- Verification:
  - pnpm typecheck: passed
  - pnpm build: passed
  - Browser flow: manual reply -> agent -> save -> continue follow-up: passed
  - Browser flow: microphone entry -> manual fallback remains available: passed
  - Record delete/reset: passed
  - Refresh restore regression: passed
  - 360px/390px mobile overflow check: passed
  - Console warning/error check: passed
- Evidence:
  - assets/24-trae-phase13-core-function-plan.png
  - assets/25-trae-phase13-completion-review.png

---

## Phase 15 - Browser ASR Pilot

- Time: 2026-06-20
- Session Registry Reference: See `session-registry.md` row: `Phase 15 - Browser ASR Pilot`.
- Goal: Add a browser-side ASR pilot so the listening step attempts real speech recognition first, then falls back safely when recognition is unavailable, silent, or unstable.
- Changes:
  - Added browser Web Speech API adapter with start/result/error/end lifecycle handling.
  - Added ASR states for requesting, fallback, and error feedback.
  - Split browser speech capture from fallback demo caption animation.
  - Added microphone readiness handling for SpeechRecognition-first browsers.
  - Added browser transcript provider and browser speech transcript builder.
  - Preserved manual input, fallback demo captions, Agent understanding, saved record, and continue-follow-up flows.
  - Added silent-listening timeout so a granted microphone does not leave the app stuck in "正在收听".
- Verification:
  - pnpm typecheck: passed
  - pnpm build: passed
  - Browser ASR success path with simulated SpeechRecognition result: passed
  - Granted microphone with no recognized speech falls back to demo captions: passed
  - Manual reply input regression: passed
  - Listening cancel/recovery regression: passed
  - 360px mobile overflow check: passed
  - Console warning/error check: passed
- Evidence:
  - assets/26-trae-phase15-asr-plan-execution.png
  - assets/27-trae-phase15-asr-code-change.png
  - assets/28-trae-phase15-asr-review-summary.png

---

## UX 优化 - ASR 纠错与可视化增强

- Time: 2026-07-07
- Goal: 修复语音识别与 AI 摘要的关键体验问题，增强字幕纠错可视化、录音状态反馈和 TTS 朗读能力。
- Changes:
  - 后端 agent-run 新增 correctedText 字段，GLM-4 基于场景上下文自动纠正百度 ASR 同音字错误（如药店场景「这都要」→「这个药」）。
  - LLM prompt 增加场景示例，要求结构化「标签：内容」格式，禁止原文复制，确保 AI 摘要真正提炼重点。
  - 前端 caption-correction.ts 设置 corrected 和 originalText 字段，字幕区显示原识别文案，AI 摘要显示纠错后文案。
  - CaptionPanel 新增蓝色「已纠错」徽章和灰色斜体「原识别：xxx」原文字段，含顶部虚线分隔。
  - 新增 recording-timer.ts 纯函数格式化录音时长（MM:SS），BridgeView 录音时显示波形动画和计时器。
  - 新增 tts-player.ts 封装 speechSynthesis，AgentInsightCard 增加黄色喇叭按钮支持朗读/停止建议问题。
  - 新增 agent-loading-state.ts 纯函数和 AgentLoadingCard.tsx 骨架卡，ASR 完成但 Agent 未返回时显示加载占位。
  - 修复「停止并识别」按钮在录音中不可点击的问题（disabled 条件调整为 captureMode === 'recording' 时可用）。
- Verification:
  - pnpm typecheck: passed
  - pnpm build: passed
  - Web 测试: 35 passed（含 caption-correction 11、agent-loading-state 6、tts-player 7、recording-timer 6、AgentLoadingCard 4、smoke 1）
  - API 测试: 3 passed
  - E2E: 字幕纠错徽章显示、录音计时器波形、TTS 朗读建议问题均通过
- Evidence:
  - 待补充：字幕纠错徽章截图
  - 待补充：录音波形计时器截图
  - 待补充：TTS 朗读按钮截图

---

## UX 优化 Phase 3 - 失败恢复 + 权限引导 + 记录页 + 组件拆分

- Time: 2026-07-07
- Goal: 补齐失败恢复路径、麦克风权限引导、历史记录页搜索筛选，并拆分 DemoPage 巨型组件以提升可维护性。
- Plan: `.trae/documents/ux-optimization-phase3-plan.md`

### Step 1 - 失败恢复路径
- Changes:
  - 新增 failure-recovery.ts 纯函数：inferFailureScenario 区分 4 种场景（asr-failed/agent-failed/microphone-denied/none），getRecoveryOptions 返回对应恢复选项。
  - DemoPage 集成恢复选项区，handleRecoveryAction 分发 5 种 action（retry-listen/manual-input/demo-captions/retry-agent/view-captions）。
  - 新增 retryAgentForCurrentTranscript 函数：AI 整理失败时字幕已识别不丢失，可重试整理。
  - globals.css 新增 .sb-recovery-options / .sb-recovery-option 样式。
- Tests: failure-recovery.test.ts 10 passed

### Step 2 - 麦克风权限引导
- Changes:
  - 新增 microphone-permission-guide.ts 纯函数：对 7 种 AudioCaptureFailureReason（no-window/no-browser-api/permission-denied/no-device/hardware-error/insecure-context/unknown）返回分场景引导 { title, steps, fallbackHint }。
  - BridgeView 在 microphone-denied 场景渲染权限引导卡片，替代原来的一句话错误提示。
  - globals.css 新增 .sb-permission-guide / .sb-permission-steps / .sb-permission-fallback 样式。
- Tests: microphone-permission-guide.test.ts 8 passed

### Step 3 - 历史记录页优化
- Changes:
  - 新增 record-filter.ts 纯函数 filterRecords：支持 query 模糊匹配（title/summary/place/keyPoints）+ flowIdFilter 场景筛选。
  - RecordsView 集成搜索框 + 场景 chips（全部/药店/政务/交通/通用）+ 空状态提示。
  - globals.css 新增 .sb-record-search / .sb-record-search-input / .sb-record-chips / .sb-record-chip / .sb-record-empty 样式。
- Tests: record-filter.test.ts 12 passed

### Step 4 - DemoPage 组件拆分
- Changes:
  - DemoPage.tsx 从 1748 行 → 906 行（减少 48%），11 个组件拆分为独立文件。
  - Batch A（无状态组件）：Mascot.tsx / AppTopBar.tsx / ProgressDots.tsx / DisplayCard.tsx / BottomNav.tsx
  - Batch B（含逻辑组件）：CaptionPanel.tsx / AgentInsightCard.tsx / PhrasesView.tsx
  - Batch C（大组件）：HomeView.tsx / RecordsView.tsx（导出 RecordsMode）/ BridgeView.tsx（导出 CaptureMode）
  - 共享类型 CaptureMode/RecordsMode 由归属组件 export，DemoPage 反向导入，避免循环依赖。
  - 纯结构重构，未改变任何功能行为，所有 props 传递保持原样。

### Phase 3 全量验证
- pnpm typecheck: passed
- pnpm --filter @silentbridge/web test: 65 passed（含新增 30 个纯函数测试）
- pnpm --filter @silentbridge/api test: 3 passed
- pnpm build: passed（64 modules）

### Phase 3 新增文件清单（17 个）
- failure-recovery.ts / failure-recovery.test.ts
- microphone-permission-guide.ts / microphone-permission-guide.test.ts
- record-filter.ts / record-filter.test.ts
- Mascot.tsx / AppTopBar.tsx / ProgressDots.tsx / DisplayCard.tsx / BottomNav.tsx
- CaptionPanel.tsx / AgentInsightCard.tsx / PhrasesView.tsx
- HomeView.tsx / RecordsView.tsx / BridgeView.tsx

### Phase 3 修改文件清单
- DemoPage.tsx - 移除 11 个组件定义，保留主组件状态编排；清理未使用 import（tabLabels/phrasePacks/createTtsPlayer/formatRecordingDuration/isAgentLoading/AgentLoadingCard/inferFailureScenario/getRecoveryOptions/getPermissionGuide/filterRecords/FlowIdFilter/AudioCaptureFailureReason/AgentRuntimeStatus/quickScenarios 等）
- globals.css - 新增恢复选项、权限引导、记录搜索筛选样式
- agent-system-prompt.ts / agent-run.ts / api-contracts.ts - correctedText 字段（Phase 3 前已完成）

### E2E 回归验证路径
- 失败恢复：ASR 失败显示 3 个恢复选项；AI 整理失败显示 3 个恢复选项且字幕保留；麦克风拒绝显示权限引导步骤
- 权限引导：7 种失败原因各有对应标题+步骤+fallback 提示
- 记录页：搜索框匹配 4 字段；场景 chips 筛选；组合筛选；无匹配空状态
- 组件拆分回归：首页→场景→沟通桥→收听→字幕→AI 整理→保存→记录→继续追问 全链路正常；4 tab 切换正常

- Evidence:
  - 待补充：失败恢复选项截图
  - 待补充：麦克风权限引导卡片截图
  - 待补充：记录页搜索筛选截图
  - 待补充：组件拆分前后代码对比截图
