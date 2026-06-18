import { useEffect, useMemo, useState } from "react";

type AppTab = "home" | "bridge" | "records" | "phrases";
type BridgeStep = "show" | "listen" | "saved";

interface CaptionLine {
  id: string;
  speaker: string;
  text: string;
  time: string;
  important?: boolean;
}

interface QuickScenario {
  id: string;
  title: string;
  helper: string;
  message: string;
  style: "sky" | "sun" | "mint";
}

interface RecordItem {
  id: string;
  title: string;
  place: string;
  time: string;
  summary: string;
  nextStep: string;
  keyPoints: string[];
  actionPhrase: string;
}

interface Phrase {
  id: string;
  text: string;
  intent: string;
}

interface PhrasePack {
  id: string;
  title: string;
  description: string;
  phrases: Phrase[];
}

const defaultMessage = "我听不见，但可以看文字。请说慢一点。";

const quickScenarios: QuickScenario[] = [
  {
    id: "pharmacy",
    title: "药店问药",
    helper: "药名、用量、禁忌",
    message: "我听不清，请帮我写下药名、用量和不能一起吃的东西。",
    style: "mint"
  },
  {
    id: "service",
    title: "窗口办事",
    helper: "材料、排队、下一步",
    message: "我需要确认要交哪些材料，请把关键步骤写下来。",
    style: "sun"
  },
  {
    id: "traffic",
    title: "临时问路",
    helper: "方向、站台、换乘",
    message: "我听不见，请告诉我应该去哪个方向或哪个站台。",
    style: "sky"
  }
];

const captionLines: CaptionLine[] = [
  {
    id: "caption-1",
    speaker: "店员",
    text: "这个药饭后吃，一天两次，早晚各一次。",
    time: "00:01",
    important: true
  },
  {
    id: "caption-2",
    speaker: "店员",
    text: "不要和酒一起服用，如果已经在吃其他药，最好先问医生。",
    time: "00:05",
    important: true
  },
  {
    id: "caption-3",
    speaker: "店员",
    text: "如果吃完后明显不舒服，就先停用，并尽快咨询医生。",
    time: "00:09"
  }
];

const initialRecords: RecordItem[] = [
  {
    id: "record-pharmacy",
    title: "药店问药",
    place: "社区药房",
    time: "今天 14:26",
    summary: "已确认饭后服用、一天两次、不能与酒同服。",
    nextStep: "服用后如明显不适，先停用并咨询医生。",
    keyPoints: ["饭后服用", "早晚各一次", "避免饮酒", "不适时先停用"],
    actionPhrase: "请再帮我写下药名、用量和注意事项。"
  },
  {
    id: "record-service",
    title: "证件补办咨询",
    place: "街道政务窗口",
    time: "昨天 10:18",
    summary: "需要身份证原件、近期照片，现场取号后到 3 号窗口办理。",
    nextStep: "明天上午带齐材料，先取号再排队。",
    keyPoints: ["身份证原件", "一寸照片", "3 号窗口", "上午办理"],
    actionPhrase: "我想确认还缺哪一项材料，请写给我。"
  }
];

const phrasePacks: PhrasePack[] = [
  {
    id: "first",
    title: "先说明",
    description: "先让对方知道怎么配合。",
    phrases: [
      { id: "first-1", text: "我听不见，但可以看文字。请说慢一点。", intent: "说明状态" },
      { id: "first-2", text: "请把关键词写下来给我看。", intent: "请对方写" },
      { id: "first-3", text: "我没有听懂，可以换一种方式说吗？", intent: "请求复述" }
    ]
  },
  {
    id: "confirm",
    title: "再确认",
    description: "把容易听错的信息单独确认。",
    phrases: [
      { id: "confirm-1", text: "请写下时间、地点和下一步。", intent: "确认三要素" },
      { id: "confirm-2", text: "请写下药名、用量、一天几次。", intent: "确认用药" },
      { id: "confirm-3", text: "我需要补交哪些材料？", intent: "确认材料" }
    ]
  }
];

const tabLabels: Record<AppTab, { label: string; mark: string }> = {
  home: { label: "首页", mark: "首" },
  bridge: { label: "开桥", mark: "桥" },
  records: { label: "记录", mark: "记" },
  phrases: { label: "话术", mark: "句" }
};

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
    { id: "listen", label: "听对方说" },
    { id: "saved", label: "留下重点" }
  ];
  const activeIndex = steps.findIndex((item) => item.id === step);

  return (
    <div className="sb-progress" aria-label="沟通步骤">
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

function SavedPanel({ record, onOpenRecord }: { record: RecordItem; onOpenRecord: () => void }) {
  return (
    <section className="sb-saved-panel">
      <div className="sb-sticker">已保存</div>
      <h2>{record.title}</h2>
      <p>{record.summary}</p>
      <div className="sb-chip-grid">
        {record.keyPoints.map((point) => (
          <span key={point}>{point}</span>
        ))}
      </div>
      <button type="button" className="sb-secondary-button" onClick={onOpenRecord}>
        去记录里看看
      </button>
    </section>
  );
}

function BridgeView({
  step,
  message,
  visibleCaptions,
  isCapturing,
  currentRecord,
  onStartListening,
  onSave,
  onOpenPhrases,
  onOpenRecord,
  onRestart
}: {
  step: BridgeStep;
  message: string;
  visibleCaptions: CaptionLine[];
  isCapturing: boolean;
  currentRecord: RecordItem;
  onStartListening: () => void;
  onSave: () => void;
  onOpenPhrases: () => void;
  onOpenRecord: () => void;
  onRestart: () => void;
}) {
  const captionsDone = visibleCaptions.length >= captionLines.length && !isCapturing;

  return (
    <div className="sb-view">
      <section className="sb-bridge-head">
        <p className="sb-kicker">现场沟通</p>
        <h1>一步一步来，不急。</h1>
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
          <CaptionPanel visibleCaptions={visibleCaptions} isCapturing={isCapturing} />
          {captionsDone && (
            <div className="sb-summary-card">
              <span>小桥抓到的重点</span>
              <strong>饭后吃，一天两次，不要和酒一起服用。</strong>
            </div>
          )}
          <div className="sb-bridge-actions">
            <button
              type="button"
              className="sb-primary-button"
              onClick={onSave}
              disabled={!captionsDone}
            >
              保存这次重点
            </button>
            <button type="button" className="sb-secondary-button" onClick={onOpenPhrases}>
              还想问一句
            </button>
          </div>
        </section>
      )}

      {step === "saved" && (
        <section className="sb-bridge-stage">
          <SavedPanel record={currentRecord} onOpenRecord={onOpenRecord} />
          <button type="button" className="sb-secondary-button" onClick={onRestart}>
            再开一次沟通
          </button>
        </section>
      )}
    </div>
  );
}

function RecordsView({
  records,
  selectedRecordId,
  onSelectRecord,
  onContinue
}: {
  records: RecordItem[];
  selectedRecordId: string;
  onSelectRecord: (id: string) => void;
  onContinue: (record: RecordItem) => void;
}) {
  const selectedRecord = records.find((record) => record.id === selectedRecordId) ?? records[0];

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
        <div className="sb-sticker">重点</div>
        <h2>{selectedRecord.title}</h2>
        <p>{selectedRecord.summary}</p>
        <div className="sb-chip-grid">
          {selectedRecord.keyPoints.map((point) => (
            <span key={point}>{point}</span>
          ))}
        </div>
        <div className="sb-next-step">
          <span>下一步</span>
          <strong>{selectedRecord.nextStep}</strong>
        </div>
        <button type="button" className="sb-primary-button" onClick={() => onContinue(selectedRecord)}>
          继续这次沟通
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
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const [bridgeStep, setBridgeStep] = useState<BridgeStep>("show");
  const [displayMessage, setDisplayMessage] = useState(defaultMessage);
  const [visibleCaptions, setVisibleCaptions] = useState<CaptionLine[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [records, setRecords] = useState<RecordItem[]>(initialRecords);
  const [selectedRecordId, setSelectedRecordId] = useState(initialRecords[0].id);
  const [activePhraseId, setActivePhraseId] = useState<string>();
  const [currentRecord, setCurrentRecord] = useState<RecordItem>(initialRecords[0]);

  const latestRecord = useMemo(() => records[0], [records]);

  useEffect(() => {
    if (!isCapturing) {
      return;
    }

    if (visibleCaptions.length >= captionLines.length) {
      setIsCapturing(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setVisibleCaptions((previousLines) => [...previousLines, captionLines[previousLines.length]]);
    }, 720);

    return () => window.clearTimeout(timer);
  }, [isCapturing, visibleCaptions.length]);

  const openBridge = (message = defaultMessage) => {
    setDisplayMessage(message);
    setVisibleCaptions([]);
    setIsCapturing(false);
    setBridgeStep("show");
    setActiveTab("bridge");
  };

  const startListening = () => {
    setVisibleCaptions([]);
    setBridgeStep("listen");
    setIsCapturing(true);
  };

  const saveCurrentRecord = () => {
    const savedRecord: RecordItem = {
      id: `record-${Date.now()}`,
      title: "刚刚的现场沟通",
      place: "药店柜台",
      time: "刚刚",
      summary: "已保存饭后服用、一天两次、不能与酒同服。",
      nextStep: "如服用后明显不适，先停用并咨询医生。",
      keyPoints: ["饭后服用", "早晚各一次", "避免饮酒", "不适时咨询医生"],
      actionPhrase: "请把药名和用量再写一遍，我要保存。"
    };

    setCurrentRecord(savedRecord);
    setRecords((currentRecords) => [savedRecord, ...currentRecords]);
    setSelectedRecordId(savedRecord.id);
    setBridgeStep("saved");
  };

  const handlePickScenario = (scenario: QuickScenario) => {
    setActivePhraseId(undefined);
    openBridge(scenario.message);
  };

  const handleUsePhrase = (phrase: Phrase) => {
    setActivePhraseId(phrase.id);
    openBridge(phrase.text);
  };

  const handleOpenRecord = (id: string) => {
    setSelectedRecordId(id);
    setActiveTab("records");
  };

  const handleContinueRecord = (record: RecordItem) => {
    setActivePhraseId(undefined);
    openBridge(record.actionPhrase);
  };

  const renderActiveView = () => {
    if (activeTab === "home") {
      return (
        <HomeView
          latestRecord={latestRecord}
          onStart={() => openBridge(defaultMessage)}
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
          visibleCaptions={visibleCaptions}
          isCapturing={isCapturing}
          currentRecord={currentRecord}
          onStartListening={startListening}
          onSave={saveCurrentRecord}
          onOpenPhrases={() => setActiveTab("phrases")}
          onOpenRecord={() => handleOpenRecord(selectedRecordId)}
          onRestart={() => openBridge(defaultMessage)}
        />
      );
    }

    if (activeTab === "records") {
      return (
        <RecordsView
          records={records}
          selectedRecordId={selectedRecordId}
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
        <section className="sb-app-content">{renderActiveView()}</section>
        <BottomNav activeTab={activeTab} onChange={setActiveTab} />
      </div>
    </main>
  );
}
