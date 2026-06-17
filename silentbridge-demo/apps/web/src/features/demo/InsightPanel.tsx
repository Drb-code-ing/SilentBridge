import { Card } from "../../components/ui/Card";
import type { InsightCard as InsightCardType } from "@silentbridge/shared";

interface InsightPanelProps {
  insights: InsightCardType[];
}

const severityStyles = {
  info: "border-sky-200 bg-sky-50 text-sky-900",
  attention: "border-amber-200 bg-amber-50 text-amber-950",
  critical: "border-red-200 bg-red-50 text-red-950"
};

const severityLabels = {
  info: "信息",
  attention: "确认",
  critical: "风险"
};

export function InsightPanel({ insights }: InsightPanelProps) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-4">
        <p className="label-mono mb-1 text-[11px] font-bold text-amber-700">
          UNDERSTAND
        </p>
        <h3 className="text-2xl font-black text-neutral-950">我理解了</h3>
      </div>

      {insights.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white/72 p-5">
          <p className="font-black text-neutral-950">通用沟通模式</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-neutral-700">
            <li>先让对方放慢语速或写下关键词。</li>
            <li>涉及时间、地点、金额时主动确认。</li>
            <li>不确定时使用大字卡请求复述。</li>
          </ul>
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map((insight) => {
            const severity = insight.severity ?? "info";
            return (
              <article
                key={insight.id}
                className={`rounded-2xl border p-4 ${severityStyles[severity]}`}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="text-base font-black">{insight.title}</h4>
                  <span className="label-mono rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-bold">
                    {severityLabels[severity]}
                  </span>
                </div>
                <ul className="space-y-2">
                  {insight.items.map((item) => (
                    <li key={item} className="flex gap-2 text-sm font-medium leading-6">
                      <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-current" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      )}
    </Card>
  );
}
