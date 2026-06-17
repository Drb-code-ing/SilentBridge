import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { PresetScenarioGrid } from "./PresetScenarioGrid";
import type { ScenarioId } from "@silentbridge/shared";

interface CommunicationStarterProps {
  selectedScenarioId?: ScenarioId;
  customInput: string;
  onSelectScenario: (id: ScenarioId) => void;
  onCustomInputChange: (value: string) => void;
  onGenerateTask: () => void;
}

export function CommunicationStarter({
  selectedScenarioId,
  customInput,
  onSelectScenario,
  onCustomInputChange,
  onGenerateTask
}: CommunicationStarterProps) {
  const canGenerate = Boolean(selectedScenarioId || customInput.trim());

  return (
    <Card className="p-4 sm:p-5" variant="solid">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="label-mono mb-1 text-[11px] font-bold text-mint-700">
            START A TASK
          </p>
          <h2 className="text-2xl font-black leading-tight text-neutral-950 text-balance">
            现在要和谁沟通？
          </h2>
        </div>
        <span className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-700">
          手机优先
        </span>
      </div>

      <label className="mb-2 block text-sm font-semibold text-neutral-800">
        直接描述当前情境
      </label>
      <div className="relative">
        <textarea
          value={customInput}
          onChange={(event) => onCustomInputChange(event.target.value)}
          placeholder="例如：我在药店，想确认这个药怎么吃"
          className="min-h-28 w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 pr-16 text-[15px] leading-6 text-neutral-950 shadow-inner outline-none transition focus:border-mint-500 focus:ring-4 focus:ring-mint-500/15"
          maxLength={100}
          rows={3}
        />
        <span className="label-mono absolute bottom-3 right-3 text-[11px] font-bold text-neutral-400">
          {customInput.length}/100
        </span>
      </div>

      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-neutral-800">推荐入口</span>
          <span className="text-xs text-neutral-500">可横向滑动</span>
        </div>
        <PresetScenarioGrid selectedId={selectedScenarioId} onSelect={onSelectScenario} />
      </div>

      <Button
        onClick={onGenerateTask}
        disabled={!canGenerate}
        size="lg"
        className="mt-5 w-full"
      >
        {canGenerate ? "生成沟通任务" : "先选择场景或输入情境"}
      </Button>
    </Card>
  );
}
