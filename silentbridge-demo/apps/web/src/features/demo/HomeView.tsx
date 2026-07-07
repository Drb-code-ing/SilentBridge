import { quickScenarios, type RecordItem, type QuickScenario } from "./demo-content";
import { Mascot } from "./Mascot";

export function HomeView({
  latestRecord,
  messageDraft,
  onMessageDraftChange,
  onStart,
  onPickScenario,
  onOpenRecord,
  onOpenPhrases
}: {
  latestRecord: RecordItem;
  messageDraft: string;
  onMessageDraftChange: (value: string) => void;
  onStart: () => void;
  onPickScenario: (scenario: QuickScenario) => void;
  onOpenRecord: (id: string) => void;
  onOpenPhrases: () => void;
}) {
  return (
    <div className="sb-view sb-view--home">
      <section className="sb-home-hero">
        <div className="sb-hero-art">
          <Mascot />
          <div className="sb-speech-bubble">我来帮你把话递过去</div>
        </div>
        <div className="sb-hero-copy">
          <p className="sb-kicker">给评委看的第一步</p>
          <h1>听不清时，先把手机递过去。</h1>
          <p>无声桥会先展示一句开场白，再接住对方说的话，最后留下重点。</p>
        </div>
        <button type="button" className="sb-home-start-button" onClick={onStart}>
          <span>现在开始</span>
          <strong>把手机递给对方</strong>
          <small>展示开场白 &gt; 收听转文字 &gt; 保存重点</small>
        </button>
      </section>

      <section className="sb-home-draft-card">
        <div className="sb-panel-head">
          <span>给对方看的第一句话</span>
          <strong>可以直接用，也可以临时改。</strong>
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
      </section>

      <section className="sb-section">
        <div className="sb-section-title">
          <h2>现在可能遇到</h2>
          <button type="button" className="sb-section-tool" onClick={onOpenPhrases}>找一句话</button>
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

      <button
        type="button"
        className="sb-memory-peek"
        onClick={() => onOpenRecord(latestRecord.id)}
      >
        <span>上次留下的重点</span>
        <strong>{latestRecord.title}</strong>
        <p>{latestRecord.summary}</p>
      </button>
    </div>
  );
}
