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
  audioCaptureFailureReason
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
}) {
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
      helper: "可以重试、让对方打字。如果只想看演示流程，可点「演示字幕」。",
      primary: "重新收听"
    }
  };

  const activeListenCopy = captionsDone ? listenCopy.done : listenCopy[asrStatus];
  const isRecording = captureMode === "recording" && isCapturing;
  const isTranscribing = asrStatus === "transcribing" && !isRecording;
  const listenTitle = isRecording
    ? "正在录音"
    : isTranscribing
      ? "正在识别语音"
      : activeListenCopy.title;
  const listenHelper = isRecording
    ? "请让对方说完话后，点击「停止并识别」结束录音并发送到百度语音识别。"
    : isTranscribing
      ? "正在将录音发送到百度语音识别，请稍候..."
      : activeListenCopy.helper;
  const primaryListenLabel = captionsDone
    ? listenCopy.done.primary
    : isRecording
      ? "停止并识别"
      : activeListenCopy.primary;
  const primaryListenAction = captionsDone ? onSave : isRecording ? onStopRecording : onUseMicrophone;

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
              className="sb-primary-button"
              onClick={primaryListenAction}
              disabled={
                asrStatus === "requesting" ||
                asrStatus === "transcribing" ||
                (isCapturing && captureMode !== "recording") ||
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
              {asrStatus === "error" && visibleCaptions.length === 0 && (
                <button type="button" className="sb-tool-button" onClick={onStartFallbackDemo}>
                  <span>演</span>
                  <strong>演示字幕</strong>
                </button>
              )}
              <button type="button" className="sb-tool-button" onClick={isCapturing ? onStopListening : onStartNew}>
                <span>{isCapturing ? "停" : "新"}</span>
                <strong>{isCapturing ? "停止" : "新沟通"}</strong>
              </button>
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
          {captionsDone && agentResult && (
            <AgentInsightCard result={agentResult} provider={agentProvider} onConfirmQuestion={onConfirmQuestion} />
          )}
          {isAgentLoading({ asrStatus, visibleCaptions, agentResult }) && (
            <AgentLoadingCard />
          )}
          <aside className="sb-safety-strip">
            <span>AI 模式</span>
            <p>{runtimeStatus.privacyNote}</p>
            <div className="sb-runtime-tags">
              <span>{agentProvider === "proxy" ? "GLM-4 实时整理" : "本地规则整理"}</span>
              <span>{runtimeStatus.asrMode === "browser-ready" ? "麦克风已授权" : "手动输入兜底"}</span>
              <span>不会在前端保存密钥</span>
            </div>
          </aside>
        </section>
      )}
    </div>
  );
}
