import { quickScenarios, type RecordItem, type QuickScenario } from "./demo-content";
import { Mascot } from "./Mascot";

export function HomeView({
  latestRecord,
  messageDraft,
  onMessageDraftChange,
  onStart,
  onPickScenario,
  onOpenRecord,
  onOpenPhrases,
  onStartJudgeDemo
}: {
  latestRecord: RecordItem;
  messageDraft: string;
  onMessageDraftChange: (value: string) => void;
  onStart: () => void;
  onPickScenario: (scenario: QuickScenario) => void;
  onOpenRecord: (id: string) => void;
  onOpenPhrases: () => void;
  onStartJudgeDemo?: () => void;
}) {
  return (
    <div className="sb-view sb-view--home">
      <section className="sb-home-hero">
        <div className="sb-hero-art">
          <Mascot />
          <div className="sb-speech-bubble">我来帮你把话递过去</div>
        </div>
        <div className="sb-hero-copy">
          <p className="sb-kicker">现场沟通，三步完成</p>
          <h1>听不清时，先把手机递过去。</h1>
          <p>先选场景或改开场白，再出示给对方；对方说完后整理重点，最后保存下来。</p>
        </div>
        {onStartJudgeDemo && (
          <button type="button" className="sb-home-judge-button" onClick={onStartJudgeDemo}>
            <span>给评委 / 第一次体验</span>
            <strong>一键演示（无需麦克风）</strong>
            <small>医院问诊：出示 → 字幕 → 风险 → 确认 → 保存</small>
          </button>
        )}
      </section>

      <section className="sb-section">
        <div className="sb-section-title">
          <h2>真实使用：先选场景</h2>
          <button type="button" className="sb-section-tool" onClick={onOpenPhrases}>
            找一句话
          </button>
        </div>
        <p className="sb-section-hint">点场景会带上合适的开场白，直接进入沟通。</p>
        <div className="sb-scenario-row" aria-label="常用场景">
          {quickScenarios.map((scenario) => (
            <button
              type="button"
              className={`sb-scenario-card sb-scenario-card--${scenario.style}`}
              key={scenario.id}
              onClick={() => onPickScenario(scenario)}
            >
              <strong>{scenario.title}</strong>
              <span>{scenario.helper}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="sb-home-draft-card">
        <div className="sb-panel-head">
          <span>或者自己写开场白</span>
          <strong>适合临时沟通，不限定场景。</strong>
        </div>
        <label className="sb-input-card sb-input-card--home">
          <span>我想让对方先看到</span>
          <textarea
            value={messageDraft}
            onChange={(event) => onMessageDraftChange(event.target.value)}
            maxLength={120}
            rows={3}
          />
        </label>
        <button type="button" className="sb-home-start-button" onClick={onStart}>
          <span>开始这次沟通</span>
          <strong>出示开场白并进入收听</strong>
          <small>系统会尽量识别场景，也可稍后手动输入对方的话</small>
        </button>
      </section>

      <button type="button" className="sb-memory-peek" onClick={() => onOpenRecord(latestRecord.id)}>
        <span>上次留下的重点</span>
        <strong>{latestRecord.title}</strong>
        <p>{latestRecord.summary}</p>
      </button>
    </div>
  );
}
