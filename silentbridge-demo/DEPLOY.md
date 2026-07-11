# SilentBridge Vercel 部署指引（初赛）

## 前置条件

1. 代码已推送到 GitHub：`https://github.com/Drb-code-ing/SilentBridge`
2. Vercel 账号（可用 GitHub 登录）：https://vercel.com/signup
3. （可选）智谱 Key：https://bigmodel.cn  
   （可选）百度语音 Key：https://console.bce.baidu.com/ai/#/ai/speech/overview/index  
   **没有 Key 也能部署**：前端会走本地规则引擎 / 演示字幕，Demo 仍可完整体验。

---

## 推荐：网页导入（最稳）

### 1. 导入仓库

1. 打开 https://vercel.com/new  
2. 选择仓库 **`Drb-code-ing/SilentBridge`**  
3. 配置：

| 配置项 | 值 |
|---|---|
| **Root Directory** | `silentbridge-demo`（点 Edit 选中该目录） |
| Framework Preset | Other |
| Build Command | 可留空（用 vercel.json）或 `pnpm --filter @silentbridge/web build` |
| Output Directory | `apps/web/dist` |
| Install Command | 可留空或 `pnpm install --no-frozen-lockfile` |

> **关键：Root Directory 必须是 `silentbridge-demo`**，不要用仓库根目录。  
> 仓库根目录没有 `package.json`，Root 设错会在 Clone 后立刻失败。

### 2. 环境变量（可选但推荐）

Project → Settings → Environment Variables，对 Production / Preview 都勾选：

| Name | 说明 |
|---|---|
| `ZHIPU_API_KEY` | 智谱 GLM-4-Flash，AI 实时整理 |
| `BAIDU_API_KEY` | 百度语音（可选） |
| `BAIDU_SECRET_KEY` | 百度语音（可选） |

本地 `.env.local` **不要提交**；只在 Vercel 后台填。

### 3. Deploy

点 **Deploy**，等 1–3 分钟。

成功后会得到类似：

`https://silentbridge-demo-xxxx.vercel.app`

---

## 部署后 5 分钟验收

把域名记为 `YOUR_URL`：

1. 打开 `YOUR_URL`  
   - 应直接进入产品（首页：开始一次沟通 / 常用场景）
2. 点 **医院问诊** → 出示 → 演示字幕或手动输入 → 有重点/风险  
3. 点底部 **沟通**（冷启动）→ 应是 **通用沟通**，不是医院  
4. 保存摘要 → 刷新 → 记录仍在  
5. 打开 `YOUR_URL/api/health`  
   - 应返回 JSON：`{"ok":true,...}`  
   - 配了智谱则 `hasZhipuKey: true`

---

## 部署后要改的文档

1. `报名材料/初赛Demo作品帖_可直接发布.md`  
   - 把体验地址占位换成 `YOUR_URL`
2. `silentbridge-demo/README.md`  
   - 「在线体验」一栏填链接
3. 社区 Demo 帖正文贴上链接 + 截图

---

## 常见问题

### API 404

- 确认 Root Directory = `silentbridge-demo`
- 确认 `vercel.json` 的 rewrite 指向 `apps/api/src/server.ts`
- 重新 Deploy

### 构建失败 pnpm not found

- Install Command 设为 `pnpm install --no-frozen-lockfile`
- 仓库已写 `packageManager: pnpm@9.15.9`

### 只有前端、AI 一直「本地规则」

- 正常：未配 `ZHIPU_API_KEY` 时会降级  
- 配上 Key 后 Redeploy

### 麦克风在 HTTPS 才稳定

- Vercel 默认 HTTPS，比本地 localhost 更接近真实评审环境

---

## CLI 部署（可选）

若已登录 Vercel CLI：

```bash
cd silentbridge-demo
npx vercel login
npx vercel --yes
# 生产环境
npx vercel --prod --yes
```

首次会引导关联项目；同样建议在 Dashboard 把 Root Directory 设为 `silentbridge-demo`。

---

## 初赛提交最小闭环

- [ ] Vercel 部署成功  
- [ ] 公网链接可打开  
- [ ] `/api/health` 正常  
- [ ] 医院场景 + 通用冷启动都测过  
- [ ] 链接写入 Demo 帖  
- [ ] 录 20–40 秒操作路径  
