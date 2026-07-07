import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/services/zhipu-client.js", () => ({
  callZhipuChat: vi.fn(),
}));

import { handleAgentRun } from "../src/routes/agent-run.js";
import { callZhipuChat } from "../src/services/zhipu-client.js";

const mockedCallZhipuChat = vi.mocked(callZhipuChat);

const baseRequest = {
  sessionId: "test-session",
  flowId: "pharmacy",
  transcript: [
    { id: "t1", speaker: "药师", text: "这都要饭后吃一次两片", time: "刚刚" },
  ],
  userMessage: "",
  round: 1,
};

describe("handleAgentRun - correctedText", () => {
  beforeEach(() => {
    vi.resetModules();
    mockedCallZhipuChat.mockReset();
  });

  it("透传 LLM 返回的 correctedText", async () => {
    process.env.ZHIPU_API_KEY = "test-key";

    mockedCallZhipuChat.mockResolvedValue({
      content: JSON.stringify({
        confirmed: ["药品：布洛芬片"],
        missing: [],
        risks: [],
        suggestedQuestion: "请确认",
        plainSummary: "药师说布洛芬饭后吃",
        correctedText: "这个药饭后吃一次两片",
      }),
      usage: { total_tokens: 100 },
    });

    const result = await handleAgentRun(baseRequest);

    expect(result.ok).toBe(true);
    expect(result.provider).toBe("proxy");
    expect(result.correctedText).toBe("这个药饭后吃一次两片");
  });

  it("LLM 不返回 correctedText 时字段为 undefined", async () => {
    process.env.ZHIPU_API_KEY = "test-key";

    mockedCallZhipuChat.mockResolvedValue({
      content: JSON.stringify({
        confirmed: ["药品：布洛芬片"],
        missing: [],
        risks: [],
        suggestedQuestion: "请确认",
        plainSummary: "药师说布洛芬饭后吃",
      }),
      usage: { total_tokens: 100 },
    });

    const result = await handleAgentRun(baseRequest);

    expect(result.ok).toBe(true);
    expect(result.correctedText).toBeUndefined();
  });

  it("无 API Key 时 fallback 响应中 correctedText 为 undefined", async () => {
    delete process.env.ZHIPU_API_KEY;

    const result = await handleAgentRun(baseRequest);

    expect(result.ok).toBe(true);
    expect(result.provider).toBe("fallback");
    expect(result.correctedText).toBeUndefined();
  });
});
