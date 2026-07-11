export type AppTab = "home" | "bridge" | "records" | "phrases";
export type BridgeStep = "show" | "listen";
export type DemoFlowId = "clinic" | "pharmacy" | "service" | "traffic" | "generic";

export interface CaptionLine {
  id: string;
  speaker: string;
  text: string;
  time: string;
  important?: boolean;
  corrected?: boolean;
  originalText?: string;
}

export interface QuickScenario {
  id: Exclude<DemoFlowId, "generic">;
  title: string;
  helper: string;
  message: string;
  style: "sky" | "sun" | "mint" | "coral";
}

export interface RecordItem {
  id: string;
  flowId: DemoFlowId;
  title: string;
  place: string;
  time: string;
  summary: string;
  nextStep: string;
  keyPoints: string[];
  actionPhrase: string;
  aiUnderstanding: AiUnderstanding;
}

export interface Phrase {
  id: string;
  text: string;
  intent: string;
  /** 可选：使用后优先绑定的场景 */
  flowId?: DemoFlowId;
}

export interface PhrasePack {
  id: string;
  title: string;
  description: string;
  phrases: Phrase[];
}

export type RiskLevel = "low" | "medium" | "high";

export interface RiskItem {
  level: RiskLevel;
  text: string;
}

export interface AiUnderstanding {
  confirmed: string[];
  missing: string[];
  risks: RiskItem[];
  suggestedQuestion: string;
  plainSummary: string;
}

type SavedRecordTemplate = Omit<RecordItem, "id" | "time">;

export interface DemoFlow {
  id: DemoFlowId;
  captions: CaptionLine[];
  summaryHighlight: string;
  aiUnderstanding: AiUnderstanding;
  savedRecord: SavedRecordTemplate;
}

export const defaultFlowId: DemoFlowId = "clinic";

export const defaultMessage = "我听不见，但可以看文字。请说慢一点，关键信息请写下来。";

export const quickScenarios: QuickScenario[] = [
  {
    id: "clinic",
    title: "医院问诊",
    helper: "诊断、用药、急诊红线",
    message: "我听不清，请帮我写下诊断、用药和什么情况要马上急诊。",
    style: "coral"
  },
  {
    id: "pharmacy",
    title: "药店问药",
    helper: "药名、用量、禁忌",
    message: "我听不清，请帮我写下药名、用量和不能一起吃的东西。",
    style: "mint"
  },
  {
    id: "service",
    title: "政务窗口",
    helper: "材料、窗口、截止时间",
    message: "我需要确认要交哪些材料，请把关键步骤写下来。",
    style: "sun"
  },
  {
    id: "traffic",
    title: "临时问路",
    helper: "方向、站台、换乘",
    message: "我听不见，请告诉我应该去哪个方向或哪个站台。",
    style: "sky"
  }
];


const clinicUnderstanding: AiUnderstanding = {
  confirmed: ["初步判断为咽喉炎", "先按剂量连续服药 3 天", "三天后复诊", "胸闷或持续高烧要马上急诊"],
  missing: ["具体药名和每日次数还没写清", "是否需要进一步检查还没确认"],
  risks: [
    { level: "high", text: "胸闷或持续高烧不能等复诊，需要立即急诊。" },
    { level: "medium", text: "用药剂量若没写清，回家后容易吃错。" }
  ],
  suggestedQuestion: "请再写清楚：药名、每天几次、三天后几点复诊，以及什么情况要马上去急诊。",
  plainSummary: "医生判断为咽喉炎，需连续服药三天并复诊；若胸闷或持续高烧应立即急诊，药名与次数仍需确认。"
};

const pharmacyUnderstanding: AiUnderstanding = {
  confirmed: ["饭后服用", "一天两次，早晚各一次", "避免饮酒同服", "明显不适需先停用并咨询医生"],
  missing: ["药名还没有写下来", "是否正在服用其他药还没确认"],
  risks: [
    { level: "high", text: "药物和酒同服可能带来风险，需要明确提醒。" },
    { level: "medium", text: "如果还在服用其他药，最好先咨询医生。" }
  ],
  suggestedQuestion: "请把药名、每天几次、以及不能一起吃的东西写下来，我要保存。",
  plainSummary: "已确认饭后服用、一天两次，并有禁酒提醒；仍需补齐药名和是否联用其他药。"
};

const serviceUnderstanding: AiUnderstanding = {
  confirmed: ["需要身份证原件", "需要近期照片", "先取综合业务号", "到 3 号窗口办理"],
  missing: ["是否需要复印件数量还没确认", "窗口办理截止时间还没确认"],
  risks: [
    { level: "medium", text: "材料少一项可能需要重新排队。" }
  ],
  suggestedQuestion: "请再写一下还缺哪些材料，以及今天最晚几点能办。",
  plainSummary: "这次沟通已经确认办事材料和窗口，但还需要确认材料数量和办理截止时间。"
};

const trafficUnderstanding: AiUnderstanding = {
  confirmed: ["右手边楼梯下去", "坐 2 号线", "人民广场换乘 1 号线", "往市中心方向"],
  missing: ["哪一个出口进站还没确认", "换乘后坐几站还没确认"],
  risks: [
    { level: "medium", text: "走到对面站台会坐反方向。" }
  ],
  suggestedQuestion: "请再写一下我从哪个出口进站，换乘后坐几站。",
  plainSummary: "这次沟通已经确认路线方向，但还需要确认入口和换乘后的站数。"
};

const genericUnderstanding: AiUnderstanding = {
  confirmed: ["对方愿意用文字配合", "需要再次确认时间、地点和下一步"],
  missing: ["具体地点还没写清楚", "下一步责任人还没确认"],
  risks: [
    { level: "low", text: "信息不完整时，后续容易忘记或误解。" }
  ],
  suggestedQuestion: "请把时间、地点、下一步和联系人写完整。",
  plainSummary: "这次沟通已经建立文字配合方式，但还需要补齐关键信息。"
};

export const demoFlows: Record<DemoFlowId, DemoFlow> = {
  clinic: {
    id: "clinic",
    captions: [
      {
        id: "clinic-caption-1",
        speaker: "医生",
        text: "这次主要是咽喉炎，先按这个剂量连续吃三天。",
        time: "00:01",
        important: true
      },
      {
        id: "clinic-caption-2",
        speaker: "医生",
        text: "如果出现胸闷、持续高烧，不能等复诊，要马上来急诊。",
        time: "00:05",
        important: true
      },
      {
        id: "clinic-caption-3",
        speaker: "医生",
        text: "三天后到门诊复诊，把用药情况和症状变化告诉医生。",
        time: "00:09"
      }
    ],
    summaryHighlight: "咽喉炎，连吃三天；胸闷或持续高烧马上去急诊；三天后复诊。",
    aiUnderstanding: clinicUnderstanding,
    savedRecord: {
      flowId: "clinic",
      title: "刚刚的医院问诊",
      place: "门诊诊室",
      summary: "已确认咽喉炎、连续服药三天、三天后复诊，并有急诊红线提醒。",
      nextStep: "确认药名与每日次数，三天后复诊；出现胸闷或持续高烧立即急诊。",
      keyPoints: ["咽喉炎", "连续服药三天", "三天后复诊", "胸闷高烧急诊"],
      actionPhrase: "请再写清楚药名、每天几次，以及什么情况要马上去急诊。",
      aiUnderstanding: clinicUnderstanding
    }
  },
  pharmacy: {
    id: "pharmacy",
    captions: [
      {
        id: "pharmacy-caption-1",
        speaker: "药师",
        text: "这个药饭后吃，一天两次，早晚各一次。",
        time: "00:01",
        important: true
      },
      {
        id: "pharmacy-caption-2",
        speaker: "药师",
        text: "不要和酒一起服用，如果已经在吃其他药，最好先问医生。",
        time: "00:05",
        important: true
      },
      {
        id: "pharmacy-caption-3",
        speaker: "药师",
        text: "如果吃完后明显不舒服，就先停用，并尽快咨询医生。",
        time: "00:09"
      }
    ],
    summaryHighlight: "饭后吃，一天两次，不要和酒一起服用。",
    aiUnderstanding: pharmacyUnderstanding,
    savedRecord: {
      flowId: "pharmacy",
      title: "刚刚的药店沟通",
      place: "药店柜台",
      summary: "已确认饭后服用、一天两次，避免饮酒同服。",
      nextStep: "如果服用后明显不适，先停用并咨询医生。",
      keyPoints: ["饭后服用", "早晚各一次", "避免饮酒", "不适时咨询医生"],
      actionPhrase: "请把药名和用量再写一遍，我要保存。",
      aiUnderstanding: pharmacyUnderstanding
    }
  },
  service: {
    id: "service",
    captions: [
      {
        id: "service-caption-1",
        speaker: "工作人员",
        text: "需要身份证原件和一张近期照片，复印件可以现场打印。",
        time: "00:01",
        important: true
      },
      {
        id: "service-caption-2",
        speaker: "工作人员",
        text: "先在取号机取综合业务号，然后到 3 号窗口办理。",
        time: "00:06",
        important: true
      },
      {
        id: "service-caption-3",
        speaker: "工作人员",
        text: "如果今天来不及，可以明天上午带齐材料再来。",
        time: "00:10"
      }
    ],
    summaryHighlight: "身份证原件、近期照片，先取号，再到 3 号窗口。",
    aiUnderstanding: serviceUnderstanding,
    savedRecord: {
      flowId: "service",
      title: "刚刚的政务窗口沟通",
      place: "政务服务窗口",
      summary: "已确认身份证原件、近期照片，先取综合业务号，再到 3 号窗口办理。",
      nextStep: "明天上午带齐材料，先取号，再到窗口办理。",
      keyPoints: ["身份证原件", "近期照片", "综合业务号", "3 号窗口"],
      actionPhrase: "请再帮我确认还缺哪一项材料。",
      aiUnderstanding: serviceUnderstanding
    }
  },
  traffic: {
    id: "traffic",
    captions: [
      {
        id: "traffic-caption-1",
        speaker: "路人",
        text: "先往前走到地铁口，从右手边楼梯下去。",
        time: "00:01",
        important: true
      },
      {
        id: "traffic-caption-2",
        speaker: "路人",
        text: "坐 2 号线到人民广场，再换乘 1 号线。",
        time: "00:05",
        important: true
      },
      {
        id: "traffic-caption-3",
        speaker: "路人",
        text: "不要去对面站台，方向是往市中心。",
        time: "00:09"
      }
    ],
    summaryHighlight: "从右手边进地铁，2 号线到人民广场后换乘 1 号线。",
    aiUnderstanding: trafficUnderstanding,
    savedRecord: {
      flowId: "traffic",
      title: "刚刚的问路沟通",
      place: "地铁站附近",
      summary: "已确认从右手边楼梯进地铁，坐 2 号线到人民广场后换乘 1 号线。",
      nextStep: "按市中心方向进站，不要去对面站台。",
      keyPoints: ["右手边楼梯", "2 号线", "人民广场换乘", "市中心方向"],
      actionPhrase: "请再写一下我要在哪一站换乘。",
      aiUnderstanding: trafficUnderstanding
    }
  },
  generic: {
    id: "generic",
    captions: [
      {
        id: "generic-caption-1",
        speaker: "对方",
        text: "好的，我把关键内容写下来给你看。",
        time: "00:01",
        important: true
      },
      {
        id: "generic-caption-2",
        speaker: "对方",
        text: "时间、地点和下一步需要再确认一遍。",
        time: "00:04",
        important: true
      },
      {
        id: "generic-caption-3",
        speaker: "对方",
        text: "你可以把这条记录保存，后面继续问我。",
        time: "00:08"
      }
    ],
    summaryHighlight: "对方愿意用文字确认时间、地点和下一步。",
    aiUnderstanding: genericUnderstanding,
    savedRecord: {
      flowId: "generic",
      title: "刚刚的现场确认",
      place: "现场沟通",
      summary: "已确认对方愿意用文字配合，并再次写下时间、地点和下一步。",
      nextStep: "根据记录继续追问缺失信息，必要时请对方写下来。",
      keyPoints: ["文字配合", "确认时间", "确认地点", "确认下一步"],
      actionPhrase: "请再帮我把最重要的一句话写下来。",
      aiUnderstanding: genericUnderstanding
    }
  }
};

export const initialRecords: RecordItem[] = [
  {
    id: "record-clinic",
    flowId: "clinic",
    title: "门诊问诊",
    place: "社区医院门诊",
    time: "今天 09:40",
    summary: "已确认咽喉炎、连吃三天药、三天后复诊，胸闷或持续高烧需急诊。",
    nextStep: "补齐药名与每日次数，按急诊红线观察症状。",
    keyPoints: ["咽喉炎", "连吃三天", "三天后复诊", "急诊红线"],
    actionPhrase: "请再写清楚药名、每天几次，以及什么情况要马上去急诊。",
    aiUnderstanding: clinicUnderstanding
  },
  {
    id: "record-pharmacy",
    flowId: "pharmacy",
    title: "药店问药",
    place: "社区药房",
    time: "今天 14:26",
    summary: "已确认饭后服用、一天两次、不能与酒同服。",
    nextStep: "服用后如明显不适，先停用并咨询医生。",
    keyPoints: ["饭后服用", "早晚各一次", "避免饮酒", "不适时先停用"],
    actionPhrase: "请再帮我写下药名、用量和注意事项。",
    aiUnderstanding: pharmacyUnderstanding
  },
  {
    id: "record-service",
    flowId: "service",
    title: "证件补办咨询",
    place: "街道政务窗口",
    time: "昨天 10:18",
    summary: "需要身份证原件、近期照片，现场取号后到 3 号窗口办理。",
    nextStep: "明天上午带齐材料，先取号再排队。",
    keyPoints: ["身份证原件", "一寸照片", "3 号窗口", "上午办理"],
    actionPhrase: "我想确认还缺哪一项材料，请写给我。",
    aiUnderstanding: serviceUnderstanding
  },
  {
    id: "record-traffic",
    flowId: "traffic",
    title: "临时问路确认",
    place: "地铁站附近",
    time: "前天 09:42",
    summary: "已确认从右手边楼梯进地铁，坐 2 号线到人民广场后换乘。",
    nextStep: "进站后看市中心方向，不要走到对面站台。",
    keyPoints: ["右手边楼梯", "2 号线", "人民广场换乘", "市中心方向"],
    actionPhrase: "请再写一下我要在哪一站换乘。",
    aiUnderstanding: trafficUnderstanding
  }
];

export const phrasePacks: PhrasePack[] = [
  {
    id: "first",
    title: "先说明",
    description: "先让对方知道怎么配合。",
    phrases: [
      { id: "first-1", text: "我听不见，但可以看文字。请说慢一点。", intent: "说明状态" },
      { id: "first-2", text: "请把关键词写下来给我看。", intent: "请对方写" },
      { id: "first-3", text: "我没有听懂，可以换一种方式说吗？", intent: "请求复述" },
      { id: "first-4", text: "请面对我，让我看清你的口型或文字。", intent: "配合方式" }
    ]
  },
  {
    id: "confirm",
    title: "再确认",
    description: "把容易听错的信息单独确认。",
    phrases: [
      { id: "confirm-1", text: "请写下时间、地点和下一步。", intent: "确认三要素" },
      { id: "confirm-2", text: "请写下药名、用量、一天几次。", intent: "确认用药", flowId: "pharmacy" },
      { id: "confirm-clinic", text: "请写下诊断、用药，以及什么情况要马上急诊。", intent: "确认医嘱", flowId: "clinic" },
      { id: "confirm-3", text: "我需要补交哪些材料？", intent: "确认材料", flowId: "service" },
      { id: "confirm-4", text: "请再确认方向、站台和换乘站。", intent: "确认路线", flowId: "traffic" }
    ]
  },
  {
    id: "urgent",
    title: "关键求助",
    description: "紧张场合先稳住沟通。",
    phrases: [
      { id: "urgent-1", text: "这很重要，请帮我写下来，我要保存。", intent: "请求记录" },
      { id: "urgent-2", text: "请稍等，我正在通过字幕阅读。", intent: "请求等待" },
      { id: "urgent-3", text: "如果有风险或禁忌，请明确告诉我。", intent: "确认风险", flowId: "clinic" }
    ]
  }
];

export const tabLabels: Record<AppTab, { label: string; mark: string }> = {
  home: { label: "首页", mark: "首" },
  bridge: { label: "开桥", mark: "桥" },
  records: { label: "记录", mark: "记" },
  phrases: { label: "话术", mark: "句" }
};
