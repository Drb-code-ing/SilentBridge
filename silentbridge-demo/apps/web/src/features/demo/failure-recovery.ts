export type FailureScenario = "asr-failed" | "agent-failed" | "microphone-denied" | "none";

export interface RecoveryOption {
  id: "retry-listen" | "manual-input" | "demo-captions" | "retry-agent" | "view-captions";
  label: string;
  hint: string;
}

export function inferFailureScenario(state: {
  asrStatus: string;
  agentResult: unknown;
  visibleCaptions: unknown[];
  permissionState: string;
}): FailureScenario {
  if (state.asrStatus !== "error") return "none";
  if (state.visibleCaptions.length > 0 && !state.agentResult) return "agent-failed";
  if (state.permissionState === "denied" && state.visibleCaptions.length === 0) return "microphone-denied";
  return "asr-failed";
}

export function getRecoveryOptions(scenario: FailureScenario): RecoveryOption[] {
  switch (scenario) {
    case "asr-failed":
      return [
        { id: "retry-listen", label: "重新收听", hint: "再试一次语音识别" },
        { id: "manual-input", label: "手动输入", hint: "让对方直接打字" },
        { id: "demo-captions", label: "演示字幕", hint: "用演示流程跑通" }
      ];
    case "agent-failed":
      return [
        { id: "retry-agent", label: "重新整理", hint: "再试一次 AI 整理" },
        { id: "view-captions", label: "查看字幕", hint: "字幕已识别，可手动整理" },
        { id: "manual-input", label: "手动输入", hint: "直接打字回复" }
      ];
    case "microphone-denied":
      return [
        { id: "manual-input", label: "手动输入", hint: "不需要麦克风" },
        { id: "demo-captions", label: "演示字幕", hint: "用演示流程跑通" }
      ];
    default:
      return [];
  }
}
