import type { RecordItem } from "./demo-content";

export function removeRecord(records: RecordItem[], recordId: string, fallbackRecords: RecordItem[]) {
  const nextRecords = records.filter((record) => record.id !== recordId);
  return nextRecords.length > 0 ? nextRecords : fallbackRecords;
}

export function resetRecords(fallbackRecords: RecordItem[]) {
  return fallbackRecords;
}

export function pickNextRecordId(records: RecordItem[], previousId?: string) {
  if (records.length === 0) {
    return undefined;
  }

  if (!previousId) {
    return records[0].id;
  }

  return records.find((record) => record.id === previousId)?.id ?? records[0].id;
}
