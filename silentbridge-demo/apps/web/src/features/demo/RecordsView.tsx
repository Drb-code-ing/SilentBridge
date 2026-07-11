import { useState } from "react";
import type { RecordItem } from "./demo-content";
import { filterRecords, type FlowIdFilter } from "./record-filter";

export type RecordsMode = "list" | "detail";

function buildShareText(record: RecordItem) {
  return [
    `【无声桥沟通记录】${record.title}`,
    `地点：${record.place}`,
    `时间：${record.time}`,
    "",
    `摘要：${record.summary}`,
    "",
    "重点：",
    ...record.keyPoints.map((point) => `· ${point}`),
    "",
    record.aiUnderstanding.risks.length > 0 ? "风险：" : "",
    ...record.aiUnderstanding.risks.map((risk) => `· ${risk.text}`),
    "",
    `下一步：${record.nextStep}`,
    "",
    `建议确认：${record.aiUnderstanding.suggestedQuestion}`
  ]
    .filter((line) => line !== undefined)
    .join("\n");
}

export function RecordsView({
  records,
  selectedRecordId,
  mode,
  justSavedRecordId,
  onSelectRecord,
  onBackToList,
  onContinue,
  onOpenHome,
  onDeleteRecord,
  onResetRecords
}: {
  records: RecordItem[];
  selectedRecordId: string;
  mode: RecordsMode;
  justSavedRecordId?: string;
  onSelectRecord: (id: string) => void;
  onBackToList: () => void;
  onContinue: (record: RecordItem) => void;
  onOpenHome: () => void;
  onDeleteRecord: (id: string) => void;
  onResetRecords: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [flowFilter, setFlowFilter] = useState<FlowIdFilter>("all");
  const [copied, setCopied] = useState(false);

  const flowFilterOptions: Array<{ id: FlowIdFilter; label: string }> = [
    { id: "all", label: "全部" },
    { id: "clinic", label: "医院" },
    { id: "pharmacy", label: "药店" },
    { id: "service", label: "政务" },
    { id: "traffic", label: "交通" },
    { id: "generic", label: "通用" }
  ];

  const filteredRecords = filterRecords(records, searchQuery, flowFilter);
  const selectedRecord = records.find((record) => record.id === selectedRecordId) ?? records[0];
  const showSavedNote = Boolean(justSavedRecordId && justSavedRecordId === selectedRecord.id);

  const handleCopyRecord = async () => {
    try {
      await navigator.clipboard.writeText(buildShareText(selectedRecord));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore clipboard failures
    }
  };

  if (mode === "list") {
    return (
      <div className="sb-view">
        <section className="sb-page-title">
          <p className="sb-kicker">沟通小本本</p>
          <h1>留下来的话，之后还能用。</h1>
          <button type="button" className="sb-record-tool" onClick={onResetRecords}>
            清空演示记录
          </button>
        </section>

        <section className="sb-record-search">
          <label className="sb-record-search-input">
            <span>搜索</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="搜索标题、摘要、地点、重点"
              maxLength={40}
            />
          </label>
          <div className="sb-record-chips" role="tablist">
            {flowFilterOptions.map((option) => (
              <button
                type="button"
                key={option.id}
                role="tab"
                aria-selected={flowFilter === option.id}
                className={flowFilter === option.id ? "sb-record-chip is-active" : "sb-record-chip"}
                onClick={() => setFlowFilter(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        <section className="sb-record-list" aria-label="历史沟通记录">
          {filteredRecords.map((record) => (
            <button
              type="button"
              className={selectedRecord.id === record.id ? "sb-record-row is-active" : "sb-record-row"}
              key={record.id}
              onClick={() => onSelectRecord(record.id)}
            >
              <span>{record.time}</span>
              <div>
                <strong>{record.title}</strong>
                <small>{record.place}</small>
                <p>{record.summary}</p>
              </div>
            </button>
          ))}
          {filteredRecords.length === 0 && (
            <div className="sb-record-empty">
              <p>没有找到匹配的记录。换个关键词或场景试试。</p>
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="sb-view sb-record-detail-view">
      <section className="sb-record-detail-head">
        <button type="button" className="sb-step-back-button" onClick={onBackToList}>
          <span>←</span>
          <strong>记录列表</strong>
        </button>
        <span>{selectedRecord.time}</span>
        <button
          type="button"
          className="sb-record-tool sb-record-tool--danger"
          onClick={() => onDeleteRecord(selectedRecord.id)}
        >
          删除这条
        </button>
      </section>

      <section className="sb-record-detail">
        {showSavedNote && (
          <div className="sb-record-saved-note">
            这次重点已留下。关键信息不会再丢，也可以复制给家人，或继续追问对方确认。
          </div>
        )}
        <div className="sb-sticker">重点</div>
        <h2>{selectedRecord.title}</h2>
        <p>{selectedRecord.summary}</p>
        <div className="sb-chip-grid">
          {selectedRecord.keyPoints.map((point) => (
            <span key={point}>{point}</span>
          ))}
        </div>
        <div className="sb-record-ai">
          <span>小桥理解</span>
          <strong>{selectedRecord.aiUnderstanding.plainSummary}</strong>
          {selectedRecord.aiUnderstanding.missing.length > 0 && (
            <ul>
              {selectedRecord.aiUnderstanding.missing.map((item) => (
                <li key={item}>待确认：{item}</li>
              ))}
            </ul>
          )}
          <ul>
            {selectedRecord.aiUnderstanding.risks.map((risk) => (
              <li key={risk.text} className={`sb-risk-item sb-risk-item--${risk.level}`}>
                {risk.text}
              </li>
            ))}
          </ul>
        </div>
        <div className="sb-next-step">
          <span>下一步</span>
          <strong>{selectedRecord.nextStep}</strong>
        </div>
        <button type="button" className="sb-secondary-button" onClick={handleCopyRecord}>
          {copied ? "已复制摘要" : "复制整段摘要"}
        </button>
      </section>

      <div className="sb-record-action-bar">
        <button type="button" className="sb-secondary-button" onClick={onOpenHome}>
          回到首页
        </button>
        <button type="button" className="sb-primary-button" onClick={() => onContinue(selectedRecord)}>
          继续追问
        </button>
      </div>
    </div>
  );
}
