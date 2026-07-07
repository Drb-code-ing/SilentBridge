# SilentBridge UX 优化 Phase 2（续）：字幕纠错可视化收尾

## Summary

延续上一轮会话，完成 Phase B 剩余步骤与 Phase C 全量验证，让字幕在被 LLM 纠错后视觉上可感知：徽章标记 + 原文折叠展示，并跑通所有自动化测试、类型检查与构建。

## Current State Analysis

经实际读取确认：

- **Phase A（AI 加载态骨架卡）**：✅ 已完成。`agent-loading-state.ts`、`AgentLoadingCard.tsx` 已创建并集成到 DemoPage；`.sb-agent-card-skeleton` 样式已存在于 globals.css L1505。
- **Phase B.1（红灯）**：✅ 已完成。`caption-correction.test.ts` 共 11 个测试，新增 5 个验证 `corrected` / `originalText` 字段，预期 2 个失败。
- **Phase B.3（类型扩展）**：✅ 已完成。`demo-content.ts` 的 `CaptionLine` 接口已包含 `corrected?: boolean` 与 `originalText?: string`。
- **Phase B.2（绿灯实现）**：⏳ 待完成。`caption-correction.ts` L16 仍是旧代码：`updated[targetIndex] = { ...updated[targetIndex], text: correctedText };`，未设置 `corrected` 和 `originalText`。
- **Phase B.4（徽章 UI）**：⏳ 待完成。`DemoPage.tsx` L198-238 的 `CaptionPanel` 组件未读取 `line.corrected` 字段。
- **Phase B.5（CSS）**：⏳ 待完成。globals.css 中无 `.sb-correction-badge` 或 `.sb-correction-original` 样式。
- **Phase C（全量验证）**：⏳ 待完成。

## Proposed Changes

### Step B.2 — 绿灯实现：caption-correction.ts

**文件**：`apps/web/src/features/demo/caption-correction.ts`

**修改**：将 L16 的赋值改为保留旧文本，并标记 `corrected: true`。

```ts
const oldText = updated[targetIndex].text;
updated[targetIndex] = {
  ...updated[targetIndex],
  text: correctedText,
  corrected: true,
  originalText: oldText
};
```

**为什么**：使 11 个测试全部通过（红灯 → 绿灯），同时为 B.4 提供 `corrected` / `originalText` 字段供 UI 渲染。

**验证**：运行 `pnpm --filter @silentbridge/web test caption-correction`，预期 11 个测试全部通过。

---

### Step B.4 — 纠错徽章 UI：DemoPage.tsx CaptionPanel

**文件**：`apps/web/src/features/demo/DemoPage.tsx`

**修改位置**：L198-238 的 `CaptionPanel` 组件，在 `<article>` 内的 `<p>{line.text}</p>` 之后条件渲染徽章与原文。

**修改内容**：

```tsx
<article
  className={line.important ? "sb-caption-line is-important" : "sb-caption-line"}
  key={line.id}
>
  <div>
    <strong>{line.speaker}</strong>
    <span>{line.time}</span>
  </div>
  <p>{line.text}</p>
  {line.corrected && line.originalText && (
    <div className="sb-correction-original">
      <span className="sb-correction-badge">已纠错</span>
      <small>原识别：{line.originalText}</small>
    </div>
  )}
</article>
```

**为什么**：让用户看到哪条字幕被 AI 纠错过，并可对照原文判断纠错是否正确（透明度 + 信任度）。

**约定**：仅当 `corrected === true` 且 `originalText` 存在时渲染，避免对未纠错字幕造成视觉噪声。

---

### Step B.5 — 徽章 CSS：globals.css

**文件**：`apps/web/src/styles/globals.css`

**修改位置**：在 `.sb-caption-line p { ... }`（约 L1043-1049）之后追加新样式。

**新增样式**：

```css
.sb-correction-original {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
  padding-top: 0.4rem;
  border-top: 1px dashed rgba(40, 48, 68, 0.18);
  margin-top: 0.2rem;
}

.sb-correction-badge {
  display: inline-flex;
  align-items: center;
  border: 1.5px solid #3476a8;
  border-radius: 999px;
  background: rgba(52, 118, 168, 0.12);
  color: #2f6d95;
  padding: 0.12rem 0.5rem;
  font-size: 0.66rem;
  font-weight: 950;
  letter-spacing: 0.02rem;
}

.sb-correction-original small {
  color: #7a8494;
  font-size: 0.74rem;
  font-weight: 750;
  line-height: 1.35;
  font-style: italic;
}
```

**为什么**：徽章用蓝色（与场景标题色一致）+ 圆角胶囊形，原文用灰色斜体小字 + 顶部虚线分隔，形成"主文 → 纠错注释"的视觉层次。

---

### Step C — 全量验证

按以下顺序执行，每步必须通过：

1. **单元测试**：`pnpm --filter @silentbridge/web test`（含 caption-correction、agent-loading-state、AgentLoadingCard 等所有测试文件），预期全部通过。
2. **后端测试**：`pnpm --filter @silentbridge/api test`，预期全部通过。
3. **类型检查**：`pnpm typecheck`，预期无错误。
4. **构建**：`pnpm build`，预期成功。

如任一步骤失败，定位并修复后重跑该步骤及后续步骤。

## Assumptions & Decisions

1. **沿用上一轮已批准的 Phase 2 计划**，仅完成剩余的 B.2/B.4/B.5/C，不新增范围。
2. **徽章文案"已纠错"**：中文短词，符合项目中文 UI 风格，且与"原识别："形成自然的对照关系。
3. **原文默认平铺显示**（非折叠）：听障用户在嘈杂现场需要一眼看到对照，折叠会增加交互成本；保持简单显示。
4. **不修改后端**：B 阶段只动前端；后端 `agent-run.ts` 已在第一轮 Phase 1 返回 `correctedText`，无需再改。
5. **不写新的 E2E 测试文件**：Phase 2 计划中 B 阶段以单元测试（caption-correction.test.ts 已覆盖）+ 视觉验证为主；C 阶段跑现有全套测试即可。
6. **不动其他文件**：DemoPage.tsx 仅改 CaptionPanel；globals.css 仅在指定位置追加样式。

## Verification Steps

1. `pnpm --filter @silentbridge/web test caption-correction` → 11 个测试全过
2. `pnpm --filter @silentbridge/web test` → 全部 web 测试通过
3. `pnpm --filter @silentbridge/api test` → 全部 api 测试通过
4. `pnpm typecheck` → 通过
5. `pnpm build` → 通过
6. （可选，由用户执行）启动 dev server，在 http://localhost:5174/ 触发一次录音 → ASR → LLM 纠错流程，肉眼确认：
   - 字幕区域被纠错的条目下方出现蓝色"已纠错"徽章 + 灰色斜体"原识别：xxx"
   - 未纠错字幕保持原样，无视觉噪声
