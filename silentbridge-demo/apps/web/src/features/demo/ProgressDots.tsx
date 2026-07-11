import type { BridgeStep } from "./demo-content";

type ProgressStepId = BridgeStep | "understand" | "save";

export function ProgressDots({
  step,
  hasUnderstanding = false,
  hasSaved = false
}: {
  step: BridgeStep;
  hasUnderstanding?: boolean;
  hasSaved?: boolean;
}) {
  const steps: Array<{ id: ProgressStepId; label: string }> = [
    { id: "show", label: "出示" },
    { id: "listen", label: "收听" },
    { id: "understand", label: "理解" },
    { id: "save", label: "留下" }
  ];

  const activeIndex = (() => {
    if (hasSaved) return 3;
    if (hasUnderstanding || (step === "listen" && hasUnderstanding)) return 2;
    if (step === "listen") return 1;
    return 0;
  })();

  return (
    <div className="sb-progress sb-progress--four" aria-label="沟通步骤">
      {steps.map((item, index) => (
        <div
          className={index <= activeIndex ? "sb-progress__item is-active" : "sb-progress__item"}
          key={item.id}
        >
          <span>{index + 1}</span>
          <strong>{item.label}</strong>
        </div>
      ))}
    </div>
  );
}
