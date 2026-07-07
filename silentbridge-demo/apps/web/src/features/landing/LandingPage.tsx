interface LandingPageProps {
  onEnterDemo: () => void;
}

const TARGET_USERS = [
  {
    icon: "听",
    title: "听障人士日常沟通",
    desc: "在医院、药店、政务窗口等场景中，无法听清对方说话，容易漏掉关键信息。",
    tone: "mint" as const
  },
  {
    icon: "失",
    title: "临时失语患者就医",
    desc: "术后无法发声、咽喉炎发作等情况下，需要与医生、药师准确沟通用药和复诊。",
    tone: "amber" as const
  },
  {
    icon: "静",
    title: "不便开口的政务办理",
    desc: "在嘈杂环境或需要保持安静的场合，通过文字卡片和 AI 整理快速确认信息。",
    tone: "coral" as const
  }
];

const CORE_FEATURES = [
  {
    num: "01",
    title: "实时语音转写",
    desc: "基于浏览器 Web Speech API，对方说的话实时变成文字，无需安装任何插件。",
    points: ["自动识别中文", "逐句显示带时间", "支持手动输入兜底"]
  },
  {
    num: "02",
    title: "AI 重点提炼",
    desc: "智谱 GLM-4-Flash 分析转写内容，按场景提取药名、用量、材料、方向等关键信息。",
    points: ["场景感知抽取", "风险提醒标记", "缺失项一目了然"]
  },
  {
    num: "03",
    title: "一键确认回复",
    desc: "根据缺失信息自动生成确认问题，点击即可展示给对方看，避免遗漏关键细节。",
    points: ["大字卡片展示", "快捷沟通短语", "会话摘要可保存"]
  }
];

const SCENARIOS = ["药店问诊", "政务窗口", "交通问路", "通用沟通"];

function toneClass(tone: "mint" | "amber" | "coral") {
  if (tone === "mint") return "bg-mint-100 text-mint-800 border-mint-300";
  if (tone === "amber") return "bg-amber-100 text-amber-800 border-amber-300";
  return "bg-orange-100 text-orange-800 border-orange-300";
}

export function LandingPage({ onEnterDemo }: LandingPageProps) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-mint-50 to-amber-50 text-[#283044]">
      {/* Hero 区 */}
      <header className="max-w-5xl mx-auto px-6 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-mint-100 border border-mint-300 text-mint-800 text-sm font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-mint-500" />
          TRAE AI 创造力大赛 · 社会服务赛道
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">
          SilentBridge <span className="text-mint-600">无声桥</span>
        </h1>
        <p className="text-xl md:text-2xl text-[#283044]/80 max-w-2xl mx-auto mb-8 leading-relaxed">
          让听障者在每次对话中被看见、被理解。
          <br />
          AI 沟通副驾驶，把声音变成可确认的信息。
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onEnterDemo}
            className="px-8 py-3.5 rounded-xl bg-[#283044] text-white text-base font-semibold shadow-lg shadow-[#283044]/20 hover:bg-[#1a2230] transition-colors active:scale-[0.98]"
          >
            进入演示 →
          </button>
          <a
            href="#features"
            className="px-8 py-3.5 rounded-xl bg-white border border-[#283044]/15 text-[#283044] text-base font-semibold hover:border-[#283044]/30 transition-colors"
          >
            了解更多
          </a>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-sm text-[#283044]/60">
          <span>支持场景：</span>
          {SCENARIOS.map((s) => (
            <span key={s} className="px-2.5 py-1 rounded-md bg-white/70 border border-[#283044]/10">
              {s}
            </span>
          ))}
        </div>
      </header>

      {/* 痛点区 */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">谁需要无声桥</h2>
        <p className="text-center text-[#283044]/60 mb-10">每一次对话，都不该因为听不见而错过关键信息</p>
        <div className="grid gap-5 md:grid-cols-3">
          {TARGET_USERS.map((user) => (
            <div
              key={user.title}
              className="p-6 rounded-2xl bg-white border border-[#283044]/10 shadow-sm hover:shadow-md transition-shadow"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold mb-4 border ${toneClass(user.tone)}`}
              >
                {user.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2">{user.title}</h3>
              <p className="text-sm text-[#283044]/70 leading-relaxed">{user.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 特性区 */}
      <section id="features" className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">三大核心能力</h2>
        <p className="text-center text-[#283044]/60 mb-10">从听到、看懂，到能确认的完整闭环</p>
        <div className="grid gap-5 md:grid-cols-3">
          {CORE_FEATURES.map((feat) => (
            <div
              key={feat.num}
              className="p-6 rounded-2xl bg-white border border-[#283044]/10 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-baseline gap-3 mb-3">
                <span className="text-3xl font-bold text-mint-500">{feat.num}</span>
                <h3 className="text-lg font-semibold">{feat.title}</h3>
              </div>
              <p className="text-sm text-[#283044]/70 leading-relaxed mb-4">{feat.desc}</p>
              <ul className="space-y-1.5">
                {feat.points.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-sm text-[#283044]/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* 技术区 */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="p-8 rounded-2xl bg-[#283044] text-white">
          <h2 className="text-2xl font-bold mb-3">技术架构</h2>
          <p className="text-white/70 mb-6 leading-relaxed">
            前端 React + Vite + Tailwind，后端 Hono + 智谱 GLM-4-Flash（永久免费 LLM），部署于 Vercel。
            浏览器 Web Speech API 实现语音转写，无需安装任何插件。
          </p>
          <div className="grid gap-3 md:grid-cols-2 text-sm">
            <div className="p-4 rounded-lg bg-white/10">
              <div className="text-mint-300 font-semibold mb-1">前端</div>
              <div className="text-white/80">React 18 · TypeScript · Vite · Tailwind CSS · Web Speech API</div>
            </div>
            <div className="p-4 rounded-lg bg-white/10">
              <div className="text-amber-300 font-semibold mb-1">后端</div>
              <div className="text-white/80">Hono · 智谱 GLM-4-Flash · Vercel Serverless</div>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-white/10 text-sm text-white/60">
            本作品由 TRAE IDE 创建和修改，保留开发过程 Session ID 和截图证据。
          </div>
        </div>
      </section>

      {/* 底部 CTA */}
      <footer className="max-w-5xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl font-bold mb-3">准备好体验无声桥了吗</h2>
        <p className="text-[#283044]/60 mb-8">点击下方按钮，立即进入可交互演示</p>
        <button
          type="button"
          onClick={onEnterDemo}
          className="px-10 py-4 rounded-xl bg-mint-500 text-white text-lg font-semibold shadow-lg shadow-mint-500/30 hover:bg-mint-600 transition-colors active:scale-[0.98]"
        >
          进入演示
        </button>
        <div className="mt-10 text-xs text-[#283044]/40">
          SilentBridge 无声桥 · AI 听障沟通副驾驶 · TRAE AI 创造力大赛 2026
        </div>
      </footer>
    </main>
  );
}
