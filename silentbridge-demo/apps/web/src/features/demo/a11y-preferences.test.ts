import { describe, expect, it } from "vitest";
import { cycleTextScale, textScaleLabel } from "./a11y-preferences";

describe("a11y preferences helpers", () => {
  it("cycles text scale", () => {
    expect(cycleTextScale("normal")).toBe("large");
    expect(cycleTextScale("large")).toBe("xlarge");
    expect(cycleTextScale("xlarge")).toBe("normal");
  });

  it("labels text scale", () => {
    expect(textScaleLabel("normal")).toBe("标准");
    expect(textScaleLabel("large")).toBe("大字");
    expect(textScaleLabel("xlarge")).toBe("特大");
  });
});
