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

  if (/门诊|急诊|复诊|咽喉炎|胸闷|高烧|医嘱|医生说|医院|检查单|处方/.test(value)) {
    return "clinic";
  }

  if (/药|服药|饭后|饭前|禁忌|过敏|药店|药师|胶囊|片剂/.test(value)) {
    return "pharmacy";
  }

  if (/政务|窗口|材料|证件|办理|预约|取号|身份证/.test(value)) {
    return "service";
  }

  if (/地铁|路口|马路|哪条路|路怎么走|方向|站台|换乘|出口|几站|问路|指路|迷路|号线/.test(value)) {
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
    case "clinic":
      return extractClinicFacts(text);
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


function extractClinicFacts(text: string): SceneFactExtractor {
  const confirmed: string[] = [];
  const missing: string[] = [];
  const risks: RiskItem[] = [];

  const diagnosisMatch = text.match(/(咽喉炎|感冒|发烧|发热|咳嗽|过敏|炎症|感染|支气管炎|扁桃体炎|胃炎)/);
  const dosageParts = [
    text.match(/饭前|饭后|睡前|空腹/)?.[0],
    text.match(/连续.{0,4}\d+天|吃\d+天|连服\d+天|一天\d+次|每日\d+次|早晚各一次|一次\d+(粒|片|丸|颗)/)?.[0]
  ].filter(Boolean) as string[];
  const followUpMatch = text.match(/(\d+天后.{0,6}复诊|三天后复诊|后天复诊|复诊|复查)/);
  const emergency = /(胸闷|持续高烧|高烧不退|呼吸困难).{0,16}(急诊|马上|立刻|不能等)|马上去急诊|来急诊/.test(text);
  const drugMatch = text.match(/[一-龥A-Za-z0-9]{1,10}(片|丸|胶囊|冲剂|口服液|颗粒|糖浆|滴丸|喷剂)/);

  if (diagnosisMatch) {
    confirmed.push(`判断：${diagnosisMatch[0]}`);
  } else {
    missing.push("具体诊断或判断还没有写清");
  }

  if (dosageParts.length > 0) {
    confirmed.push(`用药：${Array.from(new Set(dosageParts)).join("，")}`);
  } else {
    missing.push("用药剂量和天数还没有确认");
  }

  if (drugMatch) {
    confirmed.push(`药品：${drugMatch[0]}`);
  } else {
    missing.push("药名还没有写下来");
  }

  if (followUpMatch) {
    confirmed.push(`复诊：${followUpMatch[0]}`);
  } else {
    missing.push("复诊时间还没有确认");
  }

  if (emergency) {
    confirmed.push("急诊红线：胸闷或持续高烧需马上急诊");
    risks.push({ level: "high", text: "出现胸闷或持续高烧时不能等复诊，应立即急诊。" });
  } else {
    missing.push("什么情况要马上急诊还没说明");
    risks.push({ level: "medium", text: "若缺少急诊红线提醒，回家后可能延误就医。" });
  }

  if (risks.length === 0) {
    risks.push({ level: "low", text: "医嘱已记录，建议保存后再次核对药名与复诊时间。" });
  }

  const parts: string[] = [];
  if (missing.some((m) => m.includes("药名"))) parts.push("药名");
  if (missing.some((m) => m.includes("剂量") || m.includes("用药"))) parts.push("每天几次和吃几天");
  if (missing.some((m) => m.includes("复诊"))) parts.push("复诊时间");
  if (missing.some((m) => m.includes("急诊"))) parts.push("什么情况要马上去急诊");
  const suggestedQuestion =
    parts.length > 0
      ? `请再写清楚：${parts.join("、")}。`
      : "请把诊断、用药和急诊注意事项再写一遍，我要保存。";

  return { confirmed, missing, risks, suggestedQuestion };
}

function extractMedicalFacts(text: string): SceneFactExtractor {
  const confirmed: string[] = [];
  const missing: string[] = [];
  const risks: RiskItem[] = [];

  const drugMatch = text.match(/[一-龥A-Za-z0-9]{1,10}(片|丸|胶囊|冲剂|口服液|颗粒|糖浆|滴丸|喷剂)/);
  const dosageParts = [
    text.match(/饭前|饭后|睡前|空腹/)?.[0],
    text.match(/一天\d+次|每日\d+次|早晚各一次|一次\d+(粒|片|丸|颗)/)?.[0],
    /早晚/.test(text) ? "早晚" : undefined
  ].filter(Boolean) as string[];
  const alcoholRisk = /(不要|不能|避免).{0,8}(酒|酒精)|和酒一起|饮酒同服|忌酒/.test(text);
  const otherDrugRisk = /(其他药|别的药|正在吃|已经在吃).{0,12}(药|医生)/.test(text);
  const stopIfUnwell = /(不舒服|明显不适).{0,12}(停用|停药)|先停用/.test(text);
  const followUpMatch = text.match(/(复诊|复查|回医院|急诊|随访)/);
  const symptomMatch = text.match(/(咽喉炎|感冒|发烧|发热|咳嗽|过敏|头痛|腹泻|炎症)/);

  if (drugMatch) {
    confirmed.push(`药品：${drugMatch[0]}`);
  } else {
    missing.push("药名还没有写下来");
  }

  if (dosageParts.length > 0) {
    confirmed.push(`用法：${Array.from(new Set(dosageParts)).join("，")}`);
  } else {
    missing.push("用量和服药时间还没有确认");
  }

  if (alcoholRisk) {
    confirmed.push("禁忌：不要和酒一起服用");
    risks.push({ level: "high", text: "药物和酒同服可能带来风险，需要明确提醒并遵守。" });
  }

  if (otherDrugRisk) {
    confirmed.push("注意：若正在服用其他药，需先咨询医生");
    risks.push({ level: "medium", text: "如果还在服用其他药，最好先咨询医生或药师。" });
  }

  if (!alcoholRisk && !otherDrugRisk) {
    missing.push("是否还有禁忌没有说明");
  }

  if (symptomMatch) {
    confirmed.push(`相关情况：${symptomMatch[0]}`);
  }

  if (stopIfUnwell) {
    confirmed.push("不适处理：明显不舒服先停用并咨询医生");
  }

  if (followUpMatch) {
    confirmed.push(`后续：${followUpMatch[0]}`);
  } else if (!stopIfUnwell) {
    missing.push("复诊或不适处理还没有确认");
  }

  if (risks.length === 0) {
    risks.push({ level: "low", text: "用药信息已记录，建议保存后再次核对药名和用量。" });
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

  const materialMatches = text.match(/(身份证原件|身份证|一寸照片|近期照片|照片|复印件|户口本|申请表|营业执照|社保卡|医保卡)/g);
  const windowMatch = text.match(/(\d+\s*号窗口|综合业务号|综合业务|办事窗口|服务台)/);
  const stepMatches = text.match(/(取综合业务号|取号|排队|办理|填表|提交|缴费|签字|复印|现场打印)/g);
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

  const directionMatch = text.match(/(右手边|左边|右侧|左侧|往前|向前|直走|往市中心|市中心方向|对面)/);
  const lineMatches = text.match(/(\d+号线|\d+路|地铁|公交|轻轨)/g);
  const stationMatch = text.match(/(人民广场|换乘\s*\d+\s*号线|换乘|[A-Z]\s*出口|\d+\s*号出口|右手边楼梯|楼梯下去|入口|出口|站台)/);
  const distanceMatch = text.match(/(\d+米|远|近|步行|路程|大概)/);

  if (directionMatch) {
    confirmed.push(`方向：${directionMatch[0]}`);
    if (/对面|坐反|反方向/.test(text)) {
      risks.push({ level: "high", text: "走到对面站台可能坐反方向，需要特别确认。" });
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

  // Prefer curated demo understanding when transcript matches preset captions.
  const presetText = input.flow.captions.map((line) => line.text).join(" ").trim();
  if (joinedText === presetText || looksLikePresetDemo(joinedText, presetText)) {
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
    plainSummary: buildPlainSummary(input.flow.id, extracted, firstFact)
  };
}

function looksLikePresetDemo(actual: string, preset: string) {
  if (!preset) return false;
  const normalize = (value: string) => value.replace(/\s+/g, "");
  const a = normalize(actual);
  const p = normalize(preset);
  return a.includes(p.slice(0, Math.min(24, p.length))) || p.includes(a.slice(0, Math.min(24, a.length)));
}

function buildPlainSummary(
  flowId: DemoFlowId,
  extracted: SceneFactExtractor,
  firstFact: string
) {
  if (extracted.confirmed.length >= 2) {
    const head = extracted.confirmed.slice(0, 3).join("；");
    const tail =
      extracted.missing.length > 0 ? `仍需确认：${extracted.missing[0]}` : "关键信息已较完整，建议保存。";
    return `${head}。${tail}`;
  }

  if (flowId === "clinic") {
    return `医生说明了判断、用药与急诊注意事项：${firstFact}`;
  }

  if (flowId === "pharmacy") {
    return `对方说明了用药方式与注意事项：${firstFact}`;
  }

  return `对方大意是：${firstFact}`;
}
