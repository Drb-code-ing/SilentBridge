import { describe, expect, it } from "vitest";
import { createUnderstandingFromTranscript, inferFlowIdFromText } from "./real-input-engine";
import { demoFlows } from "./demo-content";

describe("createUnderstandingFromTranscript", () => {
  it("uses curated understanding for preset clinic captions", () => {
    const flow = demoFlows.clinic;
    const result = createUnderstandingFromTranscript({
      flow,
      transcript: flow.captions,
      userMessage: flow.captions[0]?.text ?? ""
    });

    expect(result.confirmed).toEqual(flow.aiUnderstanding.confirmed);
    expect(result.suggestedQuestion).toBe(flow.aiUnderstanding.suggestedQuestion);
    expect(result.risks.some((risk) => risk.level === "high")).toBe(true);
  });

  it("uses curated understanding for preset pharmacy captions", () => {
    const flow = demoFlows.pharmacy;
    const result = createUnderstandingFromTranscript({
      flow,
      transcript: flow.captions,
      userMessage: flow.captions[0]?.text ?? ""
    });

    expect(result.confirmed).toEqual(flow.aiUnderstanding.confirmed);
    expect(result.suggestedQuestion).toBe(flow.aiUnderstanding.suggestedQuestion);
    expect(result.risks.some((risk) => risk.level === "high")).toBe(true);
  });

  it("extracts full dosage and alcohol risk from free medical text", () => {
    const flow = demoFlows.pharmacy;
    const result = createUnderstandingFromTranscript({
      flow,
      transcript: [
        {
          id: "m1",
          speaker: "药师",
          time: "00:01",
          text: "这个阿莫西林胶囊饭后吃，一天两次，早晚各一次，不要和酒一起服用。"
        }
      ],
      userMessage: "请告诉我怎么吃"
    });

    expect(result.confirmed.join(" ")).toMatch(/阿莫西林|胶囊/);
    expect(result.confirmed.join(" ")).toMatch(/饭后|一天两次|早晚/);
    expect(result.confirmed.join(" ")).toMatch(/不要和酒一起服用/);
    expect(result.risks.some((risk) => risk.level === "high")).toBe(true);
    expect(result.suggestedQuestion.length).toBeGreaterThan(8);
  });

  it("extracts clinic emergency red line from free text", () => {
    const flow = demoFlows.clinic;
    const result = createUnderstandingFromTranscript({
      flow,
      transcript: [
        {
          id: "c1",
          speaker: "医生",
          time: "00:01",
          text: "这次主要是咽喉炎，先连续吃三天。如果出现胸闷、持续高烧，不能等复诊，要马上来急诊。"
        }
      ],
      userMessage: "请告诉我要注意什么"
    });

    expect(result.confirmed.join(" ")).toMatch(/咽喉炎/);
    expect(result.confirmed.join(" ") + result.risks.map((r) => r.text).join(" ")).toMatch(/急诊|胸闷|高烧/);
    expect(result.risks.some((risk) => risk.level === "high")).toBe(true);
  });

  it("extracts service window and materials", () => {
    const flow = demoFlows.service;
    const result = createUnderstandingFromTranscript({
      flow,
      transcript: [
        {
          id: "s1",
          speaker: "工作人员",
          time: "00:01",
          text: "需要身份证原件和一张近期照片，先取综合业务号，然后到 3 号窗口办理，今天来不及可以明天上午再来。"
        }
      ],
      userMessage: "要带什么"
    });

    expect(result.confirmed.join(" ")).toMatch(/身份证|照片/);
    expect(result.confirmed.join(" ")).toMatch(/3\s*号窗口|窗口/);
    expect(result.confirmed.join(" ")).toMatch(/取号|步骤/);
  });

  it("extracts traffic direction and reverse risk", () => {
    const flow = demoFlows.traffic;
    const result = createUnderstandingFromTranscript({
      flow,
      transcript: [
        {
          id: "t1",
          speaker: "路人",
          time: "00:01",
          text: "从右手边楼梯下去，坐 2 号线到人民广场换乘 1 号线，不要去对面站台，方向是往市中心。"
        }
      ],
      userMessage: "怎么走"
    });

    expect(result.confirmed.join(" ")).toMatch(/右手边|2\s*号线|市中心/);
    expect(result.risks.some((risk) => /对面|坐反|方向/.test(risk.text))).toBe(true);
  });

  it("infers flow ids from keywords", () => {
    expect(inferFlowIdFromText("门诊医生说三天后复诊")).toBe("clinic");
    expect(inferFlowIdFromText("药店药师说这个胶囊饭后吃")).toBe("pharmacy");
    expect(inferFlowIdFromText("到3号窗口办理需要身份证")).toBe("service");
    expect(inferFlowIdFromText("地铁2号线怎么换乘")).toBe("traffic");
  });
});
