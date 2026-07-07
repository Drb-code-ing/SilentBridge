import { describe, it, expect } from "vitest";
import { isAgentLoading } from "./agent-loading-state";

describe("isAgentLoading", () => {
  it("transcribing + 有字幕 + 无 result → true", () => {
    expect(isAgentLoading({
      asrStatus: "transcribing",
      visibleCaptions: [{ id: "c1", speaker: "药师", text: "你好", time: "刚刚" }],
      agentResult: undefined
    })).toBe(true);
  });

  it("transcribing + 无字幕 → false", () => {
    expect(isAgentLoading({
      asrStatus: "transcribing",
      visibleCaptions: [],
      agentResult: undefined
    })).toBe(false);
  });

  it("done + 有 result → false", () => {
    expect(isAgentLoading({
      asrStatus: "done",
      visibleCaptions: [{ id: "c1", speaker: "药师", text: "你好", time: "刚刚" }],
      agentResult: { graphName: "test" }
    })).toBe(false);
  });

  it("idle → false", () => {
    expect(isAgentLoading({
      asrStatus: "idle",
      visibleCaptions: [],
      agentResult: undefined
    })).toBe(false);
  });

  it("error → false", () => {
    expect(isAgentLoading({
      asrStatus: "error",
      visibleCaptions: [{ id: "c1", speaker: "药师", text: "你好", time: "刚刚" }],
      agentResult: undefined
    })).toBe(false);
  });

  it("transcribing + 有字幕 + 有 result → false", () => {
    expect(isAgentLoading({
      asrStatus: "transcribing",
      visibleCaptions: [{ id: "c1", speaker: "药师", text: "你好", time: "刚刚" }],
      agentResult: { graphName: "test" }
    })).toBe(false);
  });
});
