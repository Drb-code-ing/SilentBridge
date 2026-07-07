import { useEffect, useMemo, useRef, useState } from "react";
import {
  defaultFlowId,
  defaultMessage,
  demoFlows,
  initialRecords,
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
import { transcribeSession, transcribeAudio } from "./asr-client";
import { AudioRecorder } from "./audio-recorder";
import { runSessionAgent } from "./agent-client";
import { applyCaptionCorrection } from "./caption-correction";
import { AppTopBar } from "./AppTopBar";
import { BottomNav } from "./BottomNav";
import { PhrasesView } from "./PhrasesView";
import { HomeView } from "./HomeView";
import { RecordsView, type RecordsMode } from "./RecordsView";
import { BridgeView, type CaptureMode } from "./BridgeView";
import { type RecoveryOption } from "./failure-recovery";
import {
  appendSessionRound,
  createCommunicationSession,
  createContinuationSession,
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
import { requestMicrophoneAccess, type AudioCaptureState } from "./audio-capture-client";
import { getAgentRuntimeStatus } from "./agent-runtime-config";
import { pickNextRecordId, removeRecord, resetRecords } from "./record-actions";
import {
  type BrowserSpeechCaptureController
} from "./browser-speech-client";

export function DemoPage({ onBackHome }: { onBackHome?: () => void } = {}) {
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
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const speechCaptureRef = useRef<BrowserSpeechCaptureController>();
  const audioRecorderRef = useRef<AudioRecorder | null>(null);

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
    if (captureMode !== "recording" || !isCapturing) {
      return;
    }
    setRecordingSeconds(0);
    const timer = window.setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
    return () => {
      window.clearInterval(timer);
    };
  }, [captureMode, isCapturing]);

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

          if (response.correctedText && visibleCaptions.length > 0) {
            const latestId = visibleCaptions[visibleCaptions.length - 1].id;
            setVisibleCaptions((prev) => applyCaptionCorrection(prev, response.correctedText, latestId));
          }

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
    if (audioRecorderRef.current) {
      audioRecorderRef.current.cancel();
      audioRecorderRef.current = null;
    }
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
    replyRunIdRef.current += 1;
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

  const notifySpeechError = (notice: string) => {
    beginReplyRun();
    stopSpeechCapture();
    setCaptureMode("idle");
    setIsCapturing(false);
    setAsrStatus("error");
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
      notifySpeechError("请先在下方输入对方说的话，或点击「开始收听」用麦克风识别。");
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

      if (response.correctedText && visibleCaptions.length > 0) {
        const latestId = visibleCaptions[visibleCaptions.length - 1].id;
        setVisibleCaptions((prev) => applyCaptionCorrection(prev, response.correctedText, latestId));
      }

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
    setCaptureMode("recording");

    try {
      const nextAudioState = await requestMicrophoneAccess();
      setAudioCaptureState(nextAudioState);

      if (replyRunIdRef.current !== runId) {
        return;
      }

      const canRecord =
        nextAudioState.support.supported &&
        (nextAudioState.permissionState === "granted" || nextAudioState.permissionState === "prompt");

      if (!canRecord) {
        notifySpeechError("当前环境无法使用麦克风录音（未授权或不支持）。请点击地址栏左侧的锁图标允许麦克风，或直接在下方手动输入对方说的话。");
        return;
      }

      const recorder = new AudioRecorder();
      await recorder.start();
      audioRecorderRef.current = recorder;
      setAsrStatus("listening");
      setIsCapturing(true);
      setCaptureMode("recording");
      setFlowNotice("正在录音。请让对方说完话后，点击「停止并识别」。");
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown";
      notifySpeechError(`无法启动录音（${message}）。请检查麦克风权限，或直接在下方手动输入对方说的话。`);
    }
  };

  const handleStopRecording = async () => {
    console.log("[DemoPage] handleStopRecording called");
    const recorder = audioRecorderRef.current;
    console.log("[DemoPage] recorder:", !!recorder, "isRecording:", recorder?.isRecording());
    if (!recorder || !recorder.isRecording()) {
      console.log("[DemoPage] early return: recorder null or not recording");
      return;
    }

    const runId = replyRunIdRef.current;
    console.log("[DemoPage] calling recorder.stop()...");
    const result = await recorder.stop();
    console.log("[DemoPage] recorder.stop() returned:", !!result);
    audioRecorderRef.current = null;
    setIsCapturing(false);

    if (!result) {
      setCaptureMode("idle");
      setAsrStatus("error");
      setFlowNotice("录音失败，请重试或手动输入。");
      return;
    }

    setCaptureMode("idle");
    setAsrStatus("transcribing");
    setFlowNotice("正在识别语音，请稍候...");

    const asrResult = await transcribeAudio({
      sessionId: activeSession.id,
      flowId: activeFlowId,
      audioBase64: result.base64,
      audioLength: result.length,
    });

    if (replyRunIdRef.current !== runId) {
      return;
    }

    if (!asrResult.ok) {
      setAsrStatus("error");
      setFlowNotice(`语音识别失败：${asrResult.error}。请重试或手动输入对方说的话。`);
      return;
    }

    const transcript = asrResult.transcript;
    if (transcript.length === 0) {
      setAsrStatus("error");
      setFlowNotice("没有识别到清晰语音。请重试或手动输入对方说的话。");
      return;
    }

    setAsrStatus("transcribing");
    setVisibleCaptions(transcript);
    const recognizedText = transcript.map((line) => line.text).join(" ").trim();
    setReplyDraft(recognizedText);
    setFlowNotice(undefined);

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

      const agentRunResult: AgentRunResult = {
        graphName: response.graphName,
        visitedNodes: response.visitedNodes as AgentRunResult["visitedNodes"],
        understanding: response.understanding
      };

      setAgentResult(agentRunResult);
      setAgentProvider(response.provider);
      setAsrStatus("done");
      setProcessedReplyDraft(recognizedText);

      if (response.correctedText && visibleCaptions.length > 0) {
        const latestId = visibleCaptions[visibleCaptions.length - 1].id;
        setVisibleCaptions((prev) => applyCaptionCorrection(prev, response.correctedText, latestId));
      }

      setActiveSession((prevSession) =>
        appendSessionRound({
          session: prevSession,
          prompt: displayMessage,
          transcript,
          agentResult: agentRunResult,
          provider: "browser"
        })
      );
    } catch {
      if (replyRunIdRef.current !== runId) {
        return;
      }

      setAsrStatus("error");
      setFlowNotice("语音已转成文字，但 AI 整理失败。可以点整理回复或重新收听。");
    }
  };

  const retryAgentForCurrentTranscript = async () => {
    if (visibleCaptions.length === 0) return;
    const runId = beginReplyRun();
    setAsrStatus("transcribing");
    setFlowNotice("正在重新整理...");

    try {
      const response = await runSessionAgent({
        request: {
          sessionId: activeSession.id,
          flowId: activeFlowId,
          transcript: visibleCaptions,
          userMessage: displayMessage,
          round: activeSession.rounds.length + 1
        },
        fallbackFlow: activeFlow
      });

      if (replyRunIdRef.current !== runId) return;

      const agentRunResult: AgentRunResult = {
        graphName: response.graphName,
        visitedNodes: response.visitedNodes as AgentRunResult["visitedNodes"],
        understanding: response.understanding
      };

      setAgentResult(agentRunResult);
      setAgentProvider(response.provider);
      setAsrStatus("done");
      const recognizedText = visibleCaptions.map((line) => line.text).join(" ").trim();
      setProcessedReplyDraft(recognizedText);

      if (response.correctedText && visibleCaptions.length > 0) {
        const latestId = visibleCaptions[visibleCaptions.length - 1].id;
        setVisibleCaptions((prev) => applyCaptionCorrection(prev, response.correctedText!, latestId));
      }

      setActiveSession((prevSession) =>
        appendSessionRound({
          session: prevSession,
          prompt: displayMessage,
          transcript: visibleCaptions,
          agentResult: agentRunResult,
          provider: "browser"
        })
      );
      setFlowNotice(undefined);
    } catch {
      if (replyRunIdRef.current !== runId) return;
      setAsrStatus("error");
      setFlowNotice("AI 整理仍然失败。可以点「查看字幕」手动整理，或重新收听。");
    }
  };

  const handleRecoveryAction = (optionId: RecoveryOption["id"]) => {
    switch (optionId) {
      case "retry-listen":
        void handleUseMicrophone();
        break;
      case "manual-input":
        setFlowNotice("请在下方备用输入框输入对方说的话。");
        break;
      case "demo-captions":
        startFallbackCaptionCapture("已切到演示字幕模式。这只是演示用预设内容，真实使用时请用麦克风识别或手动输入。");
        break;
      case "retry-agent":
        void retryAgentForCurrentTranscript();
        break;
      case "view-captions":
        setAsrStatus("done");
        setFlowNotice("字幕已保留，可手动整理后点「整理回复」。");
        break;
    }
  };

  const cancelCurrentRound = () => {
    replyRunIdRef.current += 1;
    stopSpeechCapture();
    setCaptureMode("idle");
    setIsCapturing(false);
    setAsrStatus("idle");
    setFlowNotice("已停止收听，可以重新收听，或让对方直接打字。");
    setBridgeStep("listen");
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
          onStopRecording={handleStopRecording}
          captureMode={captureMode}
          recordingSeconds={recordingSeconds}
          onProcessReply={processReply}
          onStopListening={cancelCurrentRound}
          onStartNew={startNewCommunication}
          onBackToShow={backToShowStep}
          onBackToReply={backToReplyInput}
          onStartListening={openReplyComposer}
          onSave={saveCurrentRecord}
          onConfirmQuestion={handleConfirmQuestion}
          onOpenPhrases={() => setActiveTab("phrases")}
          onStartFallbackDemo={() => startFallbackCaptionCapture("已切到演示字幕模式。这只是演示用预设内容，真实使用时请用麦克风识别或手动输入。")}
          permissionState={audioCaptureState.permissionState}
          onRecoveryAction={handleRecoveryAction}
          audioCaptureFailureReason={
            !audioCaptureState.support.supported
              ? audioCaptureState.support.reason
              : undefined
          }
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
        <AppTopBar activeTab={activeTab} onGoHome={() => (onBackHome ? onBackHome() : setActiveTab("home"))} />
        <section className="sb-app-content" ref={contentRef}>{renderActiveView()}</section>
        <BottomNav activeTab={activeTab} onChange={handleTabChange} />
      </div>
    </main>
  );
}
