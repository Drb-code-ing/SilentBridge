import { quickScenarios, type RecordItem, type QuickScenario } from "./demo-content";

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
      <section className="sb-page-title">
        <p className="sb-kicker">无声桥</p>
        <h1>开始一次沟通</h1>
        <p className="sb-section-hint">选场景或写开场白，出示给对方，再收听整理重点。</p>
      </section>

      <section className="sb-section">
        <div className="sb-section-title">
          <h2>常用场景</h2>
          <button type="button" className="sb-section-tool" onClick={onOpenPhrases}>
            话术
          </button>
        </div>
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
          <span>开场白</span>
          <strong>对方会先看到这句话</strong>
        </div>
        <label className="sb-input-card sb-input-card--home">
          <span>编辑文字</span>
          <textarea
            value={messageDraft}
            onChange={(event) => onMessageDraftChange(event.target.value)}
            maxLength={120}
            rows={3}
          />
        </label>
        <button type="button" className="sb-primary-button sb-home-cta" onClick={onStart}>
          出示并开始
        </button>
      </section>

      <button type="button" className="sb-memory-peek" onClick={() => onOpenRecord(latestRecord.id)}>
        <span>最近记录</span>
        <strong>{latestRecord.title}</strong>
        <p>{latestRecord.summary}</p>
      </button>

      {onStartJudgeDemo && (
        <button type="button" className="sb-quiet-link" onClick={onStartJudgeDemo}>
          跑一遍示例流程（无需麦克风）
        </button>
      )}
    </div>
  );
}
