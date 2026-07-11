import { useEffect, useRef, useState } from "react";
import type { BridgeStep, CaptionLine } from "./demo-content";
import type { AsrStatus } from "./asr-simulator";
import type { AgentRunResult } from "./agent-graph";
import type { AgentRuntimeStatus } from "./agent-runtime-config";
import { formatRecordingDuration } from "./recording-timer";
import { isAgentLoading } from "./agent-loading-state";
import { AgentLoadingCard } from "./AgentLoadingCard";
import { inferFailureScenario, getRecoveryOptions, type RecoveryOption } from "./failure-recovery";
import { getPermissionGuide } from "./microphone-permission-guide";
import type { AudioCaptureFailureReason } from "./audio-capture-client";
import { ProgressDots } from "./ProgressDots";
import { DisplayCard } from "./DisplayCard";
import { CaptionPanel } from "./CaptionPanel";
import { AgentInsightCard } from "./AgentInsightCard";
import { RoundTimeline } from "./RoundTimeline";
import type { SessionRound } from "./session-types";

export type CaptureMode = "idle" | "fallback-demo" | "browser-speech" | "recording";

export function BridgeView({
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
  onStopRecording,
  onProcessReply,
  onStopListening,
  onStartNew,
  onBackToShow,
  onBackToReply,
  onStartListening,
  onSave,
  onConfirmQuestion,
  onOpenPhrases,
  onStartFallbackDemo,
  captureMode,
  recordingSeconds,
  permissionState,
  onRecoveryAction,
  audioCaptureFailureReason,
  displayFullscreen = false,
  onToggleDisplayFullscreen,
  isJudgeDemo = false,
  onSkipJudgeDemo,
  sessionRounds = []
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
  onStopRecording: () => void;
  onProcessReply: () => void;
  onStopListening: () => void;
  onStartNew: () => void;
  onBackToShow: () => void;
  onBackToReply: () => void;
  onStartListening: () => void;
  onSave: () => void;
  onConfirmQuestion: () => void;
  onOpenPhrases: () => void;
  onStartFallbackDemo: () => void;
  captureMode: CaptureMode;
  recordingSeconds: number;
  permissionState: string;
  onRecoveryAction: (optionId: RecoveryOption["id"]) => void;
  audioCaptureFailureReason?: AudioCaptureFailureReason;
  displayFullscreen?: boolean;
  onToggleDisplayFullscreen?: () => void;
  isJudgeDemo?: boolean;
  onSkipJudgeDemo?: () => void;
  sessionRounds?: SessionRound[];
}) {
  const [showBackupInput, setShowBackupInput] = useState(false);
  const agentCardRef = useRef<HTMLDivElement>(null);

  const failureScenario = inferFailureScenario({
    asrStatus,
    agentResult,
    visibleCaptions,
    permissionState
  });
  const recoveryOptions = getRecoveryOptions(failureScenario);
  const hasRecoveryOptions = recoveryOptions.length > 0;
  const permissionGuide =
    failureScenario === "microphone-denied" && audioCaptureFailureReason
      ? getPermissionGuide(audioCaptureFailureReason)
      : null;

  const captionsDone =
    !isCapturing &&
    visibleCaptions.length > 0 &&
    (Boolean(agentResult) || visibleCaptions.length >= expectedCaptionCount);

  useEffect(() => {
    if (!agentResult) {
      return;
    }
    const timer = window.setTimeout(() => {
      agentCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 180);
    return () => window.clearTimeout(timer);
  }, [agentResult]);

  useEffect(() => {
    if (failureScenario !== "none") {
      setShowBackupInput(true);
    }
  }, [failureScenario]);

  const listenCopy: Record<AsrStatus, { title: string; helper: string; primary: string }> = {
    idle: {
      title: "准备收听",
      helper: "点击后开始收听；如果识别不到，会提醒你让对方说清楚或手动输入。",
      primary: "开始收听"
    },
    requesting: {
      title: "正在请求麦克风",
      helper: "允许麦克风后，就可以把对方的话转成文字。",
      primary: "请求中..."
    },
    listening: {
      title: "正在收听对方说话",
      helper: "请把手机靠近对方。说完后点下方「停止收听」。",
      primary: "停止收听"
    },
    transcribing: {
      title: "正在整理文字",
      helper: "正在把识别结果整理成重点，可取消本轮。",
      primary: "取消整理"
    },
    done: {
      title: "已经整理成文字",
      helper: "字幕和重点已经生成，可以保存或继续追问。",
      primary: "保存这次重点"
    },
    fallback: {
      title: "演示字幕生成中",
      helper: "正在用演示字幕跑通流程，可随时停止。",
      primary: "停止演示"
    },
    error: {
      title: "没有识别到清晰语音",
      helper: "可以重新收听，或让对方打字。也可使用演示字幕。",
      primary: "重新收听"
    }
  };

  const activeListenCopy = captionsDone ? listenCopy.done : listenCopy[asrStatus];
  const isRecording = captureMode === "recording" && isCapturing;
  const isDemoCapturing = isCapturing && captureMode === "fallback-demo";
  const isBrowserCapturing = isCapturing && captureMode === "browser-speech";
  const isLiveCapture = isRecording || isDemoCapturing || isBrowserCapturing;
  const isTranscribing = asrStatus === "transcribing" && !isLiveCapture;
  const isRequestingMic = asrStatus === "requesting";
  // 收听中必须始终有明确停止边界（主按钮），不能只剩小工具条
  const canStopListening =
    isLiveCapture || isRequestingMic || asrStatus === "listening" || asrStatus === "fallback";

  const listenTitle = isRecording
    ? "正在录音"
    : isDemoCapturing
      ? "演示字幕生成中"
      : isBrowserCapturing || asrStatus === "listening"
        ? "正在收听"
        : isTranscribing
          ? "正在识别语音"
          : isRequestingMic
            ? "正在请求麦克风"
            : activeListenCopy.title;

  const listenHelper = isRecording
    ? "对方说完后点「停止并识别」。也可以随时停止，再改用手动输入。"
    : isDemoCapturing
      ? "正在逐条生成演示字幕。可随时点「停止」中断。"
      : isBrowserCapturing || asrStatus === "listening"
        ? "请把手机靠近对方。说完后点「停止收听」。"
        : isTranscribing
          ? "正在整理文字。可点「取消」中断本轮。"
          : isRequestingMic
            ? "请在浏览器弹窗中允许麦克风；也可取消后改用手动输入。"
            : activeListenCopy.helper;

  let primaryListenLabel = activeListenCopy.primary;
  let primaryListenAction: () => void = onUseMicrophone;
  let primaryDisabled = false;

  if (captionsDone && agentResult) {
    primaryListenLabel = "保存这次重点";
    primaryListenAction = onSave;
  } else if (isRecording) {
    primaryListenLabel = "停止并识别";
    primaryListenAction = onStopRecording;
  } else if (canStopListening) {
    primaryListenLabel = isDemoCapturing ? "停止演示" : "停止收听";
    primaryListenAction = onStopListening;
  } else if (isTranscribing) {
    primaryListenLabel = "取消整理";
    primaryListenAction = onStopListening;
  } else if (asrStatus === "error") {
    primaryListenLabel = "重新收听";
    primaryListenAction = onUseMicrophone;
  } else if (!captionsDone) {
    primaryListenLabel = "开始收听";
    primaryListenAction = onUseMicrophone;
  } else {
    // 有字幕但 AI 还没出结果
    primaryListenLabel = "整理中...";
    primaryListenAction = onStopListening;
    primaryDisabled = !agentResult;
  }

  if (displayFullscreen) {
    return (
      <div className="sb-view">
        <DisplayCard
          message={message}
          fullscreen
          onToggleFullscreen={onToggleDisplayFullscreen}
        />
      </div>
    );
  }

  return (
    <div className="sb-view">
      <section className="sb-bridge-head">
        <p className="sb-kicker">沟通中</p>
        <h1>{step === "show" ? "出示给对方" : "收听并整理"}</h1>
        <p className="sb-bridge-source">{sourceLabel}</p>
      </section>

      <ProgressDots step={step} hasUnderstanding={Boolean(agentResult)} />

      {isJudgeDemo && (
        <div className="sb-judge-banner" role="status">
          <div>
            <span>示例流程</span>
            <strong>自动演示中，可随时停止或自己操作</strong>
          </div>
          {onSkipJudgeDemo && (
            <button type="button" className="sb-judge-skip" onClick={onSkipJudgeDemo}>
              改为手动
            </button>
          )}
        </div>
      )}

      {flowNotice && <div className="sb-flow-notice">{flowNotice}</div>}
      {(sourceLabel.includes("继续追问") || sourceLabel.includes("当场追问")) && (
        <div className="sb-continuation-hint">
          {sourceLabel.includes("当场追问")
            ? "仍在同一场沟通里继续确认，不用重新开场。"
            : "这次会接着上一条记录问，不用重新解释。"}
        </div>
      )}

      {sessionRounds.length > 0 && <RoundTimeline rounds={sessionRounds} />}

      {step === "show" && (
        <section className="sb-bridge-stage">
          <DisplayCard
            message={message}
            onToggleFullscreen={onToggleDisplayFullscreen}
          />
          <div className="sb-bridge-actions sb-bridge-actions--show">
            <button type="button" className="sb-primary-button" onClick={onStartListening}>
              对方看完了，开始收听
            </button>
            {sessionRounds.length > 0 && (
              <button type="button" className="sb-secondary-button" onClick={onSave}>
                先保存已整理的重点
              </button>
            )}
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
          <section className={`sb-listen-console sb-listen-console--${asrStatus}${isRecording ? " sb-listen-console--recording" : ""}`}>
            <div className={`sb-listen-orb${isRecording ? " sb-listen-orb--recording" : ""}`} aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className="sb-listen-copy">
              <span>{listenTitle}</span>
              <strong>对方说的话，会变成清楚字幕。</strong>
              <p>{listenHelper}</p>
              {isRecording && (
                <div className="sb-recording-timer" role="timer" aria-live="off">
                  <span className="sb-recording-dot" aria-hidden="true" />
                  <span>{formatRecordingDuration(recordingSeconds)}</span>
                </div>
              )}
            </div>
          </section>
          <div className="sb-bridge-actions sb-bridge-actions--listen">
            <button
              type="button"
              className={
                canStopListening || isTranscribing
                  ? "sb-primary-button sb-primary-button--stop"
                  : "sb-primary-button"
              }
              onClick={primaryListenAction}
              disabled={primaryDisabled}
              aria-live="polite"
            >
              {primaryListenLabel}
            </button>
            <div className="sb-bridge-toolstrip" aria-label="听桥操作">
              <button
                type="button"
                className="sb-tool-button"
                onClick={captionsDone ? onBackToReply : onBackToShow}
                disabled={isLiveCapture || isRequestingMic}
              >
                <span>←</span>
                <strong>{captionsDone ? "改文字" : "上一步"}</strong>
              </button>
              {(asrStatus === "error" || asrStatus === "idle") && visibleCaptions.length === 0 && !isLiveCapture && (
                <button type="button" className="sb-tool-button" onClick={onStartFallbackDemo}>
                  <span>演</span>
                  <strong>演示字幕</strong>
                </button>
              )}
              {(canStopListening || isTranscribing) && (
                <button type="button" className="sb-tool-button sb-tool-button--danger" onClick={onStopListening}>
                  <span>■</span>
                  <strong>停止</strong>
                </button>
              )}
              {!isLiveCapture && !isTranscribing && !isRequestingMic && (
                <button type="button" className="sb-tool-button" onClick={onStartNew}>
                  <span>新</span>
                  <strong>新沟通</strong>
                </button>
              )}
            </div>
          </div>
          <CaptionPanel visibleCaptions={visibleCaptions} isCapturing={isCapturing} />
          {permissionGuide && (
            <section className="sb-permission-guide" aria-label="麦克风权限引导">
              <div className="sb-panel-head">
                <span>麦克风问题</span>
                <strong>{permissionGuide.title}</strong>
              </div>
              <ol className="sb-permission-steps">
                {permissionGuide.steps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
              <p className="sb-permission-fallback">{permissionGuide.fallbackHint}</p>
            </section>
          )}
          {hasRecoveryOptions && (
            <section className="sb-recovery-options" aria-label="恢复选项">
              <span>出错了，可以这样做</span>
              {recoveryOptions.map((option) => (
                <button
                  type="button"
                  key={option.id}
                  className="sb-recovery-option"
                  onClick={() => onRecoveryAction(option.id)}
                >
                  <strong>{option.label}</strong>
                  <small>{option.hint}</small>
                </button>
              ))}
            </section>
          )}
          {captionsDone && agentResult && (
            <div ref={agentCardRef}>
              <AgentInsightCard result={agentResult} provider={agentProvider} onConfirmQuestion={onConfirmQuestion} />
            </div>
          )}
          {isAgentLoading({ asrStatus, visibleCaptions, agentResult }) && (
            <AgentLoadingCard />
          )}
          {captionsDone && !agentResult && (
            <div className="sb-summary-card">
              <span>小桥抓到的重点</span>
              <strong>{summaryHighlight}</strong>
            </div>
          )}
          {captionsDone && agentResult && (
            <div className="sb-next-cta-card">
              <span>可继续</span>
              <strong>保存本轮，或让对方确认还缺的信息。</strong>
              <button type="button" className="sb-primary-button" onClick={onSave}>
                保存这次重点
              </button>
            </div>
          )}

          {!isJudgeDemo && (
            <section className="sb-input-card sb-input-card--reply">
              <div className="sb-input-card__head">
                <span>备用输入</span>
                <button
                  type="button"
                  className="sb-step-back-button"
                  onClick={() => setShowBackupInput((value) => !value)}
                >
                  <strong>{showBackupInput ? "收起" : "打不开麦克风时"}</strong>
                </button>
              </div>
              {showBackupInput && (
                <>
                  <p className="sb-input-card__hint">环境太吵或识别失败时，让对方打字，或请同行者输入。</p>
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
                </>
              )}
            </section>
          )}

          {!isJudgeDemo && (
            <aside className="sb-safety-strip">
              <span>沟通辅助说明</span>
              <p>{runtimeStatus.privacyNote}</p>
              <div className="sb-runtime-tags">
                <span>{agentProvider === "proxy" ? "AI 实时整理" : "离线整理可用"}</span>
                <span>{runtimeStatus.asrMode === "browser-ready" ? "麦克风已授权" : "手动输入兜底"}</span>
                <span>不会在前端保存密钥</span>
              </div>
            </aside>
          )}
        </section>
      )}
    </div>
  );
}
