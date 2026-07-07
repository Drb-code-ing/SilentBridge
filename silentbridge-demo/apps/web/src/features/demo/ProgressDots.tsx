import type { BridgeStep } from "./demo-content";

export function ProgressDots({ step }: { step: BridgeStep }) {
  const steps: Array<{ id: BridgeStep; label: string }> = [
    { id: "show", label: "给对方看" },
    { id: "listen", label: "听对方说" }
  ];
  const activeIndex = steps.findIndex((item) => item.id === step);

  return (
    <div className="sb-progress sb-progress--two" aria-label="沟通步骤">
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
