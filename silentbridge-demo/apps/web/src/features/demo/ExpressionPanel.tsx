import { Card } from "../../components/ui/Card";
import type { QuickCard as QuickCardType, ReplySuggestion } from "@silentbridge/shared";

interface ExpressionPanelProps {
  quickCards: QuickCardType[];
  replySuggestions: ReplySuggestion[];
  onSelectText: (text: string) => void;
}

const categoryStyles: Record<string, string> = {
  accessibility: "border-mint-200 bg-mint-50 text-mint-950",
  confirm: "border-sky-200 bg-sky-50 text-sky-950",
  repeat: "border-amber-200 bg-amber-50 text-amber-950",
  handoff: "border-violet-200 bg-violet-50 text-violet-950"
};

export function ExpressionPanel({
  quickCards,
  replySuggestions,
  onSelectText
}: ExpressionPanelProps) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-4">
        <p className="label-mono mb-1 text-[11px] font-bold text-violet-700">
          EXPRESS
        </p>
        <h3 className="text-2xl font-black text-neutral-950">我来表达</h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {quickCards.map((card) => (
          <button
            type="button"
            key={card.id}
            onClick={() => onSelectText(card.text)}
            className={`min-h-16 rounded-2xl border p-3 text-left text-sm font-black leading-5 transition active:translate-y-px ${
              categoryStyles[card.category]
            }`}
          >
            {card.text}
          </button>
        ))}
      </div>

      {replySuggestions.length > 0 && (
        <div className="mt-5 space-y-2">
          <p className="text-sm font-semibold text-neutral-700">回复建议</p>
          {replySuggestions.map((suggestion) => (
            <button
              type="button"
              key={suggestion.id}
              onClick={() => onSelectText(suggestion.text)}
              className="w-full rounded-2xl border border-neutral-200 bg-white/72 p-4 text-left transition hover:border-neutral-300 active:translate-y-px"
            >
              <span className="label-mono mb-2 inline-flex rounded-full bg-neutral-100 px-2 py-1 text-[10px] font-bold text-neutral-600">
                {suggestion.label}
              </span>
              <span className="block text-sm font-semibold leading-6 text-neutral-900">
                {suggestion.text}
              </span>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
