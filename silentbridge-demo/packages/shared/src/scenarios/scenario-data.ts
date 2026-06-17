import type { Scenario, ScenarioId } from "./scenario-types";

export const scenarios: Record<ScenarioId, Scenario> = {
  "medical": {
    id: "medical",
    name: "医院问诊",
    shortName: "医院",
    description: "与医生沟通病情、用药和复诊安排",
    userGoal: "了解病情诊断、用药方案和复诊时间",
    transcript: [
      {
        id: "t1",
        speaker: "doctor",
        speakerLabel: "医生",
        text: "根据检查结果，你需要服用两种药物，每天早晚各一次。",
        emphasis: true,
        timestamp: "00:01"
      },
      {
        id: "t2",
        speaker: "doctor",
        speakerLabel: "医生",
        text: "如果出现胸闷或持续高烧，不要等复诊，要马上来急诊。",
        emphasis: true,
        timestamp: "00:05"
      },
      {
        id: "t3",
        speaker: "doctor",
        speakerLabel: "医生",
        text: "下周三上午再来复查，记得空腹来抽血。",
        timestamp: "00:08"
      }
    ],
    insights: [
      {
        id: "i1",
        title: "用药提醒",
        items: ["每天早晚各服用一次药物", "出现胸闷或高烧需立即前往急诊", "下周三上午复查，需空腹"],
        severity: "attention"
      }
    ],
    replySuggestions: [
      {
        id: "r1",
        label: "确认用药",
        text: "请问这两种药具体是什么名字？有没有什么副作用需要注意？",
        intent: "clarify"
      }
    ],
    quickCards: [
      {
        id: "q1",
        text: "请说慢一点",
        category: "repeat"
      },
      {
        id: "q2",
        text: "我听不见，但可以通过文字沟通",
        category: "accessibility"
      }
    ],
    summary: {
      scenarioId: "medical",
      keyPoints: ["需服用两种药物，每天早晚各一次", "出现胸闷或高烧需立即就诊", "下周三上午空腹复查"],
      toConfirm: ["药物名称和副作用", "具体用药时间"],
      nextActions: ["按时服药", "下周三上午前往医院复查"],
      shareText: "医院问诊摘要：医生建议服用两种药物，每天早晚各一次；出现胸闷或高烧需立即前往急诊；下周三上午空腹复查。"
    }
  },
  "interview": {
    id: "interview",
    name: "求职面试",
    shortName: "面试",
    description: "与面试官沟通工作经历、能力和期望",
    userGoal: "理解面试官问题意图，给出得体回答",
    transcript: [
      {
        id: "t1",
        speaker: "interviewer",
        speakerLabel: "面试官",
        text: "请介绍一下你过去三年最有成就感的一个项目。",
        emphasis: true,
        timestamp: "00:02"
      },
      {
        id: "t2",
        speaker: "interviewer",
        speakerLabel: "面试官",
        text: "这个项目中遇到最大的挑战是什么？你是如何解决的？",
        timestamp: "00:06"
      },
      {
        id: "t3",
        speaker: "interviewer",
        speakerLabel: "面试官",
        text: "你对我们公司了解多少？为什么想来这里工作？",
        timestamp: "00:10"
      }
    ],
    insights: [
      {
        id: "i1",
        title: "问题分析",
        items: ["面试官希望了解项目经验和解决问题的能力", "考察对公司的了解程度和求职动机", "需要用STAR法则组织回答"],
        severity: "info"
      }
    ],
    replySuggestions: [
      {
        id: "r1",
        label: "回答框架",
        text: "我可以用STAR法则来回答这个问题吗？先介绍背景和目标，再讲行动和结果。",
        intent: "confirm"
      }
    ],
    quickCards: [
      {
        id: "q1",
        text: "请写下关键词",
        category: "repeat"
      },
      {
        id: "q2",
        text: "我需要确认时间和费用",
        category: "confirm"
      }
    ],
    summary: {
      scenarioId: "interview",
      keyPoints: ["面试官关注项目经验和解决问题能力", "需要展示对公司的了解", "建议使用STAR法则回答"],
      toConfirm: ["公司的核心业务方向", "岗位的具体职责"],
      nextActions: ["准备项目案例的详细介绍", "研究公司背景和产品"],
      shareText: "面试摘要：面试官询问了项目经验、挑战解决方法和求职动机；建议使用STAR法则组织回答。"
    }
  },
  "classroom": {
    id: "classroom",
    name: "课堂会议",
    shortName: "课堂",
    description: "参与课程学习或团队会议",
    userGoal: "记录重点内容，整理待办事项",
    transcript: [
      {
        id: "t1",
        speaker: "teacher",
        speakerLabel: "老师",
        text: "本周的作业是完成第三章的练习题，下周一之前提交到学习平台。",
        emphasis: true,
        timestamp: "00:03"
      },
      {
        id: "t2",
        speaker: "teacher",
        speakerLabel: "老师",
        text: "下周三我们进行期中考试，范围是第一章到第四章的全部内容。",
        emphasis: true,
        timestamp: "00:07"
      },
      {
        id: "t3",
        speaker: "teacher",
        speakerLabel: "老师",
        text: "复习时重点关注数据结构和算法部分，这部分占总分的40%。",
        timestamp: "00:11"
      }
    ],
    insights: [
      {
        id: "i1",
        title: "学习重点",
        items: ["本周作业：第三章练习题，下周一提交", "期中考试：下周三，范围第一章到第四章", "重点复习：数据结构和算法，占40%"],
        severity: "attention"
      }
    ],
    replySuggestions: [
      {
        id: "r1",
        label: "确认时间",
        text: "请问期中考试是上午还是下午？需要提前准备什么材料吗？",
        intent: "confirm"
      }
    ],
    quickCards: [
      {
        id: "q1",
        text: "请说慢一点",
        category: "repeat"
      },
      {
        id: "q2",
        text: "我听不见，但可以通过文字沟通",
        category: "accessibility"
      }
    ],
    summary: {
      scenarioId: "classroom",
      keyPoints: ["本周作业：第三章练习题，下周一提交", "期中考试：下周三，范围第一章到第四章", "重点复习：数据结构和算法"],
      toConfirm: ["考试具体时间", "是否需要携带证件"],
      nextActions: ["完成第三章练习题", "复习第一章到第四章内容", "重点复习数据结构和算法"],
      shareText: "课堂摘要：本周作业是第三章练习题，下周一提交；下周三进行期中考试，范围第一章到第四章；数据结构和算法占40%。"
    }
  },
  "public-service": {
    id: "public-service",
    name: "政务窗口",
    shortName: "政务",
    description: "在政务大厅办理业务",
    userGoal: "了解办理流程，准备所需材料",
    transcript: [
      {
        id: "t1",
        speaker: "staff",
        speakerLabel: "工作人员",
        text: "办理这个业务需要身份证原件和复印件，还有户口本的相关页。",
        emphasis: true,
        timestamp: "00:02"
      },
      {
        id: "t2",
        speaker: "staff",
        speakerLabel: "工作人员",
        text: "先去3号窗口排队审核材料，审核通过后再来这里缴费。",
        timestamp: "00:05"
      },
      {
        id: "t3",
        speaker: "staff",
        speakerLabel: "工作人员",
        text: "缴费后三个工作日可以来领取结果，也可以选择邮寄到家。",
        timestamp: "00:08"
      }
    ],
    insights: [
      {
        id: "i1",
        title: "办理清单",
        items: ["所需材料：身份证原件+复印件、户口本相关页", "步骤：先去3号窗口审核材料，再到本窗口缴费", "领取：缴费后3个工作日，可选择现场领取或邮寄"],
        severity: "info"
      }
    ],
    replySuggestions: [
      {
        id: "r1",
        label: "确认邮寄",
        text: "邮寄到家需要额外付费吗？大概需要多长时间？",
        intent: "clarify"
      }
    ],
    quickCards: [
      {
        id: "q1",
        text: "请写下关键词",
        category: "repeat"
      },
      {
        id: "q2",
        text: "我需要确认时间和费用",
        category: "confirm"
      }
    ],
    summary: {
      scenarioId: "public-service",
      keyPoints: ["所需材料：身份证原件+复印件、户口本相关页", "步骤：先去3号窗口审核，再缴费", "领取：3个工作日后可现场领取或邮寄"],
      toConfirm: ["邮寄费用和时间", "是否需要预约"],
      nextActions: ["准备身份证和户口本材料", "前往3号窗口审核", "审核通过后缴费"],
      shareText: "政务办理摘要：需准备身份证原件+复印件、户口本相关页；先去3号窗口审核，审核通过后缴费；3个工作日后可现场领取或邮寄。"
    }
  }
};

export const scenarioIds: ScenarioId[] = ["medical", "interview", "classroom", "public-service"];

export function getScenario(id: ScenarioId): Scenario {
  return scenarios[id];
}
