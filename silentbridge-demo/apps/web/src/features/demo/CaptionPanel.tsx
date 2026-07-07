import type { CaptionLine } from "./demo-content";

export function CaptionPanel({
  visibleCaptions,
  isCapturing
}: {
  visibleCaptions: CaptionLine[];
  isCapturing: boolean;
}) {
  const hasCaptions = visibleCaptions.length > 0;
  const statusLabel = isCapturing ? "正在听" : hasCaptions ? "已抓到重点" : "等待对方回复";
  const title = hasCaptions ? "对方的话已整理成文字" : "对方说完后会出现在这里";

  return (
    <section className="sb-caption-panel" aria-live="polite">
      <div className="sb-panel-head">
        <span>{statusLabel}</span>
        <strong>{title}</strong>
      </div>
      <div className="sb-caption-list">
        {hasCaptions ? (
          visibleCaptions.map((line) => (
            <article
              className={line.important ? "sb-caption-line is-important" : "sb-caption-line"}
              key={line.id}
            >
              <div>
                <strong>{line.speaker}</strong>
                <span>{line.time}</span>
              </div>
              <p>{line.text}</p>
              {line.corrected && line.originalText && (
                <div className="sb-correction-original">
                  <span className="sb-correction-badge">已纠错</span>
                  <small>原识别：{line.originalText}</small>
                </div>
              )}
            </article>
          ))
        ) : (
          <div className="sb-listening-empty">
            <span />
            <p>请让对方开始说，文字会一条一条出现。</p>
          </div>
        )}
      </div>
    </section>
  );
}
