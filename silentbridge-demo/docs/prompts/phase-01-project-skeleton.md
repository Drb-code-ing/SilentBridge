# Phase 01 - 项目骨架创建

## 任务提示词摘要

为 TRAE AI 创造力大赛初赛作品 SilentBridge 无声桥创建项目骨架。

### 重要合规要求
1. 本项目最终提交需要证明由 TRAE IDE 创建和修改。
2. 请在执行过程中保留清晰的任务历史。
3. 请不要一次性实现完整 Demo，本阶段只创建项目骨架、基础页面、共享类型和证据链文档。

### 项目名称
silentbridge-demo

### 产品定位
SilentBridge 无声桥是一个面向听障、弱听、临时失语及不便开口人群的 AI 沟通副驾驶。

### 本阶段目标
创建一个可运行的 pnpm monorepo 项目骨架，为后续实现初赛交互 Demo 做准备。

### 技术栈要求
- 包管理器：pnpm
- Monorepo：pnpm workspace
- 前端应用：Vite + React + TypeScript
- 样式：Tailwind CSS
- 共享类型和 mock 数据：packages/shared
- 数据校验：Zod
- 本阶段不要接入真实 LLM
- 本阶段不要接入 LangGraph
- 本阶段不要创建后端服务

### 目录结构要求
```
silentbridge-demo/
  apps/
    web/
      src/
        app/App.tsx
        components/ui/
        features/demo/
        styles/globals.css
        main.tsx
      public/
      index.html
      package.json
      tsconfig.json
      vite.config.ts
      tailwind.config.ts
      postcss.config.js
  packages/
    shared/
      src/
        scenarios/scenario-types.ts
        scenarios/scenario-data.ts
        index.ts
      package.json
      tsconfig.json
  docs/
    evidence/session-log.md
    prompts/phase-01-project-skeleton.md
  package.json
  pnpm-workspace.yaml
  README.md
```

### 包命名
- root package: "silentbridge-demo"
- web package: "@silentbridge/web"
- shared package: "@silentbridge/shared"

### apps/web 初始页面要求
1. 显示标题：SilentBridge 无声桥
2. 显示副标题：AI 听障沟通副驾驶
3. 显示当前阶段：Phase 01 项目骨架已创建
4. 显示四个场景名称，但本阶段不需要实现完整交互
5. 页面视觉方向：浅色背景、黑色大字、薄荷绿和琥珀黄点缀

### 完成后验证命令
1. pnpm install
2. pnpm typecheck
3. pnpm build
