import { describe, it, expect } from "vitest";
import { getPermissionGuide } from "./microphone-permission-guide";
import type { AudioCaptureFailureReason } from "./audio-capture-client";

describe("getPermissionGuide", () => {
  const reasons: AudioCaptureFailureReason[] = [
    "permission-denied",
    "no-device",
    "hardware-error",
    "insecure-context",
    "no-browser-api",
    "no-window",
    "unknown"
  ];

  it("每种 reason 都返回非空 title、至少 1 个 step、非空 fallbackHint", () => {
    for (const reason of reasons) {
      const guide = getPermissionGuide(reason);
      expect(guide.title.trim().length).toBeGreaterThan(0);
      expect(guide.steps.length).toBeGreaterThanOrEqual(1);
      for (const step of guide.steps) {
        expect(step.trim().length).toBeGreaterThan(0);
      }
      expect(guide.fallbackHint.trim().length).toBeGreaterThan(0);
    }
  });

  it("permission-denied：标题含「权限」，步骤含重新授权提示", () => {
    const guide = getPermissionGuide("permission-denied");
    expect(guide.title).toContain("权限");
    const hasKeyword = guide.steps.some(
      (s) => s.includes("锁") || s.includes("允许") || s.includes("刷新")
    );
    expect(hasKeyword).toBe(true);
  });

  it("no-device：标题提及麦克风或设备", () => {
    const guide = getPermissionGuide("no-device");
    expect(guide.title).toMatch(/麦克风|设备/);
  });

  it("hardware-error：标题提及无法使用或占用", () => {
    const guide = getPermissionGuide("hardware-error");
    expect(guide.title).toMatch(/无法|占用|硬件/);
  });

  it("insecure-context：标题提及安全或 HTTPS", () => {
    const guide = getPermissionGuide("insecure-context");
    expect(guide.title).toMatch(/安全|HTTPS|http/);
  });

  it("no-browser-api：标题提及浏览器或不支持", () => {
    const guide = getPermissionGuide("no-browser-api");
    expect(guide.title).toMatch(/浏览器|不支持/);
  });

  it("unknown：标题提及无法使用或异常", () => {
    const guide = getPermissionGuide("unknown");
    expect(guide.title).toMatch(/无法|异常|未知/);
  });

  it("no-window：标题提及环境或浏览器", () => {
    const guide = getPermissionGuide("no-window");
    expect(guide.title).toMatch(/环境|浏览器/);
  });
});
