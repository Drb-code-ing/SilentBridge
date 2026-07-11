import { describe, expect, it } from "vitest";
import { buildShareText } from "./share-record";
import type { RecordItem } from "./demo-content";

const sample: RecordItem = {
  id: "r1",
  flowId: "clinic",
  title: "门诊问诊",
  place: "门诊诊室",
  time: "刚刚",
  summary: "咽喉炎，连吃三天，有急诊红线。",
  nextStep: "补齐药名并观察急诊信号",
  keyPoints: ["咽喉炎", "连吃三天"],
  actionPhrase: "请写清楚药名",
  aiUnderstanding: {
    confirmed: ["判断：咽喉炎"],
    missing: ["药名未写清"],
    risks: [{ level: "high", text: "胸闷高烧需急诊" }],
    suggestedQuestion: "请写清楚药名和每天几次",
    plainSummary: "已确认咽喉炎与急诊红线"
  }
};

describe("buildShareText", () => {
  it("includes title summary risks and footer", () => {
    const text = buildShareText(sample);
    expect(text).toContain("【无声桥沟通记录】门诊问诊");
    expect(text).toContain("摘要：咽喉炎");
    expect(text).toContain("待确认：");
    expect(text).toContain("[high] 胸闷高烧需急诊");
    expect(text).toContain("由 SilentBridge 无声桥整理");
  });
});
