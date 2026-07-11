import { useMemo, useState } from "react";
import type { AgentRunResult } from "./agent-graph";
import { createTtsPlayer } from "./tts-player";

export function AgentInsightCard({
  result,
  provider,
  onConfirmQuestion,
  onCopySummary
}: {
  result?: AgentRunResult;
  provider: "proxy" | "fallback";
  onConfirmQuestion: () => void;
  onCopySummary?: () => void;
}) {
  const ttsPlayer = useMemo(() => createTtsPlayer(), []);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!result) {
    return null;
  }

  const { understanding } = result;
  const canTts = ttsPlayer.isAvailable() && Boolean(understanding.suggestedQuestion.trim());
  const providerLabel = provider === "proxy" ? "AI 实时整理" : "离线整理（可用）";

  const handleToggleTts = () => {
    if (isSpeaking) {
      ttsPlayer.stop();
      setIsSpeaking(false);
      return;
    }
    const started = ttsPlayer.speak(understanding.suggestedQuestion, () => {
      setIsSpeaking(false);
    });
    if (started) {
      setIsSpeaking(true);
    }
  };

  const handleCopy = async () => {
    const text = [
      understanding.plainSummary,
      "",
      "已确认：",
      ...understanding.confirmed.map((item) => `· ${item}`),
      "",
      "还需确认：",
      ...understanding.missing.map((item) => `· ${item}`),
      "",
      understanding.risks.length > 0 ? "风险：" : "",
      ...understanding.risks.map((risk) => `· ${risk.text}`),
      "",
      `建议确认：${understanding.suggestedQuestion}`
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
      onCopySummary?.();
    } catch {
      // ignore clipboard failures in restricted contexts
    }
  };

  return (
    <section className="sb-agent-card sb-agent-card--peak" aria-label="AI 理解结果">
      <div className="sb-agent-peak-banner">
        <div>
          <span>本轮整理</span>
          <strong>已确认 / 待确认 / 风险</strong>
        </div>
        <div className="sb-agent-provider">{providerLabel}</div>
      </div>

      <div className="sb-agent-grid">
        <div className="sb-agent-block">
          <span>已确认</span>
          <ul>
            {understanding.confirmed.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="sb-agent-block sb-agent-block--missing">
          <span>还没确认</span>
          <ul>
            {understanding.missing.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      {understanding.risks.length > 0 && (
        <div className="sb-risk-list">
          <span>风险提醒</span>
          <ul>
            {understanding.risks.map((risk) => (
              <li key={risk.text} className={`sb-risk-item sb-risk-item--${risk.level}`}>
                {risk.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="sb-agent-question">
        <span>给对方看的确认问题</span>
        <strong>{understanding.suggestedQuestion}</strong>
      </div>

      <p className="sb-agent-summary">{understanding.plainSummary}</p>

      <div className="sb-agent-actions">
        <button type="button" className="sb-primary-button" onClick={onConfirmQuestion}>
          请对方确认
        </button>
        <button type="button" className="sb-secondary-button" onClick={handleCopy}>
          {copied ? "已复制摘要" : "复制摘要"}
        </button>
        {canTts && (
          <button
            type="button"
            className={isSpeaking ? "sb-tts-button is-speaking" : "sb-tts-button"}
            onClick={handleToggleTts}
            aria-label={isSpeaking ? "停止朗读" : "朗读建议问题"}
          >
            {isSpeaking ? "停止朗读" : "朗读"}
          </button>
        )}
      </div>
    </section>
  );
}
