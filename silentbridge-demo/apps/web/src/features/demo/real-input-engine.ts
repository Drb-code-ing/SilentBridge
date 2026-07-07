import type { AiUnderstanding, CaptionLine, DemoFlow, DemoFlowId, RiskItem } from "./demo-content";
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

interface SceneFactExtractor {
  confirmed: string[];
  missing: string[];
  risks: RiskItem[];
  suggestedQuestion: string;
}

function extractFactsByScene(flowId: DemoFlowId, text: string): SceneFactExtractor {
  switch (flowId) {
    case "pharmacy":
      return extractMedicalFacts(text);
    case "service":
      return extractServiceFacts(text);
    case "traffic":
      return extractTrafficFacts(text);
    default:
      return extractGenericFacts(text);
  }
}

function extractMedicalFacts(text: string): SceneFactExtractor {
  const confirmed: string[] = [];
  const missing: string[] = [];
  const risks: RiskItem[] = [];

  const drugMatch = text.match(/[\u4e00-\u9fa5]{2,6}(片|丸|胶囊|冲剂|口服液|颗粒|糖浆|滴丸|喷剂)/);
  const dosageMatch = text.match(/(一次\d+(粒|片|丸|颗)|一天\d+次|饭前|饭后|睡前|早晚|每日\d+次|隔\d+小时)/);
  const contraindicationMatch = text.match(/(不能|避免|禁忌|同服|忌|勿|不要)/);
  const symptomMatch = text.match(/(疼|炎|烧|咳|晕|过敏|恶心|呕吐|腹泻|头痛|发热|感染|炎症)/);
  const followUpMatch = text.match(/(复诊|复查|回医院|急诊|随访|回来|再来)/);

  if (drugMatch) {
    confirmed.push(`药品：${drugMatch[0]}`);
  } else {
    missing.push("药名还没有写下来");
  }

  if (dosageMatch) {
    confirmed.push(`用量：${dosageMatch[0]}`);
  } else {
    missing.push("用量和服药时间还没有确认");
  }

  if (contraindicationMatch) {
    confirmed.push(`禁忌：${contraindicationMatch[0]}`);
    risks.push({ level: "high", text: "存在用药禁忌提醒，需要明确记下来并遵守。" });
  } else {
    missing.push("是否还有禁忌没有说明");
  }

  if (symptomMatch) {
    confirmed.push(`症状：${symptomMatch[0]}`);
    if (!dosageMatch) {
      risks.push({ level: "medium", text: "有症状描述但未明确用量，建议请医生或药师再确认。" });
    }
  }

  if (followUpMatch) {
    confirmed.push(`复诊：${followUpMatch[0]}`);
  } else {
    missing.push("复诊时间还没有确认");
  }

  if (risks.length === 0) {
    risks.push({ level: "low", text: "用药信息已记录，建议保存后再次核对。" });
  }

  const suggestedQuestion = buildMedicalQuestion(missing);

  return { confirmed, missing, risks, suggestedQuestion };
}

function buildMedicalQuestion(missing: string[]): string {
  if (missing.length === 0) {
    return "请把药名、用量和不能一起吃的东西再写一遍，我要保存。";
  }

  const parts: string[] = [];
  if (missing.some((m) => m.includes("药名"))) parts.push("药名");
  if (missing.some((m) => m.includes("用量"))) parts.push("用量和服药时间");
  if (missing.some((m) => m.includes("禁忌"))) parts.push("不能一起吃的东西");
  if (missing.some((m) => m.includes("复诊"))) parts.push("复诊时间");

  if (parts.length === 0) {
    return "请把关键信息再写一遍，我需要保存。";
  }

  return `请把${parts.join("、")}写下来，我要确认清楚。`;
}

function extractServiceFacts(text: string): SceneFactExtractor {
  const confirmed: string[] = [];
  const missing: string[] = [];
  const risks: RiskItem[] = [];

  const materialMatches = text.match(/(身份证|照片|复印件|户口本|材料|证件|申请表|营业执照|社保卡|医保卡)/g);
  const windowMatch = text.match(/(\d+号窗口|综合业务|办事窗口|服务台)/);
  const stepMatches = text.match(/(取号|排队|办理|填表|提交|缴费|签字|复印)/g);
  const deadlineMatch = text.match(/(今天|明天|后天|上午|下午|截止|月底|工作日|几点|之前)/);

  if (materialMatches && materialMatches.length > 0) {
    const uniqueMaterials = Array.from(new Set(materialMatches));
    confirmed.push(`材料：${uniqueMaterials.join("、")}`);
  } else {
    missing.push("需要哪些材料还没有列全");
  }

  if (windowMatch) {
    confirmed.push(`窗口：${windowMatch[0]}`);
  } else {
    missing.push("到哪个窗口办理还没有确认");
  }

  if (stepMatches && stepMatches.length > 0) {
    const uniqueSteps = Array.from(new Set(stepMatches));
    confirmed.push(`步骤：${uniqueSteps.join("→")}`);
  } else {
    missing.push("办理步骤还没有说清");
  }

  if (deadlineMatch) {
    confirmed.push(`时间：${deadlineMatch[0]}`);
  } else {
    missing.push("截止时间还没有确认");
  }

  if (materialMatches && materialMatches.length < 2) {
    risks.push({ level: "medium", text: "材料可能不全，少一项可能需要重新排队。" });
  }

  if (!deadlineMatch) {
    risks.push({ level: "medium", text: "没有明确截止时间，可能白跑一趟。" });
  }

  if (risks.length === 0) {
    risks.push({ level: "low", text: "办事信息已整理，建议按步骤顺序办理。" });
  }

  const suggestedQuestion = buildServiceQuestion(missing);

  return { confirmed, missing, risks, suggestedQuestion };
}

function buildServiceQuestion(missing: string[]): string {
  if (missing.length === 0) {
    return "请再帮我确认还缺哪一项材料，以及今天最晚几点能办。";
  }

  const parts: string[] = [];
  if (missing.some((m) => m.includes("材料"))) parts.push("还缺哪些材料");
  if (missing.some((m) => m.includes("窗口"))) parts.push("到哪个窗口办理");
  if (missing.some((m) => m.includes("步骤"))) parts.push("办理步骤");
  if (missing.some((m) => m.includes("截止"))) parts.push("今天最晚几点能办");

  if (parts.length === 0) {
    return "请把关键信息写下来，我需要确认。";
  }

  return `请再写一下${parts.join("、")}，我要确认清楚。`;
}

function extractTrafficFacts(text: string): SceneFactExtractor {
  const confirmed: string[] = [];
  const missing: string[] = [];
  const risks: RiskItem[] = [];

  const directionMatch = text.match(/(左|右|前|后|往|朝|对面|旁边|直走|拐|转)/);
  const lineMatches = text.match(/(\d+号线|\d+路|地铁|公交|轻轨)/g);
  const stationMatch = text.match(/(\d+站|换乘|出口|入口|站台|站牌|站)/);
  const distanceMatch = text.match(/(\d+米|远|近|步行|路程|大概)/);

  if (directionMatch) {
    confirmed.push(`方向：${directionMatch[0]}`);
    if (/对面/.test(text)) {
      risks.push({ level: "high", text: "提到「对面」，走错方向会坐反，需要特别确认。" });
    }
  } else {
    missing.push("方向还没有说清");
  }

  if (lineMatches && lineMatches.length > 0) {
    const uniqueLines = Array.from(new Set(lineMatches));
    confirmed.push(`线路：${uniqueLines.join("、")}`);
  } else {
    missing.push("坐哪条线路还没有确认");
  }

  if (stationMatch) {
    confirmed.push(`站点：${stationMatch[0]}`);
  } else {
    missing.push("从哪个出口进站还没说");
  }

  if (distanceMatch) {
    confirmed.push(`距离：${distanceMatch[0]}`);
  }

  if (lineMatches && lineMatches.length > 1 && !/换乘/.test(text)) {
    missing.push("换乘信息还没有明确");
    risks.push({ level: "medium", text: "涉及多条线路但未提到换乘，容易走错。" });
  }

  if (risks.length === 0) {
    risks.push({ level: "low", text: "路线信息已记录，建议进站后再次核对方向。" });
  }

  const suggestedQuestion = buildTrafficQuestion(missing);

  return { confirmed, missing, risks, suggestedQuestion };
}

function buildTrafficQuestion(missing: string[]): string {
  if (missing.length === 0) {
    return "请再写一下我要从哪个出口进站，换乘后坐几站。";
  }

  const parts: string[] = [];
  if (missing.some((m) => m.includes("方向"))) parts.push("往哪个方向走");
  if (missing.some((m) => m.includes("线路"))) parts.push("坐哪条线路");
  if (missing.some((m) => m.includes("出口"))) parts.push("从哪个出口进站");
  if (missing.some((m) => m.includes("换乘"))) parts.push("换乘后坐几站");

  if (parts.length === 0) {
    return "请把路线再写一遍，我需要确认。";
  }

  return `请再写一下${parts.join("、")}，我需要确认清楚。`;
}

function extractGenericFacts(text: string): SceneFactExtractor {
  const confirmed: string[] = [];
  const missing: string[] = [];
  const risks: RiskItem[] = [];

  const timeMatch = text.match(/(今天|明天|后天|上午|下午|晚上|\d+点|\d+分|小时|周|月)/);
  const placeMatch = text.match(/(省|市|路|街|号|室|楼|层|大厦|广场|医院|学校|银行|店)/);
  const actionMatch = text.match(/(需要|必须|请|确认|提交|办理|联系|支付|签字|回来)/);

  if (timeMatch) {
    confirmed.push(`时间：${timeMatch[0]}`);
  } else {
    missing.push("具体时间还没有确认");
  }

  if (placeMatch) {
    confirmed.push(`地点：${placeMatch[0]}`);
  } else {
    missing.push("地点还没有写清楚");
  }

  if (actionMatch) {
    confirmed.push(`动作：${actionMatch[0]}`);
  } else {
    missing.push("下一步动作还没有明确");
  }

  if (missing.length >= 2) {
    risks.push({ level: "medium", text: "关键信息不完整，后续容易忘记或误解。" });
  } else {
    risks.push({ level: "low", text: "信息已记录，建议确认下一步动作。" });
  }

  const suggestedQuestion = buildGenericQuestion(missing);

  return { confirmed, missing, risks, suggestedQuestion };
}

function buildGenericQuestion(missing: string[]): string {
  if (missing.length === 0) {
    return "请把时间、地点和下一步写完整，我需要保存。";
  }

  const parts: string[] = [];
  if (missing.some((m) => m.includes("时间"))) parts.push("具体时间");
  if (missing.some((m) => m.includes("地点"))) parts.push("地点");
  if (missing.some((m) => m.includes("动作"))) parts.push("下一步要做什么");

  if (parts.length === 0) {
    return "请把关键信息写下来，我需要确认。";
  }

  return `请把${parts.join("、")}写下来，我需要确认清楚。`;
}

export function createUnderstandingFromTranscript(input: {
  flow: DemoFlow;
  transcript: TranscriptSegmentPayload[] | CaptionLine[];
  userMessage: string;
}): AiUnderstanding {
  const joinedText = input.transcript.map((line) => line.text).join(" ").trim();

  if (!joinedText) {
    return input.flow.aiUnderstanding;
  }

  const extracted = extractFactsByScene(input.flow.id, joinedText);
  const firstFact = joinedText.length > 46 ? `${joinedText.slice(0, 46)}...` : joinedText;

  return {
    confirmed: extracted.confirmed.length > 0
      ? extracted.confirmed
      : [firstFact, `用户想表达：${input.userMessage}`],
    missing: extracted.missing.length > 0 ? extracted.missing : ["请对方再确认一次关键信息"],
    risks: extracted.risks,
    suggestedQuestion: extracted.suggestedQuestion,
    plainSummary: `对方大意是：${firstFact}`
  };
}
