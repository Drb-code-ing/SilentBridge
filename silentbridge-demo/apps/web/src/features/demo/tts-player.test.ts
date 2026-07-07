import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createTtsPlayer } from "./tts-player";

describe("createTtsPlayer", () => {
  const originalSpeechSynthesis = window.speechSynthesis;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    Object.defineProperty(window, "speechSynthesis", {
      value: originalSpeechSynthesis,
      writable: true,
      configurable: true
    });
  });

  it("speechSynthesis 存在时 isAvailable 返回 true", () => {
    const mockSynth = {
      speak: vi.fn(),
      cancel: vi.fn(),
      getVoices: vi.fn(() => [])
    };
    Object.defineProperty(window, "speechSynthesis", {
      value: mockSynth,
      writable: true,
      configurable: true
    });

    const player = createTtsPlayer();
    expect(player.isAvailable()).toBe(true);
  });

  it("speechSynthesis 不存在时 isAvailable 返回 false", () => {
    Object.defineProperty(window, "speechSynthesis", {
      value: undefined,
      writable: true,
      configurable: true
    });

    const player = createTtsPlayer();
    expect(player.isAvailable()).toBe(false);
  });

  it("不可用时 speak 返回 false 且不抛错", () => {
    Object.defineProperty(window, "speechSynthesis", {
      value: undefined,
      writable: true,
      configurable: true
    });

    const player = createTtsPlayer();
    expect(player.speak("你好")).toBe(false);
  });

  it("可用时 speak 调用 speechSynthesis.speak 并返回 true", () => {
    const mockSynth = {
      speak: vi.fn(),
      cancel: vi.fn(),
      getVoices: vi.fn(() => [])
    };
    Object.defineProperty(window, "speechSynthesis", {
      value: mockSynth,
      writable: true,
      configurable: true
    });

    const player = createTtsPlayer();
    const result = player.speak("请确认药品用量");

    expect(result).toBe(true);
    expect(mockSynth.cancel).toHaveBeenCalled();
    expect(mockSynth.speak).toHaveBeenCalledTimes(1);
    const utterance = mockSynth.speak.mock.calls[0][0];
    expect(utterance).toBeInstanceOf(SpeechSynthesisUtterance);
    expect(utterance.text).toBe("请确认药品用量");
    expect(utterance.lang).toBe("zh-CN");
  });

  it("空字符串 speak 返回 false 不调用", () => {
    const mockSynth = {
      speak: vi.fn(),
      cancel: vi.fn(),
      getVoices: vi.fn(() => [])
    };
    Object.defineProperty(window, "speechSynthesis", {
      value: mockSynth,
      writable: true,
      configurable: true
    });

    const player = createTtsPlayer();
    expect(player.speak("   ")).toBe(false);
    expect(mockSynth.speak).not.toHaveBeenCalled();
  });

  it("stop 调用 speechSynthesis.cancel", () => {
    const mockSynth = {
      speak: vi.fn(),
      cancel: vi.fn(),
      getVoices: vi.fn(() => [])
    };
    Object.defineProperty(window, "speechSynthesis", {
      value: mockSynth,
      writable: true,
      configurable: true
    });

    const player = createTtsPlayer();
    player.stop();
    expect(mockSynth.cancel).toHaveBeenCalled();
  });

  it("不可用时 stop 不抛错", () => {
    Object.defineProperty(window, "speechSynthesis", {
      value: undefined,
      writable: true,
      configurable: true
    });

    const player = createTtsPlayer();
    expect(() => player.stop()).not.toThrow();
  });
});
