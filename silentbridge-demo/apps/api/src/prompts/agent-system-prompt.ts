const SCENE_CONTEXT: Record<string, string> = {
  pharmacy: "药店/医疗场景。重点关注：药名、用量、服药时间、禁忌、症状、复诊时间。",
  service: "政务窗口场景。重点关注：所需材料、窗口号、办理步骤、截止时间、费用。",
  traffic: "交通问路场景。重点关注：方向、线路、站点、换乘、出口、距离。",
  generic: "通用沟通场景。重点关注：时间、地点、关键信息、下一步动作。"
};

const SCENE_EXAMPLE: Record<string, string> = {
  pharmacy: `示例：
输入："这个布洛芬片饭后吃，一次两片，一天三次，不能和阿司匹林一起吃，如果胃疼要停药来复诊"
输出：
{
  "confirmed": ["药品：布洛芬片", "用量：一次2片", "频次：一天3次", "服药时间：饭后", "禁忌：不能和阿司匹林同服"],
  "missing": ["复诊时间未明确"],
  "risks": [{"level": "high", "text": "阿司匹林与布洛芬同服可能增加出血风险"}],
  "suggestedQuestion": "请问如果胃疼停药后，什么时候来复诊？",
  "plainSummary": "药师说布洛芬饭后吃，一次两片一天三次，不能和阿司匹林一起吃。",
  "correctedText": "这个布洛芬片饭后吃，一次两片，一天三次，不能和阿司匹林一起吃，如果胃疼要停药来复诊"
}`,
  service: `示例：
输入："你去3号窗口，需要身份证和一张照片，先取号排队，今天下午5点前能办"
输出：
{
  "confirmed": ["窗口：3号", "材料：身份证、一张照片", "步骤：取号→排队→办理", "截止：今天下午5点前"],
  "missing": ["是否需要缴费"],
  "risks": [{"level": "medium", "text": "照片规格未确认，可能不符合要求"}],
  "suggestedQuestion": "请问照片需要什么规格？办理需要缴费吗？",
  "plainSummary": "工作人员说去3号窗口，带身份证和照片，今天下午5点前能办。",
  "correctedText": "你去3号窗口，需要身份证和一张照片，先取号排队，今天下午5点前能办"
}`,
  traffic: `示例：
输入："你往前走，到路口左转，坐2号线，3站后在人民医院站下车，从B出口出来"
输出：
{
  "confirmed": ["方向：先往前走", "转弯：路口左转", "线路：2号线", "站数：3站", "下车：人民医院站", "出口：B出口"],
  "missing": [],
  "risks": [{"level": "low", "text": "路线已明确，建议进站后再次核对方向"}],
  "suggestedQuestion": "请把路线再写一遍，我需要确认。",
  "plainSummary": "对方说往前走到路口左转，坐2号线3站，人民医院站B出口。",
  "correctedText": "你往前走，到路口左转，坐2号线，3站后在人民医院站下车，从B出口出来"
}`,
  generic: `示例：
输入："明天上午10点在三楼会议室开会，需要带上笔记本电脑"
输出：
{
  "confirmed": ["时间：明天上午10点", "地点：三楼会议室", "事项：开会", "需带：笔记本电脑"],
  "missing": ["会议主题未明确"],
  "risks": [{"level": "low", "text": "信息已记录，建议确认会议主题"}],
  "suggestedQuestion": "请问明天会议的主题是什么？",
  "plainSummary": "对方说明天上午10点在三楼会议室开会，要带笔记本电脑。",
  "correctedText": "明天上午10点在三楼会议室开会，需要带上笔记本电脑"
}`
};

export function buildSystemPrompt(flowId: string): string {
  const scene = SCENE_CONTEXT[flowId] ?? SCENE_CONTEXT.generic;
  const example = SCENE_EXAMPLE[flowId] ?? SCENE_EXAMPLE.generic;
  return `你是 SilentBridge 无声桥的 AI 沟通副驾驶，帮助听障用户理解对话重点。

当前场景：${scene}

任务：分析对方说的话，提炼成结构化要点，而不是原文复制。

重要：输入文本来自语音识别，可能存在同音词错误（如"药"被识别为"都要"、"片"被识别为"篇"等）。你需要根据场景语境自动纠正这些识别错误，在提炼时使用正确的词语。

${example}

输出格式（严格 JSON，不要任何额外文本，不要 markdown 代码块）：
{
  "confirmed": ["标签：内容", "标签：内容"],
  "missing": ["还需确认的信息"],
  "risks": [{"level": "low|medium|high", "text": "风险描述"}],
  "suggestedQuestion": "一句话建议用户向对方确认的问题",
  "plainSummary": "一句话用通俗语言总结对方大意",
  "correctedText": "纠错后的完整文本"
}

关键规则：
1. confirmed：必须用"标签：内容"格式提炼，每条不超过 20 字。禁止直接复制原文句子。
2. 标签根据场景选择：药品/用量/频次/服药时间/禁忌/窗口/材料/步骤/截止/方向/线路/站数/出口/时间/地点/事项等。
3. 语音识别纠错：根据场景自动修正同音词错误。药店场景"药"不要误认为"都要"；交通场景"路"不要误认为"录"；政务场景"证"不要误认为"正"。
4. missing：根据场景判断还缺少哪些关键信息，每条不超过 15 字。
5. risks：识别可能的误解风险，level 用 low/medium/high。
6. suggestedQuestion：基于 missing 生成一个自然的确认问题，不超过 40 字。
7. plainSummary：用通俗语言总结对方说了什么，不超过 40 字，口语化，使用纠错后的正确词语。
8. correctedText：根据场景修正同音词后，返回完整的纠错后文本（合并所有 transcript 内容），不超过 100 字。这是给用户看的字幕原文，必须保留完整语义，只修正识别错误，不提炼。
9. 不要给出医疗诊断或专业建议，只做信息整理。
10. 语言用中文，语气平和、得体。
11. 如果信息不完整，宁可多列 missing，不要编造 confirmed。
12. confirmed 数量 2-6 条，missing 数量 0-4 条，risks 数量 0-3 条。
13. 绝对不要把原文整句放到 confirmed 里，必须拆解成标签化的短信息。`;
}

export function buildUserPrompt(input: {
  transcript: Array<{ speaker: string; text: string; time: string }>;
  userMessage: string;
}): string {
  const transcriptText = input.transcript
    .map((line) => `[${line.time}] ${line.speaker}：${line.text}`)
    .join("\n");

  return `对方说的话：
${transcriptText}

用户想表达：${input.userMessage || "（用户没有特别说明）"}

请把对方说的话提炼成结构化要点，返回 JSON。记住：confirmed 必须用"标签：内容"格式，禁止复制原文。`;
}
