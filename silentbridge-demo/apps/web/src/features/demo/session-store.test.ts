import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  canCreateRecordFromSession,
  createCommunicationSession,
  createRecordFromSession,
  loadStoredRecords,
  persistRecords
} from "./session-store";
import { demoFlows } from "./demo-content";
import type { CommunicationSession } from "./session-types";
import type { AgentRunResult } from "./agent-graph";

const understanding = {
  confirmed: ["判断：咽喉炎"],
  missing: ["药名未写清"],
  risks: [{ level: "high" as const, text: "胸闷高烧需急诊" }],
  suggestedQuestion: "请写清楚药名",
  plainSummary: "医生判断为咽喉炎，需关注急诊红线。"
};

function sessionWithRound(): CommunicationSession {
  const base = createCommunicationSession({
    flowId: "clinic",
    sourceLabel: "医院问诊",
    prompt: "请说慢一点"
  });
  return {
    ...base,
    rounds: [
      {
        id: "r1",
        roundIndex: 1,
        prompt: base.currentPrompt,
        transcript: [
          {
            id: "t1",
            speaker: "医生",
            text: "这次是咽喉炎",
            time: "00:01"
          }
        ],
        understanding,
        provider: "fallback",
        createdAt: Date.now()
      }
    ]
  };
}

describe("record persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("requires at least one understood round before save", () => {
    const empty = createCommunicationSession({
      flowId: "generic",
      sourceLabel: "通用沟通",
      prompt: "你好"
    });
    expect(canCreateRecordFromSession(empty)).toBe(false);
    expect(createRecordFromSession({ session: empty, flow: demoFlows.generic })).toBeNull();
  });

  it("creates structured record from session understanding", () => {
    const record = createRecordFromSession({
      session: sessionWithRound(),
      flow: demoFlows.clinic,
      now: new Date("2026-07-11T10:05:00")
    });
    expect(record).not.toBeNull();
    expect(record!.flowId).toBe("clinic");
    expect(record!.summary).toContain("咽喉炎");
    expect(record!.time).toMatch(/7\/11/);
    expect(record!.aiUnderstanding.confirmed).toContain("判断：咽喉炎");
  });

  it("persists and reloads records from localStorage", () => {
    const record = createRecordFromSession({
      session: sessionWithRound(),
      flow: demoFlows.clinic
    })!;
    const result = persistRecords([record]);
    expect(result.ok).toBe(true);

    const loaded = loadStoredRecords([]);
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe(record.id);
    expect(loaded[0].summary).toBe(record.summary);
  });

  it("returns fallback seeds when storage empty", () => {
    const seeds = [
      {
        id: "seed",
        flowId: "generic" as const,
        title: "种子",
        place: "本地",
        time: "今天",
        summary: "种子摘要",
        nextStep: "下一步",
        keyPoints: ["a"],
        actionPhrase: "确认",
        aiUnderstanding: understanding
      }
    ];
    expect(loadStoredRecords(seeds)).toEqual(seeds);
  });

  it("reports failure when localStorage throws", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    const result = persistRecords([
      createRecordFromSession({ session: sessionWithRound(), flow: demoFlows.clinic })!
    ]);
    expect(result.ok).toBe(false);
    spy.mockRestore();
  });
});

// silence unused type import in some bundlers
void (0 as unknown as AgentRunResult);
