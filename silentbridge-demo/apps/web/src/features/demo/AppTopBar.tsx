import { tabLabels, type AppTab } from "./demo-content";

export function AppTopBar({ activeTab, onGoHome }: { activeTab: AppTab; onGoHome: () => void }) {
  return (
    <header className="sb-topbar">
      <button type="button" className="sb-brand" onClick={onGoHome} aria-label="回到首页">
        <span className="sb-brand-mark">桥</span>
        <span>
          <strong>无声桥</strong>
          <small>听障现场沟通副驾驶</small>
        </span>
      </button>
      <div className="sb-status-pill">{tabLabels[activeTab].label}</div>
    </header>
  );
}
