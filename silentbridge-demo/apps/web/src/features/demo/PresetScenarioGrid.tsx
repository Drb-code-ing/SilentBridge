import { scenarios, scenarioIds } from "@silentbridge/shared";
import type { ScenarioId } from "@silentbridge/shared";

interface PresetScenarioGridProps {
  selectedId?: ScenarioId;
  onSelect: (id: ScenarioId) => void;
  onQuickStart?: (prompt: string, title: string) => void;
  onCustomSelect?: () => void;
}

const presetMeta: Record<ScenarioId, { mark: string; tone: string; bgTone: string }> = {
  medical: { mark: "医院", tone: "border-red-300 bg-red-50 text-red-900", bgTone: "bg-red-100" },
  interview: { mark: "面试", tone: "border-sky-300 bg-sky-50 text-sky-900", bgTone: "bg-sky-100" },
  classroom: { mark: "课堂", tone: "border-amber-300 bg-amber-50 text-amber-900", bgTone: "bg-amber-100" },
  "public-service": { mark: "政务", tone: "border-violet-300 bg-violet-50 text-violet-900", bgTone: "bg-violet-100" }
};

const quickChips: { label: string; icon: string; prompt?: string }[] = [
  { label: "药店问药", icon: "💊", prompt: "我在药店，想确认这个药怎么吃、一天几次、有没有禁忌" },
  { label: "地铁问路", icon: "🚇", prompt: "我在地铁站，听不清工作人员说的换乘路线和出口方向" },
  { label: "餐厅沟通", icon: "🍽️", prompt: "我在餐厅，想确认菜品过敏原、价格和下单内容" },
  { label: "银行办理", icon: "🏦", prompt: "我在银行窗口，想确认办理业务需要的证件、费用和下一步" },
  { label: "房东沟通", icon: "🏠", prompt: "我和房东沟通维修问题，想确认时间、费用和责任" },
  { label: "自定义", icon: "✏️" }
];

export function PresetScenarioGrid({
  selectedId,
  onSelect,
  onQuickStart,
  onCustomSelect
}: PresetScenarioGridProps) {
  return (
    <div className="space-y-4">
      {/* Quick scenario chips */}
      <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 scrollbar-hide">
        {quickChips.map((chip) => {
          const isCustom = chip.label === "自定义";
          return (
            <button
              key={chip.label}
              type="button"
              onClick={isCustom ? onCustomSelect : () => chip.prompt && onQuickStart?.(chip.prompt, chip.label)}
              className="min-h-11 flex-shrink-0 rounded-full border border-neutral-200 bg-white/76 px-4 py-2.5 text-sm font-semibold text-neutral-700 transition duration-200 hover:border-mint-300 hover:bg-mint-50 hover:text-mint-800 active:scale-[0.97] sm:min-h-12"
            >
              <span className="mr-1.5">{chip.icon}</span>
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Main scenario cards */}
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
        {scenarioIds.map((id) => {
          const scenario = scenarios[id];
          const isSelected = selectedId === id;
          const meta = presetMeta[id];

          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className={`min-h-[7rem] w-36 flex-shrink-0 rounded-2xl border-2 p-3 text-left transition-all duration-200 active:scale-[0.97] ${
                isSelected
                  ? `${meta.tone} shadow-[0_14px_30px_rgba(23,23,23,0.12)] scale-[1.02]`
                  : "border-neutral-200 bg-white/76 text-neutral-800 hover:border-neutral-300 hover:shadow-md"
              }`}
            >
              <span className={`label-mono mb-3 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${isSelected ? "bg-white/70 text-current" : "bg-neutral-950 text-white"}`}>
                {meta.mark}
              </span>
              <span className="block text-base font-black text-neutral-950">{scenario.shortName}</span>
              <span className="mt-1 block text-xs leading-4 text-neutral-600 line-clamp-2">
                {scenario.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
