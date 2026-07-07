import { useMemo, useState } from "react";
import type { AgentRunResult } from "./agent-graph";
import { createTtsPlayer } from "./tts-player";

export function AgentInsightCard({
  result,
  provider,
  onConfirmQuestion
}: {
  result?: AgentRunResult;
  provider: "proxy" | "fallback";
  onConfirmQuestion: () => void;
}) {
  const ttsPlayer = useMemo(() => createTtsPlayer(), []);
  const [isSpeaking, setIsSpeaking] = useState(false);

  if (!result) {
    return null;
  }

  const { understanding } = result;
  const canTts = ttsPlayer.isAvailable() && Boolean(understanding.suggestedQuestion.trim());

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

  return (
    <section className="sb-agent-card">
      <div className="sb-panel-head">
        <span>小桥理解</span>
        <strong>已整理出确认点</strong>
      </div>
      <div className="sb-agent-provider">
        {provider === "proxy" ? "GLM-4 实时整理" : "本地规则整理"}
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

        <div className="sb-agent-block">
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

      <p className="sb-agent-summary">{understanding.plainSummary}</p>

      <div className="sb-agent-actions">
        <button type="button" className="sb-secondary-button" onClick={onConfirmQuestion}>
          请对方确认
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
