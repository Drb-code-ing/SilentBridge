import type { RecordItem } from "./demo-content";

export function buildShareText(record: RecordItem): string {
  const lines = [
    `【无声桥沟通记录】${record.title}`,
    `地点：${record.place}`,
    `时间：${record.time}`,
    "",
    `摘要：${record.summary}`,
    ""
  ];

  if (record.keyPoints.length > 0) {
    lines.push("重点：", ...record.keyPoints.map((point) => `· ${point}`), "");
  }

  if (record.aiUnderstanding.confirmed.length > 0) {
    lines.push("已确认：", ...record.aiUnderstanding.confirmed.map((item) => `· ${item}`), "");
  }

  if (record.aiUnderstanding.missing.length > 0) {
    lines.push("待确认：", ...record.aiUnderstanding.missing.map((item) => `· ${item}`), "");
  }

  if (record.aiUnderstanding.risks.length > 0) {
    lines.push(
      "风险：",
      ...record.aiUnderstanding.risks.map((risk) => `· [${risk.level}] ${risk.text}`),
      ""
    );
  }

  lines.push(`下一步：${record.nextStep}`, "", `建议确认：${record.aiUnderstanding.suggestedQuestion}`, "", "—— 由 SilentBridge 无声桥整理");

  return lines.filter((line) => line !== undefined).join("\n");
}
