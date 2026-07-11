import type { AsrStatus } from "./asr-simulator";
import type { CaptureMode } from "./BridgeView";

export interface ListenControlState {
  label: string;
  action: "start" | "stop-recognize" | "stop-cancel" | "save" | "busy";
  disabled: boolean;
  showAbandon: boolean;
  showStopTwin: boolean;
}

/**
 * 听桥主按钮状态机。录音中必须走 stop-recognize，禁止误走 cancel。
 */
export function resolveListenPrimaryControl(input: {
  captionsDone: boolean;
  hasAgentResult: boolean;
  captureMode: CaptureMode;
  isCapturing: boolean;
  asrStatus: AsrStatus;
}): ListenControlState {
  const isRecording = input.captureMode === "recording" && input.isCapturing;
  const isDemoCapturing = input.captureMode === "fallback-demo" && input.isCapturing;
  const isBrowserCapturing = input.captureMode === "browser-speech" && input.isCapturing;
  const isRequesting = input.asrStatus === "requesting";
  const isTranscribing = input.asrStatus === "transcribing" && !input.isCapturing;

  if (input.captionsDone && input.hasAgentResult) {
    return {
      label: "保存这次重点",
      action: "save",
      disabled: false,
      showAbandon: false,
      showStopTwin: false
    };
  }

  // 录音中：只能「停止并识别」，不能 cancel 掉音频
  if (isRecording || (input.captureMode === "recording" && (isRequesting || input.asrStatus === "listening"))) {
    if (isRequesting && !input.isCapturing) {
      return {
        label: "取消请求",
        action: "stop-cancel",
        disabled: false,
        showAbandon: false,
        showStopTwin: false
      };
    }
    // 即使 isCapturing 暂时不同步，只要 captureMode=recording 且在 listening，也优先识别
    if (input.captureMode === "recording" && (input.isCapturing || input.asrStatus === "listening")) {
      return {
        label: "停止并识别",
        action: "stop-recognize",
        disabled: false,
        showAbandon: true,
        showStopTwin: false
      };
    }
  }

  if (isDemoCapturing || input.asrStatus === "fallback") {
    return {
      label: "停止演示",
      action: "stop-cancel",
      disabled: false,
      showAbandon: false,
      showStopTwin: true
    };
  }

  if (isBrowserCapturing || input.asrStatus === "listening") {
    return {
      label: "停止收听",
      action: "stop-cancel",
      disabled: false,
      showAbandon: false,
      showStopTwin: true
    };
  }

  if (isTranscribing) {
    return {
      label: "取消整理",
      action: "stop-cancel",
      disabled: false,
      showAbandon: false,
      showStopTwin: true
    };
  }

  if (input.asrStatus === "error") {
    return {
      label: "重新收听",
      action: "start",
      disabled: false,
      showAbandon: false,
      showStopTwin: false
    };
  }

  if (input.captionsDone && !input.hasAgentResult) {
    return {
      label: "整理中...",
      action: "busy",
      disabled: true,
      showAbandon: true,
      showStopTwin: false
    };
  }

  return {
    label: "开始收听",
    action: "start",
    disabled: false,
    showAbandon: false,
    showStopTwin: false
  };
}
