# SilentBridge 无声桥

> AI 听障沟通副驾驶 — 让听障者在每次对话中被看见、被理解

面向听障、弱听、临时失语及不便开口人群的 AI 沟通辅助工具。
实时转写对方语音，AI 提炼关键信息，一键生成确认问题，让沟通不再有遗漏。

**TRAE AI 创造力大赛 · 社会服务赛道 · 初赛作品**

## 在线体验

> 在线体验：`https://silent-bridge-sigma.vercel.app`  
> 健康检查：`https://silent-bridge-sigma.vercel.app/api/health`  
> 部署步骤见 [DEPLOY.md](./DEPLOY.md)

本地开发：

```bash
pnpm install
pnpm dev        # 前端 http://localhost:5173
pnpm dev:api    # 后端 http://localhost:8787（可选）
pnpm dev:all    # 前后端同时
```


### 4 个真实场景

| 场景 | 说明 |
|---|---|
| 药店问诊 | 药名、用量、禁忌、复诊时间提取 |
| 政务窗口 | 材料、窗口号、办理步骤、截止时间 |
| 交通问路 | 方向、线路、站点、换乘、出口 |
| 通用沟通 | 时间、地点、关键信息、下一步动作 |

### 5 大核心能力

1. **实时语音转写** — 浏览器 Web Speech API，对方说话实时变文字
2. **AI 重点提炼** — 智谱 GLM-4-Flash 分析内容，按场景提取关键信息
3. **风险提醒** — 用药禁忌、材料遗漏、方向错误等风险标记
4. **一键确认回复** — 根据缺失项自动生成确认问题，大字卡片展示
5. **会话摘要保存** — 结构化摘要可保存到本地记录，支持后续继续沟通

### 双引擎保障

- **LLM 优先**：默认走后端智谱 GLM-4-Flash 代理，生成高质量差异化理解
- **规则兜底**：后端不可用时自动降级到前端场景化规则引擎，演示永不白屏

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 · TypeScript · Vite · Tailwind CSS · Web Speech API |
| 后端 | Hono · @hono/node-server · 智谱 GLM-4-Flash（永久免费 LLM） |
| 部署 | Vercel Serverless（前端静态 + 后端 API） |
| 工程 | pnpm workspace monorepo |

## 快速开始

### 前置条件

- Node.js ≥ 18
- pnpm ≥ 8

### 安装

```bash
cd silentbridge-demo
pnpm install
```

### 配置 LLM（可选，不配则走规则引擎兜底）

```bash
cp apps/api/.env.example apps/api/.env.local
# 编辑 apps/api/.env.local，填入 ZHIPU_API_KEY
# 智谱 GLM-4-Flash 永久免费，注册地址 https://bigmodel.cn
```

### 启动开发

```bash
# 仅前端（规则引擎兜底，无需后端）
pnpm dev

# 仅后端 API
pnpm dev:api

# 前后端同时启动（LLM 优先模式）
pnpm dev:all
```

前端运行在 `http://localhost:5173`，后端在 `http://localhost:8787`。

### 构建验证

```bash
pnpm typecheck   # 类型检查
pnpm build       # 生产构建
```

## 项目结构

```
silentbridge-demo/
├── apps/
│   ├── web/                      # 前端应用
│   │   └── src/
│   │       ├── app/App.tsx       # 入口（Landing ↔ Demo 视图切换）
│   │       ├── features/
│   │       │   ├── landing/      # 产品介绍首页
│   │       │   └── demo/         # 演示核心
│   │       │       ├── DemoPage.tsx
│   │       │       ├── agent-client.ts      # LLM 代理 + 降级
│   │       │       ├── agent-graph.ts       # 规则引擎图
│   │       │       ├── real-input-engine.ts # 场景化抽取器
│   │       │       ├── browser-speech-client.ts
│   │       │       └── ...
│   │       └── components/
│   │           ├── ui/           # 基础组件
│   │           └── ErrorBoundary.tsx
│   └── api/                      # 后端 API
│       └── src/
│           ├── server.ts         # Hono 入口（Vercel 兼容）
│           ├── routes/
│           │   ├── agent-run.ts  # LLM 调用 + 降级
│           │   └── transcribe.ts # ASR 占位
│           ├── services/
│           │   └── zhipu-client.ts   # 智谱 GLM-4-Flash 客户端
│           └── prompts/
│               └── agent-system-prompt.ts # 场景感知提示词
├── packages/
│   └── shared/                   # 共享类型和场景数据
├── docs/
│   └── evidence/                 # 证据链（Session ID + 截图）
└── package.json
```

## 部署

### Vercel 部署

1. Fork 本仓库到 GitHub
2. 在 Vercel 导入仓库
3. 配置环境变量：`ZHIPU_API_KEY`（在 Vercel Dashboard → Settings → Environment Variables）
4. 部署

前端静态资源输出到 `apps/web/dist`，API 路由通过 `vercel.json` rewrite 规则转发到 `apps/api/src/server.ts`。

### 本地导出 HTML Zip（备用）

```bash
pnpm build
# 将 apps/web/dist 目录打包为 zip
```

注意：HTML Zip 版本无后端，LLM 功能不可用，会自动降级到规则引擎。

## 合规说明

- 本作品由 **TRAE IDE** 创建和修改
- 保留开发过程 Session ID（共 10+ 个，见 `docs/evidence/session-registry.md`）
- 保留开发过程截图（见 `docs/evidence/assets/`）
- 保留 Git 提交记录
- LLM 使用智谱 GLM-4-Flash（永久免费模型），无付费 API

## 浏览器兼容性

- Chrome / Edge ≥ 90（Web Speech API 完整支持）
- Safari ≥ 14（Web Speech API 部分支持）
- 不支持 IE
- 移动端：iOS Safari 14+ / Android Chrome 90+
