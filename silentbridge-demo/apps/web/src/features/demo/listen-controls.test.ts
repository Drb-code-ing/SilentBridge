import { describe, expect, it } from "vitest";
import { resolveListenPrimaryControl } from "./listen-controls";

describe("resolveListenPrimaryControl", () => {
  it("recording uses stop-recognize not cancel", () => {
    const state = resolveListenPrimaryControl({
      captionsDone: false,
      hasAgentResult: false,
      captureMode: "recording",
      isCapturing: true,
      asrStatus: "listening"
    });
    expect(state.action).toBe("stop-recognize");
    expect(state.label).toBe("停止并识别");
    expect(state.disabled).toBe(false);
    expect(state.showStopTwin).toBe(false);
    expect(state.showAbandon).toBe(true);
  });

  it("requesting mic can cancel without recognize", () => {
    const state = resolveListenPrimaryControl({
      captionsDone: false,
      hasAgentResult: false,
      captureMode: "recording",
      isCapturing: false,
      asrStatus: "requesting"
    });
    expect(state.action).toBe("stop-cancel");
    expect(state.label).toBe("取消请求");
  });

  it("demo capture stops via cancel", () => {
    const state = resolveListenPrimaryControl({
      captionsDone: false,
      hasAgentResult: false,
      captureMode: "fallback-demo",
      isCapturing: true,
      asrStatus: "fallback"
    });
    expect(state.action).toBe("stop-cancel");
    expect(state.label).toBe("停止演示");
    expect(state.disabled).toBe(false);
  });

  it("done with agent result saves", () => {
    const state = resolveListenPrimaryControl({
      captionsDone: true,
      hasAgentResult: true,
      captureMode: "idle",
      isCapturing: false,
      asrStatus: "done"
    });
    expect(state.action).toBe("save");
    expect(state.label).toBe("保存这次重点");
  });

  it("captions without agent allows re-listen on same page", () => {
    const state = resolveListenPrimaryControl({
      captionsDone: true,
      hasAgentResult: false,
      captureMode: "idle",
      isCapturing: false,
      asrStatus: "idle"
    });
    expect(state.action).toBe("start");
    expect(state.label).toBe("重新收听");
    expect(state.disabled).toBe(false);
  });

  it("idle starts listening", () => {
    const state = resolveListenPrimaryControl({
      captionsDone: false,
      hasAgentResult: false,
      captureMode: "idle",
      isCapturing: false,
      asrStatus: "idle"
    });
    expect(state.action).toBe("start");
    expect(state.label).toBe("开始收听");
  });
});
