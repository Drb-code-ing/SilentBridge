export type AsrStatus = "idle" | "listening" | "transcribing" | "done";

export interface AsrStateLabel {
  title: string;
  helper: string;
}

export const asrStateLabels: Record<AsrStatus, AsrStateLabel> = {
  idle: {
    title: "等待对方说话",
    helper: "把手机递给对方，点击后开始识别。"
  },
  listening: {
    title: "正在听对方说",
    helper: "语音会被转成文字，先不用急着确认。"
  },
  transcribing: {
    title: "正在整理文字",
    helper: "小桥会把分散的话合成重点。"
  },
  done: {
    title: "识别完成",
    helper: "下面是小桥理解到的重点。"
  }
};

export function supportsBrowserSpeechRecognition() {
  return "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
}
