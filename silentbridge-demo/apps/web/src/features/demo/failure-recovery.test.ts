import { describe, it, expect } from "vitest";
import { inferFailureScenario, getRecoveryOptions } from "./failure-recovery";

describe("inferFailureScenario", () => {
  it("ASR 失败：error + 无字幕 + 权限非 denied → asr-failed", () => {
    const result = inferFailureScenario({
      asrStatus: "error",
      agentResult: undefined,
      visibleCaptions: [],
      permissionState: "prompt"
    });
    expect(result).toBe("asr-failed");
  });

  it("AI 整理失败：error + 有字幕 + 无 agentResult → agent-failed", () => {
    const result = inferFailureScenario({
      asrStatus: "error",
      agentResult: undefined,
      visibleCaptions: [{ id: "c1", speaker: "药师", text: "你好", time: "刚刚" }],
      permissionState: "granted"
    });
    expect(result).toBe("agent-failed");
  });

  it("麦克风被拒：error + 无字幕 + 权限 denied → microphone-denied", () => {
    const result = inferFailureScenario({
      asrStatus: "error",
      agentResult: undefined,
      visibleCaptions: [],
      permissionState: "denied"
    });
    expect(result).toBe("microphone-denied");
  });

  it("无失败：asrStatus 非 error → none", () => {
    expect(
      inferFailureScenario({
        asrStatus: "done",
        agentResult: { understanding: {} },
        visibleCaptions: [{ id: "c1", speaker: "药师", text: "你好", time: "刚刚" }],
        permissionState: "granted"
      })
    ).toBe("none");
  });

  it("edge case：error + 有字幕 + 有 agentResult → asr-failed（新一轮 ASR 失败）", () => {
    const result = inferFailureScenario({
      asrStatus: "error",
      agentResult: { understanding: {} },
      visibleCaptions: [{ id: "c1", speaker: "药师", text: "你好", time: "刚刚" }],
      permissionState: "granted"
    });
    expect(result).toBe("asr-failed");
  });
});

describe("getRecoveryOptions", () => {
  it("asr-failed → 3 个选项：retry-listen / manual-input / demo-captions", () => {
    const options = getRecoveryOptions("asr-failed");
    expect(options).toHaveLength(3);
    expect(options.map((o) => o.id)).toEqual(["retry-listen", "manual-input", "demo-captions"]);
  });

  it("agent-failed → 3 个选项：retry-agent / view-captions / manual-input", () => {
    const options = getRecoveryOptions("agent-failed");
    expect(options).toHaveLength(3);
    expect(options.map((o) => o.id)).toEqual(["retry-agent", "view-captions", "manual-input"]);
  });

  it("microphone-denied → 2 个选项：manual-input / demo-captions", () => {
    const options = getRecoveryOptions("microphone-denied");
    expect(options).toHaveLength(2);
    expect(options.map((o) => o.id)).toEqual(["manual-input", "demo-captions"]);
  });

  it("none → 空数组", () => {
    expect(getRecoveryOptions("none")).toEqual([]);
  });

  it("每个选项都有非空 label 和 hint", () => {
    const allOptions = [
      ...getRecoveryOptions("asr-failed"),
      ...getRecoveryOptions("agent-failed"),
      ...getRecoveryOptions("microphone-denied")
    ];
    for (const option of allOptions) {
      expect(option.label.trim().length).toBeGreaterThan(0);
      expect(option.hint.trim().length).toBeGreaterThan(0);
    }
  });
});
