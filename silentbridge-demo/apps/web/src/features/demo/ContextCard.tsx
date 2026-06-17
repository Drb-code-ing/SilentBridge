import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/StatusBadge";
import type { CommunicationContext, RiskLevel } from "@silentbridge/shared";

interface ContextCardProps {
  context: CommunicationContext;
  onReset: () => void;
}

const riskLabels: Record<RiskLevel, string> = {
  normal: "普通沟通",
  attention: "需要确认",
  critical: "涉及健康安全"
};

const modeLabels: Record<string, string> = {
  caption: "字幕",
  "big-text": "大字",
  confirm: "确认",
  summary: "摘要"
};

export function ContextCard({ context, onReset }: ContextCardProps) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="label-mono mb-1 text-[11px] font-bold text-neutral-500">
            ACTIVE CONTEXT
          </p>
          <h3 className="text-xl font-black leading-tight text-neutral-950">
            {context.title}
          </h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onReset}>
          重置
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <span className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700">
          {context.source === "preset" ? "推荐场景" : "自定义情境"}
        </span>
        <StatusBadge level={context.riskLevel} label={riskLabels[context.riskLevel]} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-neutral-950 p-4 text-white">
          <p className="label-mono text-[10px] font-bold text-white/55">ROLE</p>
          <p className="mt-2 text-lg font-black">{context.counterpartRole}</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <p className="label-mono text-[10px] font-bold text-neutral-400">GOAL</p>
          <p className="mt-2 text-sm font-semibold leading-5 text-neutral-900">
            {context.userGoal}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {context.assistModes.map((mode) => (
          <span
            key={mode}
            className="rounded-full bg-mint-50 px-3 py-1.5 text-xs font-bold text-mint-800"
          >
            {modeLabels[mode] ?? mode}
          </span>
        ))}
      </div>
    </Card>
  );
}
