export function AgentLoadingCard() {
  return (
    <section className="sb-agent-card-skeleton" role="status" aria-live="polite">
      <div className="sb-panel-head">
        <span>小桥正在整理</span>
        <strong>小桥正在整理...</strong>
      </div>
      <div className="sb-skeleton-block sb-skeleton-provider" />
      <div className="sb-agent-grid">
        <div className="sb-agent-block">
          <span className="sb-skeleton-block sb-skeleton-label" />
          <div className="sb-skeleton-block sb-skeleton-line" />
          <div className="sb-skeleton-block sb-skeleton-line" />
        </div>
        <div className="sb-agent-block">
          <span className="sb-skeleton-block sb-skeleton-label" />
          <div className="sb-skeleton-block sb-skeleton-line" />
          <div className="sb-skeleton-block sb-skeleton-line" />
        </div>
      </div>
    </section>
  );
}
