# SilentBridge Vercel 部署指引

## 前置条件

1. GitHub 账号 + 本项目已推送到 GitHub 仓库
2. Vercel 账号（https://vercel.com，可用 GitHub 登录）
3. 智谱 API Key（https://bigmodel.cn 注册，GLM-4-Flash 永久免费）

## 部署步骤

### 1. 推送代码到 GitHub

```bash
cd e:\SilentBridge_无声桥
git add -A
git commit -m "feat: real LLM integration + landing page + error boundary"
git push origin main
```

### 2. 在 Vercel 导入项目

1. 登录 https://vercel.com/dashboard
2. 点击 "Add New..." → "Project"
3. 选择 GitHub 仓库 "SilentBridge_无声桥"
4. 配置项目：
   - **Root Directory**: `silentbridge-demo`
   - **Framework Preset**: Vite（或 Other）
   - **Build Command**: `pnpm install --no-frozen-lockfile && pnpm build`（应自动读取 vercel.json）
   - **Output Directory**: `apps/web/dist`（应自动读取 vercel.json）
   - **Install Command**: `pnpm install`

### 3. 配置环境变量

在 Vercel 项目的 "Settings" → "Environment Variables" 中添加：

| Name | Value | Environments |
|---|---|---|
| `ZHIPU_API_KEY` | 你的智谱 API Key | Production, Preview, Development |

获取 API Key：
1. 访问 https://bigmodel.cn 注册
2. 进入控制台 → API Keys → 创建新 Key
3. 复制 Key 填入 Vercel

### 4. 部署

点击 "Deploy" 按钮，等待构建完成（约 1-2 分钟）。

### 5. 验证

部署成功后，访问 Vercel 分配的域名（如 `https://silentbridge.vercel.app`）：

1. **首页验证**：应显示 Landing Page（产品介绍）
2. **演示验证**：点击"进入演示" → 选择场景 → 收听 → 查看 AI 重点提炼
3. **API 健康检查**：访问 `https://<your-domain>/api/health`
   - 应返回 `{"ok": true, "hasZhipuKey": true, ...}`
4. **LLM 验证**：在演示中输入语音或文字，AI 模式指示器应显示"GLM-4 实时整理"
5. **降级验证**：临时删除环境变量重新部署，应显示"本地规则整理"

## 常见问题

### Q: 部署后 API 返回 404

A: 检查 `vercel.json` 的 rewrites 配置是否正确指向 `apps/api/src/server.ts`。Vercel 可能需要在 Root Directory 设置为 `silentbridge-demo`。

### Q: LLM 调用超时

A: GLM-4-Flash 首次调用可能有冷启动延迟。代码中已设置 12s 超时，超时会自动降级到规则引擎。

### Q: 构建失败 "pnpm not found"

A: 在 Vercel 项目设置中确保 Install Command 为 `pnpm install`，Vercel 会自动检测 pnpm。

### Q: 前端能访问但 API 不可用

A: 检查环境变量 `ZHIPU_API_KEY` 是否已配置。未配置时后端返回 fallback，前端会降级到规则引擎（演示仍可用，但 LLM 功能不生效）。

## 部署后清单

- [ ] 在线链接可访问
- [ ] Landing Page 正常显示
- [ ] 进入演示后场景切换正常
- [ ] 语音转写或手动输入可用
- [ ] AI 重点提炼显示"GLM-4 实时整理"
- [ ] /api/health 返回 hasZhipuKey: true
- [ ] 移动端 390px 无溢出
- [ ] 将在线链接填入 README.md 和证据链记录表
