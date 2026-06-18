import { Card } from "../../components/ui/Card";
import type { Scenario } from "@silentbridge/shared";

interface ConversationSummaryCardProps {
  scenario?: Scenario;
  customTitle?: string;
  confirmedItems?: string[];
  nextActions?: string[];
}

export function ConversationSummaryCard({
  scenario,
  customTitle,
  confirmedItems = [],
  nextActions = []
}: ConversationSummaryCardProps) {
  const title = customTitle || scenario?.name || "沟通摘要";
  const keyPoints = scenario?.summary?.keyPoints || confirmedItems;
  const toConfirm = scenario?.summary?.toConfirm || [
    "关键数字、时间、地点是否已经写清楚",
    "下一步由谁处理、什么时候处理"
  ];
  const actions = scenario?.summary?.nextActions || nextActions;

  return (
    <Card className="p-4 sm:p-5" variant="solid">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-lg">
          📋
        </div>
        <div>
          <p className="label-mono mb-0.5 text-[11px] font-bold text-emerald-700">
            RETENTION
          </p>
          <h3 className="text-lg font-black text-neutral-950">本次沟通留存</h3>
        </div>
      </div>

      <div className="space-y-4">
        {/* Scenario */}
        <div className="rounded-xl bg-emerald-50 p-4">
          <p className="label-mono mb-1 text-[10px] font-bold text-emerald-700">场景</p>
          <p className="font-bold text-emerald-900">{title}</p>
        </div>

        {/* Key Points */}
        {keyPoints.length > 0 && (
          <div>
            <p className="label-mono mb-2 text-[10px] font-bold text-sky-700">关键信息</p>
            <ul className="space-y-1.5">
              {keyPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-neutral-700">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-sky-500" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* To Confirm */}
        {toConfirm.length > 0 && (
          <div>
            <p className="label-mono mb-2 text-[10px] font-bold text-amber-700">待确认事项</p>
            <ul className="space-y-1.5">
              {toConfirm.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-neutral-700">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Next Actions */}
        {actions.length > 0 && (
          <div>
            <p className="label-mono mb-2 text-[10px] font-bold text-emerald-700">下一步</p>
            <ul className="space-y-1.5">
              {actions.map((action, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-neutral-700">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}
