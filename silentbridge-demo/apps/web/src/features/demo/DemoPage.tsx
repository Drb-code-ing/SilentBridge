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
import { transcribeSession } from "./asr-client";
import { runSessionAgent } from "./agent-client";
import {
  appendSessionRound,
  createCommunicationSession,
  createRecordFromSession,
  loadStoredRecords,
  persistRecords
} from "./session-store";
import type { CommunicationSession } from "./session-types";
import { inferFlowIdFromText, normalizeUserText } from "./real-input-engine";
import {
  clearBridgeProgressDraft,
  loadBridgeProgressDraft,
  saveBridgeProgressDraft
} from "./bridge-progress-store";

type RecordsMode = "list" | "detail";

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
        <label className="sb-input-card">
          <span>我想让对方先看到</span>
          <textarea
            value={messageDraft}
            onChange={(event) => onMessageDraftChange(event.target.value)}
            maxLength={120}
            rows={3}
          />
        </label>
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
        <strong>Agent: {result.graphName}</strong>
      </div>
      <div className="sb-agent-provider">
        来源：{provider === "proxy" ? "后端代理" : "本地兜底"}
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
  onReplyDraftChange,
  onUseDemoReply,
  onProcessReply,
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
  onReplyDraftChange: (value: string) => void;
  onUseDemoReply: () => void;
  onProcessReply: () => void;
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
              开始接收回复
            </button>
            <button type="button" className="sb-secondary-button" onClick={onOpenPhrases}>
              换一句开场白
            </button>
          </div>
        </section>
      )}

      {step === "listen" && (
        <section className="sb-bridge-stage">
          <section className="sb-input-card sb-input-card--reply">
            <div className="sb-input-card__head">
              <span>请对方回复</span>
              <button type="button" className="sb-text-button" onClick={onBackToShow}>
                返回上一步
              </button>
            </div>
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
            <button type="button" className="sb-text-button" onClick={onUseDemoReply}>
              填入演示回复
            </button>
            <button type="button" className="sb-text-button sb-text-button--primary" onClick={onProcessReply}>
              整理这段回复
            </button>
          </section>
          <AsrStatusPanel status={asrStatus} />
          <CaptionPanel visibleCaptions={visibleCaptions} isCapturing={isCapturing} />
          {captionsDone && (
            <div className="sb-summary-card">
              <span>小桥抓到的重点</span>
              <strong>{summaryHighlight}</strong>
            </div>
          )}
          {captionsDone && (
            <AgentInsightCard result={agentResult} provider={agentProvider} onConfirmQuestion={onConfirmQuestion} />
          )}
          <div className="sb-bridge-actions">
            {captionsDone && (
              <button type="button" className="sb-secondary-button" onClick={onBackToReply}>
                返回修改回复
              </button>
            )}
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
  mode,
  justSavedRecordId,
  onSelectRecord,
  onBackToList,
  onContinue,
  onOpenHome
}: {
  records: RecordItem[];
  selectedRecordId: string;
  mode: RecordsMode;
  justSavedRecordId?: string;
  onSelectRecord: (id: string) => void;
  onBackToList: () => void;
  onContinue: (record: RecordItem) => void;
  onOpenHome: () => void;
}) {
  const selectedRecord = records.find((record) => record.id === selectedRecordId) ?? records[0];
  const showSavedNote = Boolean(justSavedRecordId && justSavedRecordId === selectedRecord.id);

  if (mode === "list") {
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
      </div>
    );
  }

  return (
    <div className="sb-view sb-record-detail-view">
      <section className="sb-record-detail-head">
        <button type="button" className="sb-text-button" onClick={onBackToList}>
          返回记录列表
        </button>
        <span>{selectedRecord.time}</span>
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

  const activeFlow = demoFlows[activeFlowId];
  const latestRecord = useMemo(() => records[0], [records]);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [activeTab, bridgeStep, displayMessage, recordsMode]);

  useEffect(() => {
    const activeCaptions = activeFlow.captions;

    if (!isCapturing) {
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
  }, [activeFlow, activeFlowId, activeSession, displayMessage, isCapturing, visibleCaptions.length]);

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

  const resetReplyProgress = () => {
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
    setIsCapturing(false);
    setAsrStatus((currentStatus) => (currentStatus === "listening" ? "idle" : currentStatus));
    setBridgeStep("show");
  };

  const backToReplyInput = () => {
    setIsCapturing(false);
    setBridgeStep("listen");
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

    const runId = replyRunIdRef.current + 1;
    replyRunIdRef.current = runId;
    setVisibleCaptions([]);
    setAgentResult(undefined);
    setAgentProvider("fallback");
    setProcessedReplyDraft("");
    setAsrStatus("listening");
    setBridgeStep("listen");

    if (!normalizedReply) {
      setIsCapturing(true);
      return;
    }

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

      setAsrStatus("done");
    }
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
    openBridge(record.actionPhrase, record.title, record.flowId);
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
          onReplyDraftChange={handleReplyDraftChange}
          onUseDemoReply={useDemoReply}
          onProcessReply={processReply}
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
