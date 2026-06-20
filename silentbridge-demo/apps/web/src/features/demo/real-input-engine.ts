import type { AiUnderstanding, CaptionLine, DemoFlow, DemoFlowId } from "./demo-content";
import type { TranscriptSegmentPayload } from "./api-contracts";

const MAX_MESSAGE_LENGTH = 120;
const MAX_REPLY_LENGTH = 280;

export function normalizeUserText(input: string, fallback: string, maxLength = MAX_MESSAGE_LENGTH) {
  const normalized = input.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return fallback;
  }

  return normalized.slice(0, maxLength);
}

export function inferFlowIdFromText(text: string): DemoFlowId {
  const value = text.toLowerCase();

  if (/药|吃|疼|过敏|医生|医院|检查|处方/.test(value)) {
    return "pharmacy";
  }

  if (/政务|窗口|材料|证件|办理|预约/.test(value)) {
    return "service";
  }

  if (/地铁|路口|马路|哪条路|路怎么走|方向|站台|换乘|出口|几站|问路|指路|迷路/.test(value)) {
    return "traffic";
  }

  return "generic";
}

export function createManualTranscript(input: {
  text: string;
  speaker?: string;
  now?: Date;
}): TranscriptSegmentPayload[] {
  const text = normalizeUserText(input.text, "", MAX_REPLY_LENGTH);
  if (!text) {
    return [];
  }

  const time = input.now
    ? `${String(input.now.getHours()).padStart(2, "0")}:${String(input.now.getMinutes()).padStart(2, "0")}`
    : "刚刚";

  return [
    {
      id: `manual-${Date.now()}`,
      speaker: input.speaker ?? "对方",
      time,
      text,
      important: true,
      confidence: 1
    }
  ];
}

export function createBrowserSpeechTranscript(input: {
  text: string;
  speaker?: string;
  now?: Date;
  confidence?: number;
}): TranscriptSegmentPayload[] {
  const text = normalizeUserText(input.text, "", MAX_REPLY_LENGTH);
  if (!text) {
    return [];
  }

  const time = input.now
    ? `${String(input.now.getHours()).padStart(2, "0")}:${String(input.now.getMinutes()).padStart(2, "0")}`
    : "刚刚";

  return [
    {
      id: `browser-speech-${Date.now()}`,
      speaker: input.speaker ?? "对方",
      time,
      text,
      important: true,
      confidence: input.confidence ?? 0.86
    }
  ];
}

export function createUnderstandingFromTranscript(input: {
  flow: DemoFlow;
  transcript: TranscriptSegmentPayload[] | CaptionLine[];
  userMessage: string;
}): AiUnderstanding {
  const joinedText = input.transcript.map((line) => line.text).join("").trim();

  if (!joinedText) {
    return input.flow.aiUnderstanding;
  }

  const firstFact = joinedText.length > 46 ? `${joinedText.slice(0, 46)}...` : joinedText;
  const hasTime = /今天|明天|后天|上午|下午|晚上|点|分钟|小时|周|月|\d+\s*(点|分|时|号|天|周|月|分钟|小时)/.test(joinedText);
  const hasRiskWord = /必须|不能|过敏|费用|截止|迟到|材料|签字|确认|复查|面试|缴费/.test(joinedText);

  return {
    confirmed: [
      firstFact,
      `用户想表达：${input.userMessage}`
    ],
    missing: hasTime ? ["是否还有地点、材料或下一步动作需要确认"] : ["具体时间还没有听清，需要再确认一次"],
    risks: hasRiskWord
      ? [{ level: "medium", text: "这句话里可能包含时间、费用、材料或规则要求，建议请对方再确认关键条件。" }]
      : [{ level: "low", text: "当前信息可以先保存，但仍建议确认下一步动作。" }],
    suggestedQuestion: "我想确认一下，最重要的时间、地点和下一步分别是什么？可以写给我看吗？",
    plainSummary: `对方大意是：${firstFact}`
  };
}
