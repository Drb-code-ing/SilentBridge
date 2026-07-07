import { describe, it, expect } from "vitest";
import { applyCaptionCorrection } from "./caption-correction";
import type { CaptionLine } from "./demo-content";

const baseCaptions: CaptionLine[] = [
  { id: "c1", speaker: "药师", text: "你好", time: "刚刚" },
  { id: "c2", speaker: "药师", text: "这都要饭后吃一次两片", time: "刚刚" }
];

describe("applyCaptionCorrection", () => {
  it("correctedText 存在时替换最后一条字幕的 text", () => {
    const result = applyCaptionCorrection(baseCaptions, "这个药饭后吃一次两片", "c2");
    expect(result).toHaveLength(2);
    expect(result[0].text).toBe("你好");
    expect(result[1].text).toBe("这个药饭后吃一次两片");
    expect(result[1].id).toBe("c2");
  });

  it("correctedText 为 undefined 时返回原字幕不变", () => {
    const result = applyCaptionCorrection(baseCaptions, undefined, "c2");
    expect(result).toBe(baseCaptions);
  });

  it("correctedText 为空字符串时返回原字幕不变", () => {
    const result = applyCaptionCorrection(baseCaptions, "   ", "c2");
    expect(result).toBe(baseCaptions);
  });

  it("字幕为空数组时返回空数组", () => {
    const result = applyCaptionCorrection([], "这个药饭后吃", "c2");
    expect(result).toEqual([]);
  });

  it("latestCaptionId 不匹配时返回原字幕不变", () => {
    const result = applyCaptionCorrection(baseCaptions, "这个药饭后吃", "not-exist");
    expect(result).toBe(baseCaptions);
  });

  it("不修改原数组（返回新数组）", () => {
    const original = [...baseCaptions];
    const result = applyCaptionCorrection(baseCaptions, "这个药饭后吃一次两片", "c2");
    expect(baseCaptions).toEqual(original);
    expect(result).not.toBe(baseCaptions);
  });

  it("纠错后设置 corrected=true", () => {
    const result = applyCaptionCorrection(baseCaptions, "这个药饭后吃一次两片", "c2");
    expect(result[1].corrected).toBe(true);
  });

  it("纠错后保留 originalText 为旧文本", () => {
    const result = applyCaptionCorrection(baseCaptions, "这个药饭后吃一次两片", "c2");
    expect(result[1].originalText).toBe("这都要饭后吃一次两片");
  });

  it("纠错后 text 为新文本", () => {
    const result = applyCaptionCorrection(baseCaptions, "这个药饭后吃一次两片", "c2");
    expect(result[1].text).toBe("这个药饭后吃一次两片");
  });

  it("未命中 id 时 corrected 仍为 undefined", () => {
    const result = applyCaptionCorrection(baseCaptions, "这个药饭后吃", "not-exist");
    expect(result[1].corrected).toBeUndefined();
  });

  it("原数组未被 mutate（originalText 不变）", () => {
    applyCaptionCorrection(baseCaptions, "这个药饭后吃一次两片", "c2");
    expect(baseCaptions[1].originalText).toBeUndefined();
    expect(baseCaptions[1].corrected).toBeUndefined();
  });
});
