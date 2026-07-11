import { describe, expect, it } from "vitest";
import { defaultFlowId, defaultMessage, defaultSourceLabel, demoFlows } from "./demo-content";
import { inferFlowIdFromText } from "./real-input-engine";

describe("default session scenario", () => {
  it("defaults to generic not clinic", () => {
    expect(defaultFlowId).toBe("generic");
    expect(demoFlows[defaultFlowId].id).toBe("generic");
    expect(defaultSourceLabel).toBe("通用沟通");
  });

  it("default opener does not infer medical clinic", () => {
    expect(inferFlowIdFromText(defaultMessage)).toBe("generic");
  });

  it("generic captions are not medical scripts", () => {
    const text = demoFlows.generic.captions.map((line) => line.text).join(" ");
    expect(text).not.toMatch(/咽喉炎|急诊|复诊/);
    expect(text).toMatch(/时间|地点|下一步|文字/);
  });
});
