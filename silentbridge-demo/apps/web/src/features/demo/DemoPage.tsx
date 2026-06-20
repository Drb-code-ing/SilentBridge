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
import type { AsrStatus } from "./asr-simulator";
import { runDemoAgent, type AgentRunResult } from "./agent-graph";
import { transcribeSession } from "./asr-client";
import { runSessionAgent } from "./agent-client";
import {
  appendSessionRound,
  createCommunicationSession,
  createContinuationSession,
  createRecordFromSession,
  loadStoredRecords,
  persistRecords
} from "./session-store";
import type { CommunicationSession } from "./session-types";
import { inferFlowIdFromText, normalizeUserText, createBrowserSpeechTranscript } from "./real-input-engine";
import {
  clearBridgeProgressDraft,
  loadBridgeProgressDraft,
  saveBridgeProgressDraft
} from "./bridge-progress-store";
import { requestMicrophoneAccess, type AudioCaptureState } from "./audio-capture-client";
import { getAgentRuntimeStatus, type AgentRuntimeStatus } from "./agent-runtime-config";
import { pickNextRecordId, removeRecord, resetRecords } from "./record-actions";
import {
  createBrowserSpeechCapture,
  detectBrowserSpeechRecognition,
  type BrowserSpeechCaptureController
} from "./browser-speech-client";

type RecordsMode = "list" | "detail";
type CaptureMode = "idle" | "fallback-demo" | "browser-speech";

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

function CaptionPanel({
  visibleCaptions,
  isCapturing
}: {
  visibleCaptions: CaptionLine[];
  isCapturing: boolean;
}) {
  const hasCaptions = visibleCaptions.length > 0;
  const statusLabel = isCapturing ? "正在听" : hasCaptions ? "已抓到重点" : "等待对方回复";
  const title = hasCaptions ? "对方的话已整理成文字" : "对方说完后会出现在这里";

  return (
    <section className="sb-caption-panel" aria-live="polite">
      <div className="sb-panel-head">
        <span>{statusLabel}</span>
        <strong>{title}</strong>
      </div>
      <div className="sb-caption-list">
        {hasCaptions ? (
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
        ) : (
          <div className="sb-listening-empty">
            <span />
            <p>请让对方开始说，文字会一条一条出现。</p>
          </div>
        )}
      </div>
    </section>
  );
}

function AgentInsightCard({
  result,
  provider,
  onConfirmQuestion
}: {
  result?: AgentRunResult;
  provider: "proxy" | "fallback";
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
        <strong>已整理出确认点</strong>
      </div>
      <div className="sb-agent-provider">
        {provider === "proxy" ? "已通过安全代理整理" : "本地安全整理"}
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
  agentProvider,
  replyDraft,
  flowNotice,
  runtimeStatus,
  onReplyDraftChange,
  onUseDemoReply,
  onUseMicrophone,
  onProcessReply,
  onCancelRound,
  onStartNew,
  onBackToShow,
  onBackToReply,
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
  agentProvider: "proxy" | "fallback";
  replyDraft: string;
  flowNotice?: string;
  runtimeStatus: AgentRuntimeStatus;
  onReplyDraftChange: (value: string) => void;
  onUseDemoReply: () => void;
  onUseMicrophone: () => void;
  onProcessReply: () => void;
  onCancelRound: () => void;
  onStartNew: () => void;
  onBackToShow: () => void;
  onBackToReply: () => void;
  onStartListening: () => void;
  onSave: () => void;
  onConfirmQuestion: () => void;
  onOpenPhrases: () => void;
}) {
  const captionsDone =
    !isCapturing &&
    visibleCaptions.length > 0 &&
    (Boolean(agentResult) || visibleCaptions.length >= expectedCaptionCount);

  const listenCopy: Record<AsrStatus, { title: string; helper: string; primary: string }> = {
    idle: {
      title: "准备收听",
      helper: "点击后开始收听；如果浏览器不支持，会自动切到演示转写流。",
      primary: "开始收听"
    },
    requesting: {
      title: "正在请求麦克风",
      helper: "允许麦克风后，就可以把对方的话转成文字。",
      primary: "请求中..."
    },
    listening: {
      title: "正在收听对方说话",
      helper: "请把手机靠近对方，识别文字会出现在下方。",
      primary: "正在收听..."
    },
    transcribing: {
      title: "正在整理文字",
      helper: "小桥正在把识别到的话整理成重点。",
      primary: "整理中..."
    },
    done: {
      title: "已经整理成文字",
      helper: "字幕和重点已经生成，可以保存或继续追问。",
      primary: "保存这次重点"
    },
    fallback: {
      title: "已切到演示转写",
      helper: "当前环境无法稳定识别语音，先用演示字幕跑通流程。",
      primary: "演示转写中..."
    },
    error: {
      title: "没有识别到清晰语音",
      helper: "可以重试、让对方打字，或填入演示回复。",
      primary: "重新收听"
    }
  };

  const activeListenCopy = captionsDone ? listenCopy.done : listenCopy[asrStatus];
  const listenTitle = activeListenCopy.title;
  const listenHelper = activeListenCopy.helper;
  const primaryListenLabel = captionsDone ? listenCopy.done.primary : activeListenCopy.primary;
  const primaryListenAction = captionsDone ? onSave : onUseMicrophone;

  return (
    <div className="sb-view">
      <section className="sb-bridge-head">
        <p className="sb-kicker">现场沟通</p>
        <h1>一步一步来，不急。</h1>
        <p className="sb-bridge-source">当前话术：{sourceLabel}</p>
      </section>

      <ProgressDots step={step} />

      {flowNotice && <div className="sb-flow-notice">{flowNotice}</div>}
      {sourceLabel.includes("继续追问") && (
        <div className="sb-continuation-hint">这次会接着上一条记录问，不用重新解释。</div>
      )}

      {step === "show" && (
        <section className="sb-bridge-stage">
          <DisplayCard message={message} />
          <div className="sb-bridge-actions sb-bridge-actions--show">
            <button type="button" className="sb-primary-button" onClick={onStartListening}>
              对方看完了，开始收听
            </button>
            <div className="sb-bridge-toolstrip" aria-label="其他操作">
              <button type="button" className="sb-tool-button" onClick={onOpenPhrases}>
                <span>句</span>
                <strong>换一句</strong>
              </button>
              <button type="button" className="sb-tool-button" onClick={onStartNew}>
                <span>新</span>
                <strong>新沟通</strong>
              </button>
            </div>
          </div>
        </section>
      )}

      {step === "listen" && (
        <section className="sb-bridge-stage">
          <section className={`sb-listen-console sb-listen-console--${asrStatus}`}>
            <div className="sb-listen-orb" aria-hidden="true">
              <span />
            </div>
            <div className="sb-listen-copy">
              <span>{listenTitle}</span>
              <strong>对方说的话，会变成清楚字幕。</strong>
              <p>{listenHelper}</p>
            </div>
          </section>
          <div className="sb-bridge-actions sb-bridge-actions--listen">
            <button
              type="button"
              className="sb-primary-button"
              onClick={primaryListenAction}
              disabled={
                asrStatus === "requesting" ||
                asrStatus === "transcribing" ||
                isCapturing ||
                (captionsDone && !agentResult)
              }
            >
              {primaryListenLabel}
            </button>
            <div className="sb-bridge-toolstrip" aria-label="听桥操作">
              <button type="button" className="sb-tool-button" onClick={captionsDone ? onBackToReply : onBackToShow}>
                <span>←</span>
                <strong>{captionsDone ? "改文字" : "上一步"}</strong>
              </button>
              <button type="button" className="sb-tool-button" onClick={isCapturing ? onCancelRound : onStartNew}>
                <span>{isCapturing ? "停" : "新"}</span>
                <strong>{isCapturing ? "取消" : "新沟通"}</strong>
              </button>
            </div>
          </div>
          <CaptionPanel visibleCaptions={visibleCaptions} isCapturing={isCapturing} />
          <section className="sb-input-card sb-input-card--reply">
            <div className="sb-input-card__head">
              <span>备用输入</span>
              <button type="button" className="sb-step-back-button" onClick={onBackToShow}>
                <span>←</span>
                <strong>给对方看</strong>
              </button>
            </div>
            <p className="sb-input-card__hint">如果环境太吵，直接让对方打字或请同行者输入。</p>
            <label className="sb-input-card__field">
              <span className="sr-only">对方回复内容</span>
            <textarea
              value={replyDraft}
              onChange={(event) => onReplyDraftChange(event.target.value)}
              placeholder="请对方直接打字、让同行者帮忙输入，或粘贴转文字结果。"
              maxLength={280}
              rows={4}
            />
            </label>
            <div className="sb-capture-toolbar" aria-label="回复输入方式">
              <button type="button" className="sb-capture-tool" onClick={onUseDemoReply}>
                <span>✎</span>
                <strong>填入演示</strong>
              </button>
              <button type="button" className="sb-capture-tool" onClick={onProcessReply}>
                <span>✓</span>
                <strong>整理回复</strong>
              </button>
            </div>
          </section>
          {captionsDone && (
            <div className="sb-summary-card">
              <span>小桥抓到的重点</span>
              <strong>{summaryHighlight}</strong>
            </div>
          )}
          {captionsDone && (
            <AgentInsightCard result={agentResult} provider={agentProvider} onConfirmQuestion={onConfirmQuestion} />
          )}
          <aside className="sb-safety-strip">
            <span>隐私</span>
            <p>{runtimeStatus.privacyNote}</p>
            <div className="sb-runtime-tags">
              <span>{runtimeStatus.asrMode === "browser-ready" ? "麦克风已授权" : "手动输入兜底"}</span>
              <span>不会在前端保存密钥</span>
            </div>
          </aside>
        </section>
      )}
    </div>
  );
}

function RecordsView({
  records,
  selectedRecordId,
  mode,
  justSavedRecordId,
  onSelectRecord,
  onBackToList,
  onContinue,
  onOpenHome,
  onDeleteRecord,
  onResetRecords
}: {
  records: RecordItem[];
  selectedRecordId: string;
  mode: RecordsMode;
  justSavedRecordId?: string;
  onSelectRecord: (id: string) => void;
  onBackToList: () => void;
  onContinue: (record: RecordItem) => void;
  onOpenHome: () => void;
  onDeleteRecord: (id: string) => void;
  onResetRecords: () => void;
}) {
  const selectedRecord = records.find((record) => record.id === selectedRecordId) ?? records[0];
  const showSavedNote = Boolean(justSavedRecordId && justSavedRecordId === selectedRecord.id);

  if (mode === "list") {
    return (
      <div className="sb-view">
        <section className="sb-page-title">
          <p className="sb-kicker">沟通小本本</p>
          <h1>留下来的话，之后还能用。</h1>
          <button type="button" className="sb-record-tool" onClick={onResetRecords}>
            清空演示记录
          </button>
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
              <div>
                <strong>{record.title}</strong>
                <small>{record.place}</small>
                <p>{record.summary}</p>
              </div>
            </button>
          ))}
        </section>
      </div>
    );
  }

  return (
    <div className="sb-view sb-record-detail-view">
      <section className="sb-record-detail-head">
        <button type="button" className="sb-step-back-button" onClick={onBackToList}>
          <span>←</span>
          <strong>记录列表</strong>
        </button>
        <span>{selectedRecord.time}</span>
        <button
          type="button"
          className="sb-record-tool sb-record-tool--danger"
          onClick={() => onDeleteRecord(selectedRecord.id)}
        >
          删除这条
        </button>
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
      </section>

      <div className="sb-record-action-bar">
        <button type="button" className="sb-secondary-button" onClick={onOpenHome}>
          回到首页
        </button>
        <button type="button" className="sb-primary-button" onClick={() => onContinue(selectedRecord)}>
          继续追问
        </button>
      </div>
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
                  <small>使用</small>
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
  const replyRunIdRef = useRef(0);
  const restoredDraft = useMemo(() => loadBridgeProgressDraft(), []);
  const [activeTab, setActiveTab] = useState<AppTab>(restoredDraft?.activeTab ?? "home");
  const [bridgeStep, setBridgeStep] = useState<BridgeStep>(restoredDraft?.bridgeStep ?? "show");
  const [displayMessage, setDisplayMessage] = useState(restoredDraft?.displayMessage ?? defaultMessage);
  const [bridgeSourceLabel, setBridgeSourceLabel] = useState(restoredDraft?.bridgeSourceLabel ?? "默认开场白");
  const [activeFlowId, setActiveFlowId] = useState<DemoFlowId>(restoredDraft?.activeFlowId ?? defaultFlowId);
  const [activeSession, setActiveSession] = useState<CommunicationSession>(
    () =>
      restoredDraft?.activeSession ??
      createCommunicationSession({
        flowId: defaultFlowId,
        sourceLabel: "默认开场白",
        prompt: defaultMessage
      })
  );
  const [visibleCaptions, setVisibleCaptions] = useState<CaptionLine[]>(restoredDraft?.visibleCaptions ?? []);
  const [isCapturing, setIsCapturing] = useState(false);
  const [records, setRecords] = useState<RecordItem[]>(() => loadStoredRecords(initialRecords));
  const [selectedRecordId, setSelectedRecordId] = useState(() => {
    const stored = loadStoredRecords(initialRecords);
    return stored[0]?.id ?? initialRecords[0].id;
  });
  const [recordsMode, setRecordsMode] = useState<RecordsMode>("list");
  const [activePhraseId, setActivePhraseId] = useState<string>();
  const [justSavedRecordId, setJustSavedRecordId] = useState<string>();
  const [asrStatus, setAsrStatus] = useState<AsrStatus>(restoredDraft?.asrStatus ?? "idle");
  const [agentResult, setAgentResult] = useState<AgentRunResult | undefined>(restoredDraft?.agentResult);
  const [agentProvider, setAgentProvider] = useState<"proxy" | "fallback">(restoredDraft?.agentProvider ?? "fallback");
  const [homeMessageDraft, setHomeMessageDraft] = useState(defaultMessage);
  const [replyDraft, setReplyDraft] = useState(restoredDraft?.replyDraft ?? "");
  const [processedReplyDraft, setProcessedReplyDraft] = useState(restoredDraft?.processedReplyDraft ?? "");
  const [audioCaptureState, setAudioCaptureState] = useState<AudioCaptureState>({
    support: { supported: false, reason: "unknown" },
    permissionState: "unknown"
  });
  const [flowNotice, setFlowNotice] = useState<string>();
  const [captureMode, setCaptureMode] = useState<CaptureMode>("idle");
  const speechCaptureRef = useRef<BrowserSpeechCaptureController>();

  const activeFlow = demoFlows[activeFlowId];
  const latestRecord = useMemo(() => records[0], [records]);
  const runtimeStatus = getAgentRuntimeStatus({
    microphoneReady:
      audioCaptureState.support.supported && audioCaptureState.permissionState === "granted"
  });

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [activeTab, bridgeStep, displayMessage, recordsMode]);

  useEffect(() => {
    return () => {
      speechCaptureRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const activeCaptions = activeFlow.captions;

    if (!isCapturing || captureMode !== "fallback-demo") {
      return;
    }

    if (visibleCaptions.length >= activeCaptions.length) {
      const runId = replyRunIdRef.current;
      setIsCapturing(false);
      setAsrStatus("transcribing");

      const animatedTranscript = activeCaptions;
      const fallbackResult = runDemoAgent({ flow: activeFlow, transcript: animatedTranscript });

      void (async () => {
        try {
          await new Promise((resolve) => window.setTimeout(resolve, 520));

          const transcribeResponse = await transcribeSession({
            request: {
              sessionId: activeSession.id,
              flowId: activeFlowId,
              source: "fallback"
            },
            fallbackFlow: activeFlow
          });
          const transcript = transcribeResponse.transcript;
          if (replyRunIdRef.current !== runId) {
            return;
          }

          setVisibleCaptions(transcript);

          const response = await runSessionAgent({
            request: {
              sessionId: activeSession.id,
              flowId: activeFlowId,
              transcript,
              userMessage: displayMessage,
              round: activeSession.rounds.length + 1
            },
            fallbackFlow: activeFlow
          });
          if (replyRunIdRef.current !== runId) {
            return;
          }

          const result: AgentRunResult = {
            graphName: response.graphName,
            visitedNodes: response.visitedNodes as AgentRunResult["visitedNodes"],
            understanding: response.understanding
          };
          setAgentResult(result);
          setAgentProvider(response.provider);
          setAsrStatus("done");

          setActiveSession((prevSession) =>
            appendSessionRound({
              session: prevSession,
              prompt: displayMessage,
              transcript,
              agentResult: result,
              provider: response.provider
            })
          );
        } catch {
          if (replyRunIdRef.current !== runId) {
            return;
          }

          setAgentResult(fallbackResult);
          setAgentProvider("fallback");
          setAsrStatus("done");

          setActiveSession((prevSession) =>
            appendSessionRound({
              session: prevSession,
              prompt: displayMessage,
              transcript: animatedTranscript,
              agentResult: fallbackResult,
              provider: "fallback"
            })
          );
        }
      })();
      return;
    }

    const timer = window.setTimeout(() => {
      setVisibleCaptions((previousLines) => [...previousLines, activeCaptions[previousLines.length]]);
    }, 720);

    return () => window.clearTimeout(timer);
  }, [activeFlow, activeFlowId, activeSession, displayMessage, isCapturing, captureMode, visibleCaptions.length]);

  useEffect(() => {
    if (!justSavedRecordId) {
      return;
    }

    const timer = window.setTimeout(() => {
      setJustSavedRecordId(undefined);
    }, 2600);

    return () => window.clearTimeout(timer);
  }, [justSavedRecordId]);

  useEffect(() => {
    if (activeTab !== "bridge") {
      return;
    }

    saveBridgeProgressDraft({
      activeTab,
      bridgeStep,
      displayMessage,
      bridgeSourceLabel,
      activeFlowId,
      activeSession,
      visibleCaptions,
      asrStatus,
      agentResult,
      agentProvider,
      replyDraft,
      processedReplyDraft
    });
  }, [
    activeTab,
    bridgeStep,
    displayMessage,
    bridgeSourceLabel,
    activeFlowId,
    activeSession,
    visibleCaptions,
    asrStatus,
    agentResult,
    agentProvider,
    replyDraft,
    processedReplyDraft
  ]);

  const stopSpeechCapture = () => {
    speechCaptureRef.current?.abort();
    speechCaptureRef.current = undefined;
  };

  const resetReplyProgress = () => {
    stopSpeechCapture();
    setCaptureMode("idle");
    replyRunIdRef.current += 1;
    setVisibleCaptions([]);
    setIsCapturing(false);
    setAsrStatus("idle");
    setAgentResult(undefined);
    setAgentProvider("fallback");
    setProcessedReplyDraft("");
  };

  const openBridge = (
    message = defaultMessage,
    sourceLabel = "默认开场白",
    flowId: DemoFlowId = defaultFlowId
  ) => {
    clearBridgeProgressDraft();
    setFlowNotice(undefined);
    const nextSession = createCommunicationSession({ flowId, sourceLabel, prompt: message });
    setActiveSession(nextSession);
    setActiveFlowId(flowId);
    setDisplayMessage(message);
    setBridgeSourceLabel(sourceLabel);
    resetReplyProgress();
    setReplyDraft("");
    setBridgeStep("show");
    setActiveTab("bridge");
  };

  const openReplyComposer = () => {
    setBridgeStep("listen");
  };

  const backToShowStep = () => {
    stopSpeechCapture();
    setCaptureMode("idle");
    setIsCapturing(false);
    setAsrStatus((currentStatus) =>
      currentStatus === "done" || currentStatus === "error" ? currentStatus : "idle"
    );
    setBridgeStep("show");
  };

  const backToReplyInput = () => {
    stopSpeechCapture();
    setCaptureMode("idle");
    setIsCapturing(false);
    setBridgeStep("listen");
  };

  const beginReplyRun = () => {
    const runId = replyRunIdRef.current + 1;
    replyRunIdRef.current = runId;
    setVisibleCaptions([]);
    setAgentResult(undefined);
    setAgentProvider("fallback");
    setProcessedReplyDraft("");
    setBridgeStep("listen");

    return runId;
  };

  const startFallbackCaptionCapture = (notice?: string) => {
    beginReplyRun();
    stopSpeechCapture();
    setCaptureMode("fallback-demo");
    setIsCapturing(true);
    setAsrStatus("fallback");
    setBridgeStep("listen");
    setFlowNotice(notice);
  };

  const processReply = () => {
    const normalizedReply = normalizeUserText(replyDraft, "", 280);

    if (
      normalizedReply &&
      normalizedReply === processedReplyDraft &&
      visibleCaptions.length > 0 &&
      agentResult
    ) {
      setIsCapturing(false);
      setAsrStatus("done");
      setBridgeStep("listen");
      return;
    }

    if (!normalizedReply) {
      startFallbackCaptionCapture();
      return;
    }

    const runId = beginReplyRun();
    setIsCapturing(false);
    setAsrStatus("transcribing");

    void runManualReplyPipeline(normalizedReply, runId);
  };

  const runManualReplyPipeline = async (manualReply: string, runId: number) => {
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 360));

      const transcribeResponse = await transcribeSession({
        request: {
          sessionId: activeSession.id,
          flowId: activeFlowId,
          source: "manual",
          manualText: manualReply
        },
        fallbackFlow: activeFlow
      });

      const transcript = transcribeResponse.transcript;
      if (replyRunIdRef.current !== runId) {
        return;
      }

      setVisibleCaptions(transcript);

      const response = await runSessionAgent({
        request: {
          sessionId: activeSession.id,
          flowId: activeFlowId,
          transcript,
          userMessage: displayMessage,
          round: activeSession.rounds.length + 1
        },
        fallbackFlow: activeFlow
      });
      if (replyRunIdRef.current !== runId) {
        return;
      }

      const result: AgentRunResult = {
        graphName: response.graphName,
        visitedNodes: response.visitedNodes as AgentRunResult["visitedNodes"],
        understanding: response.understanding
      };

      setAgentResult(result);
      setAgentProvider(response.provider);
      setAsrStatus("done");
      setProcessedReplyDraft(manualReply);
      setActiveSession((prevSession) =>
        appendSessionRound({
          session: prevSession,
          prompt: displayMessage,
          transcript,
          agentResult: result,
          provider: transcribeResponse.provider
        })
      );
    } catch {
      if (replyRunIdRef.current !== runId) {
        return;
      }

      setAsrStatus("error");
      setFlowNotice("整理失败，可以修改回复后重新整理，或直接开始收听。");
    }
  };

  const runBrowserSpeechPipeline = async (recognizedText: string, runId: number) => {
    if (replyRunIdRef.current !== runId) {
      return;
    }

    const transcript = createBrowserSpeechTranscript({ text: recognizedText });

    if (transcript.length === 0) {
      setIsCapturing(false);
      setCaptureMode("idle");
      setAsrStatus("error");
      setFlowNotice("没有识别到清晰语音，可以重试、让对方打字，或切换演示转写。");
      return;
    }

    setIsCapturing(false);
    setCaptureMode("idle");
    setAsrStatus("transcribing");
    setVisibleCaptions(transcript);
    setReplyDraft(recognizedText);

    try {
      const response = await runSessionAgent({
        request: {
          sessionId: activeSession.id,
          flowId: activeFlowId,
          transcript,
          userMessage: displayMessage,
          round: activeSession.rounds.length + 1
        },
        fallbackFlow: activeFlow
      });

      if (replyRunIdRef.current !== runId) {
        return;
      }

      const result: AgentRunResult = {
        graphName: response.graphName,
        visitedNodes: response.visitedNodes as AgentRunResult["visitedNodes"],
        understanding: response.understanding
      };

      setAgentResult(result);
      setAgentProvider(response.provider);
      setAsrStatus("done");
      setProcessedReplyDraft(recognizedText);
      setActiveSession((prevSession) =>
        appendSessionRound({
          session: prevSession,
          prompt: displayMessage,
          transcript,
          agentResult: result,
          provider: "browser"
        })
      );
    } catch {
      if (replyRunIdRef.current !== runId) {
        return;
      }

      setAsrStatus("error");
      setFlowNotice("语音已经转成文字，但重点整理失败。可以点整理回复或重新收听。");
    }
  };

  const startBrowserSpeechCapture = (runId: number) => {
    const support = detectBrowserSpeechRecognition();
    if (!support.supported) {
      startFallbackCaptionCapture("当前浏览器不支持实时语音识别，已切到演示转写流。");
      return;
    }

    const controller = createBrowserSpeechCapture({
      onStart: () => {
        if (replyRunIdRef.current !== runId) {
          return;
        }

        setAsrStatus("listening");
        setIsCapturing(true);
        setCaptureMode("browser-speech");
        setFlowNotice("正在收听。请让对方正常说话，识别文字会出现在下方。");
      },
      onPartialText: (text) => {
        if (replyRunIdRef.current !== runId) {
          return;
        }

        setVisibleCaptions((prev) => {
          const finals = prev.filter((c) => !c.id.startsWith("browser-speech-partial-"));
          return [
            ...finals,
            {
              id: `browser-speech-partial-${runId}`,
              speaker: "对方",
              text,
              time: "正在说",
              important: false
            }
          ];
        });
      },
      onFinalText: (text) => {
        if (replyRunIdRef.current !== runId || !text.trim()) {
          return;
        }

        setVisibleCaptions((prev) => {
          const withoutPartial = prev.filter((c) => !c.id.startsWith("browser-speech-partial-"));
          return [
            ...withoutPartial,
            {
              id: `browser-speech-final-${runId}-${withoutPartial.length}`,
              speaker: "对方",
              text,
              time: "刚刚",
              important: true
            }
          ];
        });
      },
      onComplete: (text) => {
        if (replyRunIdRef.current !== runId) {
          return;
        }

        speechCaptureRef.current = undefined;

        if (!text.trim()) {
          setIsCapturing(false);
          setCaptureMode("idle");
          setAsrStatus("error");
          setFlowNotice("没有识别到清晰语音，可以重试、让对方打字，或切换演示转写。");
          return;
        }

        void runBrowserSpeechPipeline(text, runId);
      },
      onError: () => {
        if (replyRunIdRef.current !== runId) {
          return;
        }

        speechCaptureRef.current = undefined;
        startFallbackCaptionCapture("实时语音识别不稳定，已切到演示转写流，保证初赛现场能跑通。");
      }
    });

    if (!controller) {
      startFallbackCaptionCapture("当前浏览器不支持实时语音识别，已切到演示转写流。");
      return;
    }

    speechCaptureRef.current = controller;
    controller.start();
  };

  const handleReplyDraftChange = (value: string) => {
    const normalizedValue = normalizeUserText(value, "", 280);
    const shouldInvalidateResult =
      Boolean(agentResult) ||
      visibleCaptions.length > 0 ||
      asrStatus === "listening" ||
      asrStatus === "transcribing";

    setReplyDraft(value);

    if (normalizedValue === processedReplyDraft || !shouldInvalidateResult) {
      return;
    }

    resetReplyProgress();
  };

  const useDemoReply = () => {
    handleReplyDraftChange(activeFlow.captions.map((line) => line.text).join(" "));
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
    clearBridgeProgressDraft();
    const savedRecord = createRecordFromSession({ session: activeSession, flow: activeFlow });
    const nextRecords = [savedRecord, ...records];

    setRecords(nextRecords);
    persistRecords(nextRecords);
    setSelectedRecordId(savedRecord.id);
    setRecordsMode("detail");
    setJustSavedRecordId(savedRecord.id);
    resetReplyProgress();
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
    setRecordsMode("detail");
    setActiveTab("records");
  };

  const handleContinueRecord = (record: RecordItem) => {
    setActivePhraseId(undefined);
    setJustSavedRecordId(undefined);
    clearBridgeProgressDraft();

    const nextPrompt = record.nextStep.trim() || record.actionPhrase;
    const nextSession = createContinuationSession({ record, prompt: nextPrompt });

    setActiveSession(nextSession);
    setActiveFlowId(record.flowId);
    setDisplayMessage(nextPrompt);
    setBridgeSourceLabel(`${record.title} · 继续追问`);
    resetReplyProgress();
    setReplyDraft("");
    setFlowNotice(`正在基于「${record.title}」继续追问。`);
    setBridgeStep("show");
    setActiveTab("bridge");
  };

  const handleSelectRecord = (id: string) => {
    setSelectedRecordId(id);
    setRecordsMode("detail");
  };

  const handleTabChange = (tab: AppTab) => {
    if (tab === "records") {
      setRecordsMode("list");
    }

    setActiveTab(tab);
  };

  const handleUseMicrophone = async () => {
    setFlowNotice(undefined);
    stopSpeechCapture();
    const runId = beginReplyRun();
    setAsrStatus("requesting");
    setCaptureMode("browser-speech");

    const nextAudioState = await requestMicrophoneAccess();
    setAudioCaptureState(nextAudioState);

    if (replyRunIdRef.current !== runId) {
      return;
    }

    const canTryBrowserSpeech =
      nextAudioState.support.supported &&
      nextAudioState.support.mode === "speech-recognition" &&
      (nextAudioState.permissionState === "granted" || nextAudioState.permissionState === "prompt");

    if (!canTryBrowserSpeech) {
      startFallbackCaptionCapture("当前环境无法直接使用实时语音识别，已切到演示转写流，保证初赛现场能跑通。");
      return;
    }

    startBrowserSpeechCapture(runId);
  };

  const cancelCurrentRound = () => {
    stopSpeechCapture();
    setCaptureMode("idle");
    setFlowNotice("已取消本轮接收，可以回到上一步或重新输入。");
    resetReplyProgress();
    setReplyDraft("");
    setBridgeStep("show");
  };

  const startNewCommunication = () => {
    stopSpeechCapture();
    setCaptureMode("idle");
    setFlowNotice(undefined);
    setHomeMessageDraft(defaultMessage);
    openBridge(defaultMessage, "默认开场白", defaultFlowId);
  };

  const handleDeleteRecord = (id: string) => {
    const nextRecords = removeRecord(records, id, initialRecords);
    setRecords(nextRecords);
    persistRecords(nextRecords);
    setSelectedRecordId(pickNextRecordId(nextRecords, selectedRecordId) ?? initialRecords[0].id);
    setRecordsMode("list");
  };

  const handleResetRecords = () => {
    const nextRecords = resetRecords(initialRecords);
    setRecords(nextRecords);
    persistRecords(nextRecords);
    setSelectedRecordId(nextRecords[0].id);
    setRecordsMode("list");
  };

  const startFromHomeDraft = () => {
    const message = normalizeUserText(homeMessageDraft, defaultMessage);
    const flowId = inferFlowIdFromText(message);
    openBridge(message, "自由输入", flowId);
  };

  const renderActiveView = () => {
    if (activeTab === "home") {
      return (
        <HomeView
          latestRecord={latestRecord}
          messageDraft={homeMessageDraft}
          onMessageDraftChange={setHomeMessageDraft}
          onStart={startFromHomeDraft}
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
          agentProvider={agentProvider}
          replyDraft={replyDraft}
          flowNotice={flowNotice}
          runtimeStatus={runtimeStatus}
          onReplyDraftChange={handleReplyDraftChange}
          onUseDemoReply={useDemoReply}
          onUseMicrophone={handleUseMicrophone}
          onProcessReply={processReply}
          onCancelRound={cancelCurrentRound}
          onStartNew={startNewCommunication}
          onBackToShow={backToShowStep}
          onBackToReply={backToReplyInput}
          onStartListening={openReplyComposer}
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
          mode={recordsMode}
          justSavedRecordId={justSavedRecordId}
          onSelectRecord={handleSelectRecord}
          onBackToList={() => setRecordsMode("list")}
          onContinue={handleContinueRecord}
          onOpenHome={() => setActiveTab("home")}
          onDeleteRecord={handleDeleteRecord}
          onResetRecords={handleResetRecords}
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
        <BottomNav activeTab={activeTab} onChange={handleTabChange} />
      </div>
    </main>
  );
}
