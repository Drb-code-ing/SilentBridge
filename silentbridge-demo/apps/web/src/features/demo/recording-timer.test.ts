import { describe, it, expect } from "vitest";
import { formatRecordingDuration } from "./recording-timer";

describe("formatRecordingDuration", () => {
  it("0 秒 → 00:00", () => {
    expect(formatRecordingDuration(0)).toBe("00:00");
  });

  it("5 秒 → 00:05", () => {
    expect(formatRecordingDuration(5)).toBe("00:05");
  });

  it("65 秒 → 01:05", () => {
    expect(formatRecordingDuration(65)).toBe("01:05");
  });

  it("3661 秒 → 61:01（超过 1 小时仍用 MM:SS）", () => {
    expect(formatRecordingDuration(3661)).toBe("61:01");
  });

  it("负数按 0 处理", () => {
    expect(formatRecordingDuration(-10)).toBe("00:00");
  });

  it("小数向下取整", () => {
    expect(formatRecordingDuration(5.9)).toBe("00:05");
  });
});
