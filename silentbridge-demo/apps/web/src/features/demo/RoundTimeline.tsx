import type { SessionRound } from "./session-types";

export function RoundTimeline({ rounds }: { rounds: SessionRound[] }) {
  if (rounds.length === 0) {
    return null;
  }

  return (
    <section className="sb-round-timeline" aria-label="本场沟通记录">
      <div className="sb-panel-head">
        <span>本场已进行</span>
        <strong>{rounds.length} 轮确认</strong>
      </div>
      <ol className="sb-round-list">
        {rounds.map((round) => {
          const highlight =
            round.understanding?.plainSummary ||
            round.understanding?.confirmed.slice(0, 2).join("；") ||
            round.transcript.map((line) => line.text).join(" ").slice(0, 48);
          const risk = round.understanding?.risks.find((item) => item.level === "high");

          return (
            <li key={round.id} className="sb-round-item">
              <div className="sb-round-item__head">
                <span>第 {round.roundIndex} 轮</span>
                {risk ? <em>有高风险</em> : null}
              </div>
              <p className="sb-round-item__prompt">出示：{round.prompt}</p>
              <p className="sb-round-item__summary">{highlight}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
