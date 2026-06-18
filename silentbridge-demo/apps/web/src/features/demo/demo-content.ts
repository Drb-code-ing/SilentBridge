export type AppTab = "home" | "bridge" | "records" | "phrases";
export type BridgeStep = "show" | "listen";
export type DemoFlowId = "pharmacy" | "service" | "traffic" | "generic";

export interface CaptionLine {
  id: string;
  speaker: string;
  text: string;
  time: string;
  important?: boolean;
}

export interface QuickScenario {
  id: Exclude<DemoFlowId, "generic">;
  title: string;
  helper: string;
  message: string;
  style: "sky" | "sun" | "mint";
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
}

export interface Phrase {
  id: string;
  text: string;
  intent: string;
}

export interface PhrasePack {
  id: string;
  title: string;
  description: string;
  phrases: Phrase[];
}

type SavedRecordTemplate = Omit<RecordItem, "id" | "time">;

export interface DemoFlow {
  id: DemoFlowId;
  captions: CaptionLine[];
  summaryHighlight: string;
  savedRecord: SavedRecordTemplate;
}

export const defaultFlowId: DemoFlowId = "pharmacy";

export const defaultMessage = "我听不见，但可以看文字。请说慢一点。";

export const quickScenarios: QuickScenario[] = [
  {
    id: "pharmacy",
    title: "药店问药",
    helper: "药名、用量、禁忌",
    message: "我听不清，请帮我写下药名、用量和不能一起吃的东西。",
    style: "mint"
  },
  {
    id: "service",
    title: "窗口办事",
    helper: "材料、排队、下一步",
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

export const demoFlows: Record<DemoFlowId, DemoFlow> = {
  pharmacy: {
    id: "pharmacy",
    captions: [
      {
        id: "pharmacy-caption-1",
        speaker: "店员",
        text: "这个药饭后吃，一天两次，早晚各一次。",
        time: "00:01",
        important: true
      },
      {
        id: "pharmacy-caption-2",
        speaker: "店员",
        text: "不要和酒一起服用，如果已经在吃其他药，最好先问医生。",
        time: "00:05",
        important: true
      },
      {
        id: "pharmacy-caption-3",
        speaker: "店员",
        text: "如果吃完后明显不舒服，就先停用，并尽快咨询医生。",
        time: "00:09"
      }
    ],
    summaryHighlight: "饭后吃，一天两次，不要和酒一起服用。",
    savedRecord: {
      flowId: "pharmacy",
      title: "刚刚的药店沟通",
      place: "药店柜台",
      summary: "已确认饭后服用、一天两次，避免饮酒同服。",
      nextStep: "如果服用后明显不适，先停用并咨询医生。",
      keyPoints: ["饭后服用", "早晚各一次", "避免饮酒", "不适时咨询医生"],
      actionPhrase: "请把药名和用量再写一遍，我要保存。"
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
    savedRecord: {
      flowId: "service",
      title: "刚刚的政务窗口沟通",
      place: "政务服务窗口",
      summary: "已确认身份证原件、近期照片，先取综合业务号，再到 3 号窗口办理。",
      nextStep: "明天上午带齐材料，先取号，再到窗口办理。",
      keyPoints: ["身份证原件", "近期照片", "综合业务号", "3 号窗口"],
      actionPhrase: "请再帮我确认还缺哪一项材料。"
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
    savedRecord: {
      flowId: "traffic",
      title: "刚刚的问路沟通",
      place: "地铁站附近",
      summary: "已确认从右手边楼梯进地铁，坐 2 号线到人民广场后换乘 1 号线。",
      nextStep: "按市中心方向进站，不要去对面站台。",
      keyPoints: ["右手边楼梯", "2 号线", "人民广场换乘", "市中心方向"],
      actionPhrase: "请再写一下我要在哪一站换乘。"
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
    savedRecord: {
      flowId: "generic",
      title: "刚刚的现场确认",
      place: "现场沟通",
      summary: "已确认对方愿意用文字配合，并再次写下时间、地点和下一步。",
      nextStep: "根据记录继续追问缺失信息，必要时请对方写下来。",
      keyPoints: ["文字配合", "确认时间", "确认地点", "确认下一步"],
      actionPhrase: "请再帮我把最重要的一句话写下来。"
    }
  }
};

export const initialRecords: RecordItem[] = [
  {
    id: "record-pharmacy",
    flowId: "pharmacy",
    title: "药店问药",
    place: "社区药房",
    time: "今天 14:26",
    summary: "已确认饭后服用、一天两次、不能与酒同服。",
    nextStep: "服用后如明显不适，先停用并咨询医生。",
    keyPoints: ["饭后服用", "早晚各一次", "避免饮酒", "不适时先停用"],
    actionPhrase: "请再帮我写下药名、用量和注意事项。"
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
    actionPhrase: "我想确认还缺哪一项材料，请写给我。"
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
    actionPhrase: "请再写一下我要在哪一站换乘。"
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
      { id: "first-3", text: "我没有听懂，可以换一种方式说吗？", intent: "请求复述" }
    ]
  },
  {
    id: "confirm",
    title: "再确认",
    description: "把容易听错的信息单独确认。",
    phrases: [
      { id: "confirm-1", text: "请写下时间、地点和下一步。", intent: "确认三要素" },
      { id: "confirm-2", text: "请写下药名、用量、一天几次。", intent: "确认用药" },
      { id: "confirm-3", text: "我需要补交哪些材料？", intent: "确认材料" }
    ]
  }
];

export const tabLabels: Record<AppTab, { label: string; mark: string }> = {
  home: { label: "首页", mark: "首" },
  bridge: { label: "开桥", mark: "桥" },
  records: { label: "记录", mark: "记" },
  phrases: { label: "话术", mark: "句" }
};
