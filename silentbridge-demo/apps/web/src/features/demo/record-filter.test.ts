import { describe, it, expect } from "vitest";
import { filterRecords } from "./record-filter";
import type { RecordItem } from "./demo-content";

function makeRecord(overrides: Partial<RecordItem> & Pick<RecordItem, "id" | "flowId" | "title">): RecordItem {
  return {
    place: "默认地点",
    time: "刚刚",
    summary: "",
    nextStep: "",
    keyPoints: [],
    actionPhrase: "",
    aiUnderstanding: {
      confirmed: [],
      missing: [],
      risks: [],
      suggestedQuestion: "",
      plainSummary: ""
    },
    ...overrides
  };
}

const baseRecords: RecordItem[] = [
  makeRecord({
    id: "r1",
    flowId: "pharmacy",
    title: "买感冒药",
    place: "社区药店",
    summary: "药师说饭后吃一天两次",
    keyPoints: ["饭后吃", "一天两次", "不要和酒同服"]
  }),
  makeRecord({
    id: "r2",
    flowId: "service",
    title: "办身份证",
    place: "派出所",
    summary: "需要带户口本和照片",
    keyPoints: ["带户口本", "带照片"]
  }),
  makeRecord({
    id: "r3",
    flowId: "traffic",
    title: "问路",
    place: "地铁站",
    summary: "往南走两个路口左转",
    keyPoints: ["往南走", "两个路口", "左转"]
  })
];

describe("filterRecords", () => {
  it("query 为空 + flowIdFilter 为 all 返回全部", () => {
    const result = filterRecords(baseRecords, "", "all");
    expect(result).toHaveLength(3);
  });

  it("query 匹配 title 只返回匹配的", () => {
    const result = filterRecords(baseRecords, "感冒", "all");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("r1");
  });

  it("query 匹配 summary 只返回匹配的", () => {
    const result = filterRecords(baseRecords, "户口本", "all");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("r2");
  });

  it("query 匹配 place 只返回匹配的", () => {
    const result = filterRecords(baseRecords, "地铁", "all");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("r3");
  });

  it("query 匹配 keyPoints 只返回匹配的", () => {
    const result = filterRecords(baseRecords, "左转", "all");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("r3");
  });

  it("query 前后空格被 trim", () => {
    const result = filterRecords(baseRecords, "  感冒  ", "all");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("r1");
  });

  it("flowIdFilter 为具体值只返回该场景", () => {
    const result = filterRecords(baseRecords, "", "pharmacy");
    expect(result).toHaveLength(1);
    expect(result[0].flowId).toBe("pharmacy");
  });

  it("flowIdFilter 为 all 返回全部场景", () => {
    const result = filterRecords(baseRecords, "", "all");
    expect(result).toHaveLength(3);
  });

  it("组合 query 加 flowIdFilter 同时生效", () => {
    const result = filterRecords(baseRecords, "药", "pharmacy");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("r1");
  });

  it("组合 query 匹配但 flowIdFilter 不匹配返回空数组", () => {
    const result = filterRecords(baseRecords, "感冒", "traffic");
    expect(result).toEqual([]);
  });

  it("无匹配时返回空数组", () => {
    const result = filterRecords(baseRecords, "不存在的关键词", "all");
    expect(result).toEqual([]);
  });

  it("不修改原数组", () => {
    const original = [...baseRecords];
    filterRecords(baseRecords, "药", "all");
    expect(baseRecords).toEqual(original);
  });
});
