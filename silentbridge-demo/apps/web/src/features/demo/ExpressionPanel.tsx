import { Card } from "../../components/ui/Card";
import type { QuickCard as QuickCardType, ReplySuggestion } from "@silentbridge/shared";

interface ExpressionPanelProps {
  quickCards: QuickCardType[];
  replySuggestions: ReplySuggestion[];
  onSelectText: (text: string) => void;
  step?: number;
}

const categoryStyles: Record<string, string> = {
  accessibility: "border-mint-300 bg-mint-50 text-mint-950",
  confirm: "border-neutral-200 bg-white text-neutral-950",
  repeat: "border-[#d8d2c4] bg-[#fffaf0] text-neutral-950",
  handoff: "border-neutral-300 bg-[#f7f4eb] text-neutral-950"
};

export function ExpressionPanel({
  quickCards,
  replySuggestions,
  onSelectText,
  step = 4
}: ExpressionPanelProps) {
  return (
    <div className="animate-step-enter" style={{ animationDelay: `${(step - 1) * 80}ms` }}>
      <Card className="p-4 sm:p-5" variant="solid">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-mint-500 text-sm font-black text-white">
            {step}
          </div>
          <div>
            <p className="label-mono mb-0.5 text-[11px] font-bold text-violet-700">
              STEP {step}
            </p>
            <h3 className="text-xl font-black text-neutral-950">我来确认</h3>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {quickCards.map((card) => (
            <button
              type="button"
              key={card.id}
              onClick={() => onSelectText(card.text)}
              className={`min-h-14 rounded-2xl border p-3 text-left text-sm font-black leading-5 shadow-[0_8px_18px_rgba(45,38,25,0.05)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(45,38,25,0.08)] active:translate-y-px ${
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
    </div>
  );
}