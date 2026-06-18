import { useEffect, useMemo, useState } from "react";

type AppTab = "home" | "bridge" | "records" | "phrases";
type BridgeMode = "display" | "captions" | "confirm" | "saved";

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
  context: string;
  signal: string;
  message: string;
}

interface RecordItem {
  id: string;
  title: string;
  place: string;
  time: string;
  risk: "低" | "中" | "高";
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

const defaultMessage = "我听不见，但可以通过文字沟通。请说慢一点，或写下关键词。";

const quickScenarios: QuickScenario[] = [
  {
    id: "pharmacy",
    title: "药店问药",
    context: "用法、禁忌、下一步",
    signal: "高频",
    message: "我听不清，请帮我确认药名、用量和不能一起吃的东西。"
  },
  {
    id: "government",
    title: "窗口办事",
    context: "材料、排队、补交",
    signal: "易错",
    message: "我需要确认要交哪些材料，请把关键步骤写下来。"
  },
  {
    id: "traffic",
    title: "临时问路",
    context: "站台、换乘、方向",
    signal: "急用",
    message: "我听不见，请告诉我应该去哪个方向或哪个站台。"
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
    risk: "高",
    summary: "已确认饭后服用、一天两次、不能与酒同服。",
    nextStep: "服用后如明显不适，先停用并咨询医生。",
    keyPoints: ["饭后服用", "早晚各一次", "避免饮酒", "其他用药先问医生"],
    actionPhrase: "请再帮我写下药名、用量和注意事项。"
  },
  {
    id: "record-service",
    title: "证件补办咨询",
    place: "街道政务窗口",
    time: "昨天 10:18",
    risk: "中",
    summary: "需要身份证原件、近期照片，现场取号后到 3 号窗口办理。",
    nextStep: "明天上午带齐材料，先取号再排队。",
    keyPoints: ["身份证原件", "一寸照片", "3 号窗口", "上午人少"],
    actionPhrase: "我想确认还缺哪一项材料，请写给我。"
  },
  {
    id: "record-class",
    title: "课堂小组分工",
    place: "教室 B203",
    time: "周二 16:42",
    risk: "低",
    summary: "负责整理访谈记录，下周二前发到群里。",
    nextStep: "周日前完成初稿，周一晚上让同学复核。",
    keyPoints: ["访谈记录", "周二前提交", "群内同步"],
    actionPhrase: "请把我的任务和截止时间再确认一遍。"
  }
];

const phrasePacks: PhrasePack[] = [
  {
    id: "essential",
    title: "先开口",
    description: "把沟通规则先交给对方，降低尴尬和误会。",
    phrases: [
      { id: "essential-1", text: "我听不见，但可以看文字。请说慢一点。", intent: "说明状态" },
      { id: "essential-2", text: "请把时间、地点、金额写下来。", intent: "抓关键信息" },
      { id: "essential-3", text: "我没有听懂，可以换一种方式说吗？", intent: "请求复述" }
    ]
  },
  {
    id: "medical",
    title: "健康相关",
    description: "面对用药、问诊、检查时，优先确认风险。",
    phrases: [
      { id: "medical-1", text: "请写下药名、用量、一天几次。", intent: "确认用药" },
      { id: "medical-2", text: "这个情况严重吗？需要马上去医院吗？", intent: "判断紧急度" },
      { id: "medical-3", text: "有什么不能一起吃或不能做的事？", intent: "确认禁忌" }
    ]
  },
  {
    id: "public",
    title: "公共服务",
    description: "窗口、交通、校园和面试都能复用。",
    phrases: [
      { id: "public-1", text: "请告诉我下一步应该去哪里办理。", intent: "确认流程" },
      { id: "public-2", text: "我需要补交哪些材料？", intent: "确认材料" },
      { id: "public-3", text: "请帮我确认截止时间。", intent: "确认时间" }
    ]
  }
];

const bridgeModeLabels: Record<BridgeMode, string> = {
  display: "展示",
  captions: "字幕",
  confirm: "确认",
  saved: "留存"
};

const tabLabels: Record<AppTab, { label: string; mark: string }> = {
  home: { label: "首页", mark: "首" },
  bridge: { label: "开桥", mark: "桥" },
  records: { label: "记录", mark: "记" },
  phrases: { label: "话术", mark: "句" }
};

function AppTopBar({ activeTab, onGoHome }: { activeTab: AppTab; onGoHome: () => void }) {
  return (
    <header className="sb-topbar">
      <button type="button" className="sb-brand" onClick={onGoHome} aria-label="回到首页">
        <span className="sb-brand-mark">S</span>
        <span>
          <strong>SilentBridge</strong>
          <small>无声桥 · 随身沟通</small>
        </span>
      </button>
      <div className="sb-status-pill">
        <span className="sb-live-dot" />
        {tabLabels[activeTab].label}
      </div>
    </header>
  );
}

function DisplayPanel({ message, compact = false }: { message: string; compact?: boolean }) {
  return (
    <section className={compact ? "sb-display sb-display--compact" : "sb-display"}>
      <div className="sb-display-head">
        <span>给对方看</span>
        <span>高对比大字</span>
      </div>
      <p>{message}</p>
      <div className="sb-display-foot">
        <span>可递手机</span>
        <span>可保存</span>
        <span>可继续问</span>
      </div>
    </section>
  );
}

function HomeView({
  displayMessage,
  latestRecord,
  onOpenBridge,
  onOpenRecord,
  onOpenPhrases,
  onPickScenario
}: {
  displayMessage: string;
  latestRecord: RecordItem;
  onOpenBridge: () => void;
  onOpenRecord: (id: string) => void;
  onOpenPhrases: () => void;
  onPickScenario: (scenario: QuickScenario) => void;
}) {
  return (
    <div className="sb-view sb-view--home">
      <section className="sb-home-hero">
        <p className="sb-kicker">READY WHEN WORDS FAIL</p>
        <h1>把沟通先稳住，再把重点留下来。</h1>
        <p>听不清、说不出、来不及解释时，先用大字开场，再接字幕、确认和留存。</p>
        <button type="button" className="sb-primary-button" onClick={onOpenBridge}>
          立即开桥
        </button>
      </section>

      <section className="sb-quick-grid" aria-label="常用场景">
        {quickScenarios.map((scenario) => (
          <button
            type="button"
            className="sb-scenario-tile"
            key={scenario.id}
            onClick={() => onPickScenario(scenario)}
          >
            <span>{scenario.signal}</span>
            <strong>{scenario.title}</strong>
            <small>{scenario.context}</small>
          </button>
        ))}
      </section>

      <DisplayPanel message={displayMessage} compact />

      <section className="sb-home-row">
        <button type="button" className="sb-record-preview" onClick={() => onOpenRecord(latestRecord.id)}>
          <span>最近记录</span>
          <strong>{latestRecord.title}</strong>
          <p>{latestRecord.summary}</p>
        </button>
        <button type="button" className="sb-phrase-entry" onClick={onOpenPhrases}>
          <span>话术库</span>
          <strong>不临场组织语言</strong>
          <p>点一句，直接递给对方看。</p>
        </button>
      </section>
    </div>
  );
}

function BridgeModeTabs({
  activeMode,
  onChange
}: {
  activeMode: BridgeMode;
  onChange: (mode: BridgeMode) => void;
}) {
  const modes: BridgeMode[] = ["display", "captions", "confirm", "saved"];

  return (
    <nav className="sb-mode-tabs" aria-label="开桥模式">
      {modes.map((mode) => (
        <button
          type="button"
          className={activeMode === mode ? "is-active" : ""}
          key={mode}
          onClick={() => onChange(mode)}
        >
          {bridgeModeLabels[mode]}
        </button>
      ))}
    </nav>
  );
}

function CaptionStream({
  visibleCaptions,
  isCapturing,
  onStart
}: {
  visibleCaptions: CaptionLine[];
  isCapturing: boolean;
  onStart: () => void;
}) {
  return (
    <section className="sb-caption-card">
      <div className="sb-section-head">
        <span>实时字幕</span>
        <strong>{isCapturing ? "正在接收" : "药店问药模拟"}</strong>
      </div>
      <div className="sb-caption-list" aria-live="polite">
        {visibleCaptions.length === 0 ? (
          <div className="sb-empty-state">
            <strong>等待对方说话</strong>
            <p>点击开始后，系统会把对方说明转成可回看的文字。</p>
          </div>
        ) : (
          visibleCaptions.map((line) => (
            <article
              className={line.important ? "sb-caption-line sb-caption-line--important" : "sb-caption-line"}
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
      <button type="button" className="sb-secondary-button" onClick={onStart} disabled={isCapturing}>
        {isCapturing ? "接收中" : "开始接收字幕"}
      </button>
    </section>
  );
}

function ConfirmBoard({
  onUsePhrase
}: {
  onUsePhrase: (phrase: Phrase) => void;
}) {
  const confirmPhrases = phrasePacks[1].phrases;

  return (
    <section className="sb-confirm-board">
      <div className="sb-section-head">
        <span>继续确认</span>
        <strong>把问题变成可递出的句子</strong>
      </div>
      <div className="sb-confirm-grid">
        {confirmPhrases.map((phrase) => (
          <button type="button" key={phrase.id} onClick={() => onUsePhrase(phrase)}>
            <span>{phrase.intent}</span>
            <strong>{phrase.text}</strong>
          </button>
        ))}
      </div>
    </section>
  );
}

function SavedCard({ latestRecord, onOpenRecord }: { latestRecord: RecordItem; onOpenRecord: () => void }) {
  return (
    <section className="sb-saved-card">
      <div className="sb-section-head">
        <span>已留存</span>
        <strong>{latestRecord.title}</strong>
      </div>
      <p>{latestRecord.summary}</p>
      <ul>
        {latestRecord.keyPoints.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <button type="button" className="sb-secondary-button" onClick={onOpenRecord}>
        查看记录详情
      </button>
    </section>
  );
}

function BridgeView({
  bridgeMode,
  displayMessage,
  visibleCaptions,
  isCapturing,
  latestRecord,
  onBridgeModeChange,
  onStartCaptions,
  onUsePhrase,
  onSaveRecord,
  onOpenRecord
}: {
  bridgeMode: BridgeMode;
  displayMessage: string;
  visibleCaptions: CaptionLine[];
  isCapturing: boolean;
  latestRecord: RecordItem;
  onBridgeModeChange: (mode: BridgeMode) => void;
  onStartCaptions: () => void;
  onUsePhrase: (phrase: Phrase) => void;
  onSaveRecord: () => void;
  onOpenRecord: () => void;
}) {
  return (
    <div className="sb-view">
      <section className="sb-workspace-head">
        <div>
          <p className="sb-kicker">FIELD BRIDGE</p>
          <h1>现场开桥</h1>
        </div>
        <button type="button" className="sb-save-button" onClick={onSaveRecord}>
          保存
        </button>
      </section>

      <BridgeModeTabs activeMode={bridgeMode} onChange={onBridgeModeChange} />

      {bridgeMode === "display" && (
        <div className="sb-panel-stack">
          <DisplayPanel message={displayMessage} />
          <div className="sb-action-strip">
            <button type="button" onClick={() => onBridgeModeChange("captions")}>
              接字幕
            </button>
            <button type="button" onClick={() => onBridgeModeChange("confirm")}>
              继续问
            </button>
          </div>
        </div>
      )}

      {bridgeMode === "captions" && (
        <CaptionStream
          visibleCaptions={visibleCaptions}
          isCapturing={isCapturing}
          onStart={onStartCaptions}
        />
      )}

      {bridgeMode === "confirm" && (
        <div className="sb-panel-stack">
          <DisplayPanel message={displayMessage} compact />
          <ConfirmBoard onUsePhrase={onUsePhrase} />
        </div>
      )}

      {bridgeMode === "saved" && <SavedCard latestRecord={latestRecord} onOpenRecord={onOpenRecord} />}
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
        <p className="sb-kicker">COMMUNICATION MEMORY</p>
        <h1>沟通记录</h1>
        <p>把每次对话变成可回看、可复用、可交给家人或医生的摘要。</p>
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
        <div className="sb-record-detail-head">
          <span>风险 {selectedRecord.risk}</span>
          <strong>{selectedRecord.title}</strong>
          <small>{selectedRecord.place} · {selectedRecord.time}</small>
        </div>
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
        <p className="sb-kicker">PHRASE LIBRARY</p>
        <h1>话术库</h1>
        <p>不是固定四个场景，而是把常见沟通动作做成可扩展的句库。</p>
      </section>

      <div className="sb-phrase-packs">
        {phrasePacks.map((pack) => (
          <section className="sb-phrase-pack" key={pack.id}>
            <div className="sb-section-head">
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
  const [bridgeMode, setBridgeMode] = useState<BridgeMode>("display");
  const [displayMessage, setDisplayMessage] = useState(defaultMessage);
  const [visibleCaptions, setVisibleCaptions] = useState<CaptionLine[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [records, setRecords] = useState<RecordItem[]>(initialRecords);
  const [selectedRecordId, setSelectedRecordId] = useState(initialRecords[0].id);
  const [activePhraseId, setActivePhraseId] = useState<string>();

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
      setVisibleCaptions((prev) => [...prev, captionLines[prev.length]]);
    }, 680);

    return () => window.clearTimeout(timer);
  }, [isCapturing, visibleCaptions.length]);

  const openBridge = (message = displayMessage, mode: BridgeMode = "display") => {
    setDisplayMessage(message);
    setBridgeMode(mode);
    setActiveTab("bridge");
  };

  const handleStartCaptions = () => {
    setVisibleCaptions([]);
    setIsCapturing(true);
  };

  const handleUsePhrase = (phrase: Phrase) => {
    setActivePhraseId(phrase.id);
    openBridge(phrase.text, "display");
  };

  const handlePickScenario = (scenario: QuickScenario) => {
    setActivePhraseId(undefined);
    openBridge(scenario.message, "display");
  };

  const handleOpenRecord = (id: string) => {
    setSelectedRecordId(id);
    setActiveTab("records");
  };

  const handleContinueRecord = (record: RecordItem) => {
    setActivePhraseId(undefined);
    openBridge(record.actionPhrase, "display");
  };

  const handleSaveRecord = () => {
    const savedRecord: RecordItem = {
      id: "record-current-session",
      title: "当前现场沟通",
      place: "药店柜台",
      time: "刚刚",
      risk: "高",
      summary: "已把对方说明转成文字，并保留用药频次、禁忌和下一步。",
      nextStep: "按记录再次确认药名和用量。",
      keyPoints: ["已展示开场说明", "已接收字幕", "需要确认药名", "建议保存给家人看"],
      actionPhrase: "请把药名和用量再写一遍，我要保存。"
    };

    setRecords((currentRecords) => {
      const withoutCurrent = currentRecords.filter((record) => record.id !== savedRecord.id);
      return [savedRecord, ...withoutCurrent];
    });
    setSelectedRecordId(savedRecord.id);
    setBridgeMode("saved");
  };

  const renderActiveView = () => {
    if (activeTab === "home") {
      return (
        <HomeView
          displayMessage={displayMessage}
          latestRecord={latestRecord}
          onOpenBridge={() => openBridge(defaultMessage)}
          onOpenRecord={handleOpenRecord}
          onOpenPhrases={() => setActiveTab("phrases")}
          onPickScenario={handlePickScenario}
        />
      );
    }

    if (activeTab === "bridge") {
      return (
        <BridgeView
          bridgeMode={bridgeMode}
          displayMessage={displayMessage}
          visibleCaptions={visibleCaptions}
          isCapturing={isCapturing}
          latestRecord={latestRecord}
          onBridgeModeChange={setBridgeMode}
          onStartCaptions={handleStartCaptions}
          onUsePhrase={handleUsePhrase}
          onSaveRecord={handleSaveRecord}
          onOpenRecord={() => handleOpenRecord(selectedRecordId)}
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
