﻿﻿﻿﻿﻿﻿﻿﻿# SilentBridge 无声桥

> AI 听障沟通副驾驶

面向听障、弱听、临时失语及不便开口人群的 AI 沟通辅助工具。

## 初赛 MVP

本项目为 TRAE AI 创造力大赛初赛 Demo，展示 SilentBridge 在医院问诊、求职面试、课堂会议、政务窗口等场景中的核心交互体验。

## 技术栈

- **包管理器**: pnpm
- **Monorepo**: pnpm workspace
- **前端**: Vite + React + TypeScript
- **样式**: Tailwind CSS
- **数据校验**: Zod

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 类型检查
pnpm typecheck
```

## 项目结构

```
silentbridge-demo/
├── apps/
│   └── web/          # 前端应用
├── packages/
│   └── shared/       # 共享类型和 mock 数据
├── docs/
│   ├── evidence/     # 证据链文档
│   └── prompts/      # 提示词存档
└── package.json
```

## 阶段计划

- **Phase 01**: 项目骨架
- **Phase 02**: 开放式沟通任务原型
- **Phase 03**: 摘要生成和完整交互
- **Phase 04**: 视觉和动效
- **Phase 05**: 证据链和导出
- **Phase 06**: 可选 Agent 层

## 合规说明

本项目保留阶段开发记录、Session ID、过程截图和 Git 提交记录。
