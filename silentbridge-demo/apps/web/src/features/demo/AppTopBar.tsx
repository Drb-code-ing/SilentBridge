import { tabLabels, type AppTab } from "./demo-content";
import type { A11yPreferences } from "./a11y-preferences";
import { textScaleLabel } from "./a11y-preferences";

export function AppTopBar({
  activeTab,
  onGoHome,
  a11y,
  onCycleTextScale,
  onToggleHighContrast
}: {
  activeTab: AppTab;
  onGoHome: () => void;
  a11y: A11yPreferences;
  onCycleTextScale: () => void;
  onToggleHighContrast: () => void;
}) {
  return (
    <header className="sb-topbar">
      <button type="button" className="sb-brand" onClick={onGoHome} aria-label="回到首页">
        <span className="sb-brand-mark">桥</span>
        <span>
          <strong>无声桥</strong>
          <small>听障现场沟通副驾驶</small>
        </span>
      </button>
      <div className="sb-topbar-actions">
        <button
          type="button"
          className="sb-a11y-chip"
          onClick={onCycleTextScale}
          aria-label={`切换字号，当前${textScaleLabel(a11y.textScale)}`}
        >
          字号·{textScaleLabel(a11y.textScale)}
        </button>
        <button
          type="button"
          className={a11y.highContrast ? "sb-a11y-chip is-active" : "sb-a11y-chip"}
          onClick={onToggleHighContrast}
          aria-pressed={a11y.highContrast}
          aria-label={a11y.highContrast ? "关闭高对比" : "开启高对比"}
        >
          {a11y.highContrast ? "高对比开" : "高对比"}
        </button>
        <div className="sb-status-pill">{tabLabels[activeTab].label}</div>
      </div>
    </header>
  );
}
