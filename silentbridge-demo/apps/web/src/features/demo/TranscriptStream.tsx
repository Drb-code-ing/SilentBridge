import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import type { TranscriptLine } from "@silentbridge/shared";

interface TranscriptStreamProps {
  lines: TranscriptLine[];
  isSimulating: boolean;
  allLines: TranscriptLine[];
  onStartSimulation: () => void;
  onReset: () => void;
  step?: number;
}

export function TranscriptStream({
  lines,
  isSimulating,
  allLines,
  onStartSimulation,
  onReset,
  step = 2
}: TranscriptStreamProps) {
  const isComplete = lines.length === allLines.length && lines.length > 0;

  return (
    <div className="animate-step-enter" style={{ animationDelay: `${(step - 1) * 80}ms` }}>
      <Card className="p-4 sm:p-5" variant="solid">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-mint-500 text-sm font-black text-white">
              {step}
            </div>
            <div>
              <p className="label-mono mb-0.5 text-[11px] font-bold text-mint-700">
                STEP {step}
              </p>
              <h3 className="text-xl font-black text-neutral-950">听见现场</h3>
            </div>
          </div>
          <span className="label-mono rounded-full bg-neutral-950 px-3 py-1.5 text-[11px] font-bold text-white">
            {lines.length}/{allLines.length}
          </span>
        </div>

        <div className="mb-4 grid grid-cols-[1fr_auto] gap-2">
          <Button onClick={onStartSimulation} disabled={allLines.length === 0} size="md">
            {isSimulating ? "接收中" : isComplete ? "重新模拟" : "开始接收"}
          </Button>
          <Button onClick={onReset} variant="secondary" size="md" disabled={lines.length === 0}>
            清空
          </Button>
        </div>

        <div className="max-h-[22rem] space-y-3 overflow-y-auto pr-1">
          {lines.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white/62 p-6 text-center">
              <p className="text-base font-black text-neutral-900">等待字幕输入</p>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                点击开始接收后，对话会逐句进入。重点句会自动高亮。
              </p>
            </div>
          ) : (
            lines.map((line, index) => {
              const isLatest = index === lines.length - 1;
              const shouldHighlight = isLatest || line.emphasis;

              return (
                <article
                  key={line.id}
                  className={`animate-fade-in-up rounded-2xl border p-4 ${
                    shouldHighlight
                      ? "animate-pulse-highlight border-mint-300 bg-mint-50"
                      : "border-neutral-200 bg-white/78"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-950 text-sm font-black text-white">
                        {line.speakerLabel.slice(0, 1)}
                      </span>
                      <span className="text-sm font-bold text-neutral-700">
                        {line.speakerLabel}
                      </span>
                    </div>
                    {line.timestamp && (
                      <span className="label-mono text-[11px] font-bold text-neutral-400">
                        {line.timestamp}
                      </span>
                    )}
                  </div>
                  <p className="text-[17px] font-semibold leading-7 text-neutral-950">
                    {line.text}
                  </p>
                </article>
              );
            })
          )}
        </div>

        {isSimulating && lines.length < allLines.length && (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-4 py-3 text-white">
            <span className="h-2 w-2 rounded-full bg-mint-300 animate-typing" />
            <span className="h-2 w-2 rounded-full bg-mint-300 animate-typing [animation-delay:160ms]" />
            <span className="h-2 w-2 rounded-full bg-mint-300 animate-typing [animation-delay:320ms]" />
            <span className="ml-2 text-sm font-semibold">正在接收字幕</span>
          </div>
        )}
      </Card>
    </div>
  );
}