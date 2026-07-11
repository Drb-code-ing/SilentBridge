interface LandingPageProps {
  onEnterDemo: () => void;
  onEnterJudgeDemo?: () => void;
}

const COMPARE_ROWS = [
  {
    plain: "只看到一串字幕",
    bridge: "自动标出用药、禁忌、复诊"
  },
  {
    plain: "说完就散，容易忘",
    bridge: "生成可保存、可追问的重点卡"
  },
  {
    plain: "不敢打断对方",
    bridge: "一键出示确认问题，对方也能看懂"
  }
];

const SCENES = [
  { title: "医院问诊", desc: "诊断、用药、复诊、急诊红线", tone: "coral" as const },
  { title: "药店问药", desc: "药名、用量、禁忌、不适处理", tone: "mint" as const },
  { title: "政务窗口", desc: "材料、窗口号、截止时间", tone: "amber" as const },
  { title: "交通问路", desc: "方向、换乘、站台、出口", tone: "sky" as const }
];

function toneClass(tone: "mint" | "amber" | "sky" | "coral") {
  if (tone === "coral") return "bg-[#ffc7b8] border-[#283044]";
  if (tone === "mint") return "bg-[#b9f3d3] border-[#283044]";
  if (tone === "amber") return "bg-[#ffd96f] border-[#283044]";
  return "bg-[#aee7ff] border-[#283044]";
}

export function LandingPage({ onEnterDemo, onEnterJudgeDemo }: LandingPageProps) {
  return (
    <main className="min-h-screen bg-[#fff8df] text-[#283044]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-[#b9f3d3]/40 blur-3xl" />
        <div className="absolute -right-16 top-40 h-72 w-72 rounded-full bg-[#aee7ff]/45 blur-3xl" />
        <div className="absolute bottom-10 left-1/3 h-56 w-56 rounded-full bg-[#ff8b72]/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-8 md:px-8 md:pt-12">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl border-2 border-[#283044] bg-[#ffd96f] text-lg font-black shadow-[0_3px_0_#283044]">
              桥
            </span>
            <div>
              <div className="text-base font-black leading-none">SilentBridge 无声桥</div>
              <div className="mt-1 text-xs font-bold text-[#6f7787]">听障现场沟通副驾驶</div>
            </div>
          </div>
          <div className="rounded-full border-2 border-[#283044]/15 bg-white px-3 py-1.5 text-xs font-bold text-[#2f6d95]">
            TRAE · 社会服务 / 社会公益
          </div>
        </header>

        <section className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#283044]/12 bg-white/80 px-3 py-1 text-xs font-black text-[#3476a8]">
              <span className="h-2 w-2 rounded-full bg-[#ff8b72]" />
              关键对话里，别再只靠“听清”
            </p>
            <h1 className="max-w-xl text-4xl font-black leading-[1.05] tracking-tight md:text-5xl lg:text-[3.4rem]">
              听不清时，
              <br />
              先把关键的话
              <span className="text-[#c45a3a]">留下来</span>。
            </h1>
            <p className="mt-5 max-w-xl text-base font-semibold leading-relaxed text-[#526070] md:text-lg">
              SilentBridge 不是普通字幕工具。它把对方的话变成字幕、重点、风险提醒和可出示的确认问题，
              让听障、弱听、临时失语的人在医院、药店、窗口、问路时也能从容沟通。
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onEnterJudgeDemo ?? onEnterDemo}
                className="min-h-[3.25rem] rounded-2xl border-2 border-[#283044] bg-[#283044] px-6 text-base font-black text-white shadow-[0_4px_0_#111827] transition active:translate-y-[2px] active:shadow-[0_1px_0_#111827]"
              >
                60 秒一键演示（无需麦克风）
              </button>
              <button
                type="button"
                onClick={onEnterDemo}
                className="min-h-[3.25rem] rounded-2xl border-2 border-[#283044] bg-white px-6 text-base font-black text-[#283044] shadow-[0_3px_0_#283044] transition active:translate-y-[2px] active:shadow-[0_1px_0_#283044]"
              >
                自己体验完整流程
              </button>
            </div>

            <p className="mt-4 text-sm font-bold text-[#6f7787]">
              建议评委路径：一键演示 → 看风险高亮 → 保存重点卡
            </p>
          </div>

          <div className="relative">
            <div className="rounded-[28px] border-2 border-[#283044] bg-white p-5 shadow-[0_8px_0_#283044]">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="rounded-full bg-[#b9f3d3] px-3 py-1 text-xs font-black">现场 00:42</span>
                <span className="text-xs font-bold text-[#c45a3a]">高风险已标记</span>
              </div>
              <div className="space-y-3">
                <div className="rounded-2xl border-2 border-[#283044] bg-[#fff3b8] p-3">
                  <div className="text-[11px] font-black text-[#3476a8]">店员 · 重点</div>
                  <p className="mt-1 text-sm font-black leading-snug">饭后吃，一天两次。不要和酒一起服用。</p>
                </div>
                <div className="rounded-2xl border-2 border-[#c45a3a] bg-[#fff0e8] p-3">
                  <div className="text-[11px] font-black text-[#c45a3a]">风险提醒</div>
                  <p className="mt-1 text-sm font-bold leading-snug">药物与酒同服可能带来风险，需明确提醒。</p>
                </div>
                <div className="rounded-2xl border-2 border-[#283044] bg-[#283044] p-4 text-white">
                  <div className="text-[11px] font-black text-[#ffd96f]">给对方看的确认问题</div>
                  <p className="mt-2 text-lg font-black leading-tight">
                    请把药名、用量和不能一起吃的东西写下来，我要保存。
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-3 rounded-2xl border-2 border-[#283044] bg-[#ffd96f] px-3 py-2 text-xs font-black shadow-[0_3px_0_#283044]">
              理解 · 确认 · 留下
            </div>
          </div>
        </section>

        <section className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SCENES.map((scene) => (
            <div
              key={scene.title}
              className={`rounded-2xl border-2 p-5 shadow-[0_4px_0_#283044] ${toneClass(scene.tone)}`}
            >
              <h2 className="text-lg font-black">{scene.title}</h2>
              <p className="mt-2 text-sm font-bold text-[#526070]">{scene.desc}</p>
            </div>
          ))}
        </section>

        <section className="mt-12 overflow-hidden rounded-[28px] border-2 border-[#283044] bg-white shadow-[0_6px_0_#283044]">
          <div className="border-b-2 border-[#283044]/10 px-6 py-5">
            <h2 className="text-2xl font-black">为什么不是“普通字幕”？</h2>
            <p className="mt-2 text-sm font-bold text-[#6f7787]">
              字幕解决听见文字；无声桥解决理解、确认、行动。
            </p>
          </div>
          <div className="grid md:grid-cols-2">
            <div className="border-b-2 border-[#283044]/10 p-6 md:border-b-0 md:border-r-2">
              <div className="mb-4 text-xs font-black uppercase tracking-wide text-[#9aa3b1]">只有字幕时</div>
              <ul className="space-y-3">
                {COMPARE_ROWS.map((row) => (
                  <li key={row.plain} className="rounded-xl bg-[#f4f6f8] px-4 py-3 text-sm font-bold text-[#6f7787]">
                    {row.plain}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-[#f3fff8] p-6">
              <div className="mb-4 text-xs font-black uppercase tracking-wide text-[#2f6d95]">有 SilentBridge 时</div>
              <ul className="space-y-3">
                {COMPARE_ROWS.map((row) => (
                  <li
                    key={row.bridge}
                    className="rounded-xl border-2 border-[#283044] bg-white px-4 py-3 text-sm font-black shadow-[0_2px_0_#283044]"
                  >
                    {row.bridge}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-4 rounded-[28px] border-2 border-[#283044] bg-[#283044] p-6 text-white md:grid-cols-[1.2fr_0.8fr] md:p-8">
          <div>
            <h2 className="text-2xl font-black md:text-3xl">核心理念</h2>
            <p className="mt-3 max-w-xl text-base font-semibold leading-relaxed text-white/80">
              不是让听障者适应嘈杂世界，而是让世界把重要的话说清楚。
              医院交代病情、窗口解释材料、路人指路——这些关键几分钟，值得被留下。
            </p>
          </div>
          <div className="flex flex-col justify-center gap-3">
            <button
              type="button"
              onClick={onEnterJudgeDemo ?? onEnterDemo}
              className="min-h-[3.1rem] rounded-2xl border-2 border-[#ffd96f] bg-[#ffd96f] px-5 text-base font-black text-[#283044] transition active:scale-[0.98]"
            >
              立即看 60 秒演示
            </button>
            <button
              type="button"
              onClick={onEnterDemo}
              className="min-h-[3.1rem] rounded-2xl border-2 border-white/30 bg-transparent px-5 text-base font-black text-white transition hover:bg-white/10"
            >
              进入产品体验
            </button>
          </div>
        </section>

        <footer className="mt-10 text-center text-xs font-bold text-[#9aa3b1]">
          SilentBridge 无声桥 · TRAE AI 创造力大赛 2026 · 社会服务赛道 / 社会公益附加
        </footer>
      </div>
    </main>
  );
}
