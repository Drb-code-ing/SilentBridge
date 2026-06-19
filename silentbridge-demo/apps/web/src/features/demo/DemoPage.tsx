import { useEffect, useMemo, useRef, useState } from "react";
import {
  defaultFlowId,
  defaultMessage,
  demoFlows,
  initialRecords,
  phrasePacks,
  quickScenarios,
  tabLabels,
  type AppTab,
  type BridgeStep,
  type CaptionLine,
  type DemoFlowId,
  type Phrase,
  type QuickScenario,
  type RecordItem
} from "./demo-content";
import { asrStateLabels, type AsrStatus } from "./asr-simulator";
import { runDemoAgent, type AgentRunResult } from "./agent-graph";

function Mascot() {
  return (
    <div className="sb-mascot" aria-hidden="true">
      <div className="sb-mascot__antenna" />
      <div className="sb-mascot__face">
        <span className="sb-mascot__eye sb-mascot__eye--left" />
        <span className="sb-mascot__eye sb-mascot__eye--right" />
        <span className="sb-mascot__smile" />
      </div>
      <div className="sb-mascot__shadow" />
    </div>
  );
}

function AppTopBar({ activeTab, onGoHome }: { activeTab: AppTab; onGoHome: () => void }) {
  return (
    <header className="sb-topbar">
      <button type="button" className="sb-brand" onClick={onGoHome} aria-label="回到首页">
        <span className="sb-brand-mark">桥</span>
        <span>
          <strong>无声桥</strong>
          <small>听障现场沟通助手</small>
        </span>
      </button>
      <div className="sb-status-pill">{tabLabels[activeTab].label}</div>
    </header>
  );
}

function HomeView({
  latestRecord,
  onStart,
  onPickScenario,
  onOpenRecord,
  onOpenPhrases
}: {
  latestRecord: RecordItem;
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
        <button type="button" className="sb-primary-button" onClick={onStart}>
          开始现场沟通
        </button>
      </section>

      <section className="sb-section">
        <div className="sb-section-title">
          <h2>现在可能遇到</h2>
          <button type="button" onClick={onOpenPhrases}>找一句话</button>
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

function ProgressDots({ step }: { step: BridgeStep }) {
  const steps: Array<{ id: BridgeStep; label: string }> = [
    { id: "show", label: "给对方看" },
    { id: "listen", label: "听对方说" }
  ];
  const activeIndex = steps.findIndex((item) => item.id === step);

  return (
    <div className="sb-progress sb-progress--two" aria-label="沟通步骤">
      {steps.map((item, index) => (
        <div
          className={index <= activeIndex ? "sb-progress__item is-active" : "sb-progress__item"}
          key={item.id}
        >
          <span>{index + 1}</span>
          <strong>{item.label}</strong>
        </div>
      ))}
    </div>
  );
}

function DisplayCard({ message }: { message: string }) {
  return (
    <section className="sb-display-card">
      <div className="sb-display-card__label">把这句话给对方看</div>
      <p>{message}</p>
    </section>
  );
}

function AsrStatusPanel({ status }: { status: AsrStatus }) {
  const label = asrStateLabels[status];

  return (
    <section className="sb-asr-panel">
      <span className={`sb-asr-dot sb-asr-dot--${status}`} />
      <div>
        <strong>{label.title}</strong>
        <p>{label.helper}</p>
      </div>
    </section>
  );
}

function CaptionPanel({
  visibleCaptions,
  isCapturing
}: {
  visibleCaptions: CaptionLine[];
  isCapturing: boolean;
}) {
  return (
    <section className="sb-caption-panel" aria-live="polite">
      <div className="sb-panel-head">
        <span>{isCapturing ? "正在听" : "已抓到重点"}</span>
        <strong>对方的话会变成文字</strong>
      </div>
      <div className="sb-caption-list">
        {visibleCaptions.length === 0 ? (
          <div className="sb-listening-empty">
            <span />
            <p>请让对方开始说，文字会一条一条出现。</p>
          </div>
        ) : (
          visibleCaptions.map((line) => (
            <article
              className={line.important ? "sb-caption-line is-important" : "sb-caption-line"}
              key={line.id}
            >
              <div>
                <strong>{line.speaker}</strong>
                <span>{line.time}</span>
              </div>
              <p>{line.text}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function AgentInsightCard({
  result,
  onConfirmQuestion
}: {
  result?: AgentRunResult;
  onConfirmQuestion: () => void;
}) {
  if (!result) {
    return null;
  }

  const { understanding } = result;

  return (
    <section className="sb-agent-card">
      <div className="sb-panel-head">
        <span>小桥理解</span>
        <strong>Agent: {result.graphName}</strong>
      </div>

      <div className="sb-agent-grid">
        <div className="sb-agent-block">
          <span>已确认</span>
          <ul>
            {understanding.confirmed.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="sb-agent-block">
          <span>还没确认</span>
          <ul>
            {understanding.missing.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      {understanding.risks.length > 0 && (
        <div className="sb-risk-list">
          <span>风险提醒</span>
          <ul>
            {understanding.risks.map((risk) => (
              <li key={risk.text} className={`sb-risk-item sb-risk-item--${risk.level}`}>
                {risk.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="sb-agent-summary">{understanding.plainSummary}</p>

      <button type="button" className="sb-secondary-button" onClick={onConfirmQuestion}>
        请对方确认
      </button>
    </section>
  );
}

function BridgeView({
  step,
  message,
  sourceLabel,
  summaryHighlight,
  visibleCaptions,
  isCapturing,
  expectedCaptionCount,
  asrStatus,
  agentResult,
  onStartListening,
  onSave,
  onConfirmQuestion,
  onOpenPhrases
}: {
  step: BridgeStep;
  message: string;
  sourceLabel: string;
  summaryHighlight: string;
  visibleCaptions: CaptionLine[];
  isCapturing: boolean;
  expectedCaptionCount: number;
  asrStatus: AsrStatus;
  agentResult?: AgentRunResult;
  onStartListening: () => void;
  onSave: () => void;
  onConfirmQuestion: () => void;
  onOpenPhrases: () => void;
}) {
  const captionsDone = visibleCaptions.length >= expectedCaptionCount && !isCapturing;

  return (
    <div className="sb-view">
      <section className="sb-bridge-head">
        <p className="sb-kicker">现场沟通</p>
        <h1>一步一步来，不急。</h1>
        <p className="sb-bridge-source">当前话术：{sourceLabel}</p>
      </section>

      <ProgressDots step={step} />

      {step === "show" && (
        <section className="sb-bridge-stage">
          <DisplayCard message={message} />
          <div className="sb-bridge-actions">
            <button type="button" className="sb-primary-button" onClick={onStartListening}>
              对方开始说了
            </button>
            <button type="button" className="sb-secondary-button" onClick={onOpenPhrases}>
              换一句开场白
            </button>
          </div>
        </section>
      )}

      {step === "listen" && (
        <section className="sb-bridge-stage">
          <AsrStatusPanel status={asrStatus} />
          <CaptionPanel visibleCaptions={visibleCaptions} isCapturing={isCapturing} />
          {captionsDone && (
            <div className="sb-summary-card">
              <span>小桥抓到的重点</span>
              <strong>{summaryHighlight}</strong>
            </div>
          )}
          {captionsDone && (
            <AgentInsightCard result={agentResult} onConfirmQuestion={onConfirmQuestion} />
          )}
          <div className="sb-bridge-actions">
            <button
              type="button"
              className="sb-primary-button"
              onClick={onSave}
              disabled={!captionsDone || !agentResult}
            >
              保存这次重点
            </button>
            <button type="button" className="sb-secondary-button" onClick={onOpenPhrases}>
              还想问一句
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function RecordsView({
  records,
  selectedRecordId,
  justSavedRecordId,
  onSelectRecord,
  onContinue
}: {
  records: RecordItem[];
  selectedRecordId: string;
  justSavedRecordId?: string;
  onSelectRecord: (id: string) => void;
  onContinue: (record: RecordItem) => void;
}) {
  const selectedRecord = records.find((record) => record.id === selectedRecordId) ?? records[0];
  const showSavedNote = Boolean(justSavedRecordId && justSavedRecordId === selectedRecord.id);

  return (
    <div className="sb-view">
      <section className="sb-page-title">
        <p className="sb-kicker">沟通小本本</p>
        <h1>留下来的话，之后还能用。</h1>
      </section>

      <section className="sb-record-list" aria-label="历史沟通记录">
        {records.map((record) => (
          <button
            type="button"
            className={selectedRecord.id === record.id ? "sb-record-row is-active" : "sb-record-row"}
            key={record.id}
            onClick={() => onSelectRecord(record.id)}
          >
            <span>{record.time}</span>
            <strong>{record.title}</strong>
            <small>{record.place}</small>
          </button>
        ))}
      </section>

      <section className="sb-record-detail">
        {showSavedNote && (
          <div className="sb-record-saved-note">刚刚已保存，可以回看重点，也可以继续追问。</div>
        )}
        <div className="sb-sticker">重点</div>
        <h2>{selectedRecord.title}</h2>
        <p>{selectedRecord.summary}</p>
        <div className="sb-chip-grid">
          {selectedRecord.keyPoints.map((point) => (
            <span key={point}>{point}</span>
          ))}
        </div>
        <div className="sb-record-ai">
          <span>小桥理解</span>
          <strong>{selectedRecord.aiUnderstanding.plainSummary}</strong>
          <ul>
            {selectedRecord.aiUnderstanding.risks.map((risk) => (
              <li key={risk.text} className={`sb-risk-item sb-risk-item--${risk.level}`}>
                {risk.text}
              </li>
            ))}
          </ul>
        </div>
        <div className="sb-next-step">
          <span>下一步</span>
          <strong>{selectedRecord.nextStep}</strong>
        </div>
        <button type="button" className="sb-primary-button" onClick={() => onContinue(selectedRecord)}>
          用这条记录继续问
        </button>
      </section>
    </div>
  );
}

function PhrasesView({
  activePhraseId,
  onUsePhrase
}: {
  activePhraseId?: string;
  onUsePhrase: (phrase: Phrase) => void;
}) {
  return (
    <div className="sb-view">
      <section className="sb-page-title">
        <p className="sb-kicker">点一句就能递出去</p>
        <h1>不用临时组织语言。</h1>
      </section>

      <div className="sb-phrase-packs">
        {phrasePacks.map((pack) => (
          <section className="sb-phrase-pack" key={pack.id}>
            <div className="sb-panel-head">
              <span>{pack.title}</span>
              <strong>{pack.description}</strong>
            </div>
            <div className="sb-phrase-list">
              {pack.phrases.map((phrase) => (
                <button
                  type="button"
                  className={activePhraseId === phrase.id ? "is-active" : ""}
                  key={phrase.id}
                  onClick={() => onUsePhrase(phrase)}
                >
                  <span>{phrase.intent}</span>
                  <strong>{phrase.text}</strong>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function BottomNav({
  activeTab,
  onChange
}: {
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
}) {
  const tabs: AppTab[] = ["home", "bridge", "records", "phrases"];

  return (
    <nav className="sb-bottom-nav" aria-label="主导航">
      {tabs.map((tab) => (
        <button
          type="button"
          className={activeTab === tab ? "is-active" : ""}
          key={tab}
          onClick={() => onChange(tab)}
        >
          <span>{tabLabels[tab].mark}</span>
          <strong>{tabLabels[tab].label}</strong>
        </button>
      ))}
    </nav>
  );
}

export function DemoPage() {
  const contentRef = useRef<HTMLElement>(null);
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const [bridgeStep, setBridgeStep] = useState<BridgeStep>("show");
  const [displayMessage, setDisplayMessage] = useState(defaultMessage);
  const [bridgeSourceLabel, setBridgeSourceLabel] = useState("默认开场白");
  const [activeFlowId, setActiveFlowId] = useState<DemoFlowId>(defaultFlowId);
  const [visibleCaptions, setVisibleCaptions] = useState<CaptionLine[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [records, setRecords] = useState<RecordItem[]>(initialRecords);
  const [selectedRecordId, setSelectedRecordId] = useState(initialRecords[0].id);
  const [activePhraseId, setActivePhraseId] = useState<string>();
  const [justSavedRecordId, setJustSavedRecordId] = useState<string>();
  const [asrStatus, setAsrStatus] = useState<AsrStatus>("idle");
  const [agentResult, setAgentResult] = useState<AgentRunResult>();

  const activeFlow = demoFlows[activeFlowId];
  const latestRecord = useMemo(() => records[0], [records]);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [activeTab, bridgeStep, displayMessage]);

  useEffect(() => {
    const activeCaptions = activeFlow.captions;

    if (!isCapturing) {
      return;
    }

    if (visibleCaptions.length >= activeCaptions.length) {
      setAsrStatus("transcribing");

      const timer = window.setTimeout(() => {
        setIsCapturing(false);
        setAsrStatus("done");
        setAgentResult(runDemoAgent({ flow: activeFlow, transcript: activeCaptions }));
      }, 520);

      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => {
      setVisibleCaptions((previousLines) => [...previousLines, activeCaptions[previousLines.length]]);
    }, 720);

    return () => window.clearTimeout(timer);
  }, [activeFlow, isCapturing, visibleCaptions.length]);

  useEffect(() => {
    if (!justSavedRecordId) {
      return;
    }

    const timer = window.setTimeout(() => {
      setJustSavedRecordId(undefined);
    }, 2600);

    return () => window.clearTimeout(timer);
  }, [justSavedRecordId]);

  const openBridge = (
    message = defaultMessage,
    sourceLabel = "默认开场白",
    flowId: DemoFlowId = defaultFlowId
  ) => {
    setDisplayMessage(message);
    setBridgeSourceLabel(sourceLabel);
    setActiveFlowId(flowId);
    setVisibleCaptions([]);
    setIsCapturing(false);
    setAsrStatus("idle");
    setAgentResult(undefined);
    setBridgeStep("show");
    setActiveTab("bridge");
  };

  const startListening = () => {
    setVisibleCaptions([]);
    setAgentResult(undefined);
    setAsrStatus("listening");
    setBridgeStep("listen");
    setIsCapturing(true);
  };

  const handleConfirmQuestion = () => {
    if (!agentResult) {
      return;
    }

    openBridge(
      agentResult.understanding.suggestedQuestion,
      `${bridgeSourceLabel} · 追问确认`,
      activeFlowId
    );
  };

  const saveCurrentRecord = () => {
    const understanding = agentResult?.understanding ?? activeFlow.aiUnderstanding;
    const savedRecord: RecordItem = {
      ...activeFlow.savedRecord,
      aiUnderstanding: understanding,
      id: `record-${activeFlowId}-${Date.now()}`,
      time: "刚刚"
    };

    setRecords((currentRecords) => [savedRecord, ...currentRecords]);
    setSelectedRecordId(savedRecord.id);
    setJustSavedRecordId(savedRecord.id);
    setIsCapturing(false);
    setVisibleCaptions([]);
    setAsrStatus("idle");
    setAgentResult(undefined);
    setBridgeStep("show");
    setActiveTab("records");
  };

  const handlePickScenario = (scenario: QuickScenario) => {
    setActivePhraseId(undefined);
    setJustSavedRecordId(undefined);
    openBridge(scenario.message, scenario.title, scenario.id);
  };

  const handleUsePhrase = (phrase: Phrase) => {
    setActivePhraseId(phrase.id);
    setJustSavedRecordId(undefined);
    openBridge(phrase.text, phrase.intent, "generic");
  };

  const handleOpenRecord = (id: string) => {
    setSelectedRecordId(id);
    setActiveTab("records");
  };

  const handleContinueRecord = (record: RecordItem) => {
    setActivePhraseId(undefined);
    setJustSavedRecordId(undefined);
    openBridge(record.actionPhrase, record.title, record.flowId);
  };

  const renderActiveView = () => {
    if (activeTab === "home") {
      return (
        <HomeView
          latestRecord={latestRecord}
          onStart={() => openBridge(defaultMessage, "药店问药", defaultFlowId)}
          onPickScenario={handlePickScenario}
          onOpenRecord={handleOpenRecord}
          onOpenPhrases={() => setActiveTab("phrases")}
        />
      );
    }

    if (activeTab === "bridge") {
      return (
        <BridgeView
          step={bridgeStep}
          message={displayMessage}
          sourceLabel={bridgeSourceLabel}
          summaryHighlight={activeFlow.summaryHighlight}
          visibleCaptions={visibleCaptions}
          isCapturing={isCapturing}
          expectedCaptionCount={activeFlow.captions.length}
          asrStatus={asrStatus}
          agentResult={agentResult}
          onStartListening={startListening}
          onSave={saveCurrentRecord}
          onConfirmQuestion={handleConfirmQuestion}
          onOpenPhrases={() => setActiveTab("phrases")}
        />
      );
    }

    if (activeTab === "records") {
      return (
        <RecordsView
          records={records}
          selectedRecordId={selectedRecordId}
          justSavedRecordId={justSavedRecordId}
          onSelectRecord={setSelectedRecordId}
          onContinue={handleContinueRecord}
        />
      );
    }

    return <PhrasesView activePhraseId={activePhraseId} onUsePhrase={handleUsePhrase} />;
  };

  return (
    <main className="sb-app-shell">
      <div className="sb-device-frame">
        <AppTopBar activeTab={activeTab} onGoHome={() => setActiveTab("home")} />
        <section className="sb-app-content" ref={contentRef}>{renderActiveView()}</section>
        <BottomNav activeTab={activeTab} onChange={setActiveTab} />
      </div>
    </main>
  );
}
