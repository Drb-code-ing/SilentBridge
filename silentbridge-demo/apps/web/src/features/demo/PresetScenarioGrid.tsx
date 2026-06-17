import { scenarios, scenarioIds } from "@silentbridge/shared";
import type { ScenarioId } from "@silentbridge/shared";

interface PresetScenarioGridProps {
  selectedId?: ScenarioId;
  onSelect: (id: ScenarioId) => void;
}

const presetMeta: Record<ScenarioId, { mark: string; tone: string }> = {
  medical: { mark: "MED", tone: "border-red-300 bg-red-50 text-red-900" },
  interview: { mark: "JOB", tone: "border-sky-300 bg-sky-50 text-sky-900" },
  classroom: { mark: "CLS", tone: "border-amber-300 bg-amber-50 text-amber-900" },
  "public-service": { mark: "GOV", tone: "border-violet-300 bg-violet-50 text-violet-900" }
};

export function PresetScenarioGrid({ selectedId, onSelect }: PresetScenarioGridProps) {
  return (
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
            className={`min-h-[8.5rem] w-36 flex-shrink-0 rounded-2xl border p-3 text-left transition duration-200 active:translate-y-px ${
              isSelected
                ? `${meta.tone} shadow-[0_14px_30px_rgba(23,23,23,0.1)]`
                : "border-neutral-200 bg-white/76 text-neutral-800 hover:border-neutral-300"
            }`}
          >
            <span className="label-mono mb-4 inline-flex rounded-full bg-neutral-950 px-2.5 py-1 text-[10px] font-bold text-white">
              {meta.mark}
            </span>
            <span className="block text-lg font-black text-neutral-950">{scenario.shortName}</span>
            <span className="mt-1 block text-xs leading-5 text-neutral-600">
              {scenario.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
