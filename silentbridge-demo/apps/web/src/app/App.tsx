import { scenarios } from "@silentbridge/shared";

function App() {
  const scenarioList = Object.values(scenarios);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-mint-500 flex items-center justify-center">
                <span className="text-white text-xl font-bold">S</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SilentBridge 无声桥</h1>
                <p className="text-sm text-gray-500">AI 听障沟通副驾驶</p>
              </div>
            </div>
            <div className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-sm font-medium">
              Phase 01 项目骨架已创建
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <section className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            让每一句重要的话，都被清楚听见
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            SilentBridge 是一款面向听障、弱听、临时失语及不便开口人群的 AI 沟通副驾驶，
            在医院问诊、求职面试、课堂会议、政务窗口等关键场景中提供实时字幕、重点提炼和回复建议。
          </p>
        </section>

        <section className="mb-16">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-mint-500 rounded"></span>
            四大场景
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {scenarioList.map((scenario) => (
              <div
                key={scenario.id}
                className="bg-white rounded-xl p-6 border border-gray-100 hover:border-mint-200 hover:shadow-lg transition-all duration-300 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-mint-50 flex items-center justify-center mb-4">
                  <span className="text-mint-600 text-xl">
                    {scenario.id === "medical" && "🏥"}
                    {scenario.id === "interview" && "💼"}
                    {scenario.id === "classroom" && "📚"}
                    {scenario.id === "public-service" && "🏛️"}
                  </span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  {scenario.name}
                </h4>
                <p className="text-sm text-gray-500 mb-3">
                  {scenario.description}
                </p>
                <div className="text-xs text-mint-600 font-medium">
                  目标：{scenario.userGoal}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-xl p-8 border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-amber-500 rounded"></span>
            当前阶段功能说明
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-lg bg-gray-50">
              <div className="font-semibold text-gray-900 mb-2">✅ 已完成</div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>- 项目骨架创建</li>
                <li>- 共享类型定义</li>
                <li>- 场景 Mock 数据</li>
                <li>- 基础页面展示</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-amber-50">
              <div className="font-semibold text-amber-800 mb-2">🔄 下一阶段</div>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>- 场景切换交互</li>
                <li>- 字幕流模拟播放</li>
                <li>- AI 重点卡片展示</li>
                <li>- 快捷沟通卡</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-mint-50">
              <div className="font-semibold text-mint-800 mb-2">🎯 最终目标</div>
              <ul className="text-sm text-mint-700 space-y-1">
                <li>- 一键回复建议</li>
                <li>- 会话摘要生成</li>
                <li>- 完整 Demo 体验</li>
                <li>- 桌面/移动端适配</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-gray-400 py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="font-semibold text-white mb-2">
            SilentBridge 无声桥
          </div>
          <p className="text-sm">
            TRAE AI 创造力大赛 · 社会服务赛道 · 社会公益附加赛题
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
