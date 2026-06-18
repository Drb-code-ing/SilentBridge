import { useEffect, useRef } from "react";
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
  onQuickStart?: (prompt: string, title: string) => void;
  onFocusCustomInput?: () => void;
}

export function CommunicationStarter({
  selectedScenarioId,
  customInput,
  onSelectScenario,
  onCustomInputChange,
  onGenerateTask,
  onQuickStart,
  onFocusCustomInput
}: CommunicationStarterProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canGenerate = Boolean(selectedScenarioId || customInput.trim());

  useEffect(() => {
    if (onFocusCustomInput && customInput.length === 0 && !selectedScenarioId) {
      textareaRef.current?.focus();
    }
  }, [onFocusCustomInput, customInput.length, selectedScenarioId]);

  return (
    <Card className="p-4 sm:p-5" variant="solid">
      <div className="mb-4 rounded-3xl bg-[#10201c] p-4 text-white shadow-[0_18px_42px_rgba(16,32,28,0.18)]">
        <p className="label-mono mb-2 text-[11px] font-bold text-mint-200/90">
          TAP TO BRIDGE
        </p>
        <h2 className="text-[1.85rem] font-black leading-tight text-balance">
          现在遇到什么沟通困难？
        </h2>
        <p className="mt-3 text-sm leading-6 text-white/76">
          点一个入口，或写一句真实情况。下一屏直接给你可展示、可确认、可留存的沟通流程。
        </p>
      </div>

      <label className="mb-2 block text-sm font-semibold text-neutral-800">
        直接描述当前情境
      </label>
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={customInput}
          onChange={(event) => onCustomInputChange(event.target.value)}
          placeholder="例如：我在药店，想确认这个药怎么吃"
          className="min-h-24 w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 pr-16 text-[15px] leading-6 text-neutral-950 shadow-inner outline-none transition focus:border-mint-500 focus:ring-4 focus:ring-mint-500/15"
          maxLength={100}
          rows={3}
        />
        <span className="label-mono absolute bottom-3 right-3 text-[11px] font-bold text-neutral-400">
          {customInput.length}/100
        </span>
      </div>

      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-neutral-800">快捷入口</span>
          <span className="text-xs text-neutral-500">可横向滑动</span>
        </div>
        <PresetScenarioGrid
          selectedId={selectedScenarioId}
          onSelect={onSelectScenario}
          onQuickStart={onQuickStart}
          onCustomSelect={() => textareaRef.current?.focus()}
        />
      </div>

      <Button
        onClick={onGenerateTask}
        disabled={!canGenerate}
        size="lg"
        className="mt-5 w-full"
      >
        {canGenerate ? "开始沟通" : "先选择场景或输入情境"}
      </Button>
    </Card>
  );
}
