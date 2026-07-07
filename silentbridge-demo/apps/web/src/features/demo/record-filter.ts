import type { RecordItem, DemoFlowId } from "./demo-content";

export type FlowIdFilter = "all" | DemoFlowId;

export function filterRecords(
  records: RecordItem[],
  query: string,
  flowIdFilter: FlowIdFilter
): RecordItem[] {
  const trimmedQuery = query.trim();
  const queryLower = trimmedQuery.toLowerCase();

  return records.filter((record) => {
    if (flowIdFilter !== "all" && record.flowId !== flowIdFilter) {
      return false;
    }

    if (trimmedQuery === "") {
      return true;
    }

    const haystack = [
      record.title,
      record.summary,
      record.place,
      record.keyPoints.join(" ")
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(queryLower);
  });
}
