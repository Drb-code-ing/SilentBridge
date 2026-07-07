export type AsrStatus =
  | "idle"
  | "requesting"
  | "listening"
  | "transcribing"
  | "done"
  | "fallback"
  | "error";

export interface AsrStateLabel {
  title: string;
  helper: string;
}

export const asrStateLabels: Record<AsrStatus, AsrStateLabel> = {
  idle: {
    title: "等待对方说话",
    helper: "把手机递给对方，点击后开始识别。"
  },
  requesting: {
    title: "正在请求麦克风",
    helper: "浏览器会询问是否允许使用麦克风。"
  },
  listening: {
    title: "正在听对方说",
    helper: "语音会尽量实时转成文字，先不用急着确认。"
  },
  transcribing: {
    title: "正在整理文字",
    helper: "小桥会把识别到的话整理成重点。"
  },
  done: {
    title: "识别完成",
    helper: "下面是小桥理解到的重点。"
  },
  fallback: {
    title: "已切到演示转写",
    helper: "当前环境无法稳定识别语音，正在使用初赛演示字幕保证流程跑通。"
  },
  error: {
    title: "没有识别到清晰语音",
    helper: "可以重试、让对方打字，或使用演示转写。"
  }
};

export function supportsBrowserSpeechRecognition() {
  if (typeof window === "undefined") {
    return false;
  }

  return "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
}
