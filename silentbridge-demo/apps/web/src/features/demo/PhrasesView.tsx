import { useMemo, useState } from "react";
import { phrasePacks, type DemoFlowId, type Phrase } from "./demo-content";

const SCENE_FILTERS: Array<{ id: "all" | DemoFlowId; label: string }> = [
  { id: "all", label: "全部" },
  { id: "clinic", label: "医院" },
  { id: "pharmacy", label: "药店" },
  { id: "service", label: "政务" },
  { id: "traffic", label: "交通" },
  { id: "generic", label: "通用" }
];

export function PhrasesView({
  activePhraseId,
  onUsePhrase
}: {
  activePhraseId?: string;
  onUsePhrase: (phrase: Phrase) => void;
}) {
  const [sceneFilter, setSceneFilter] = useState<"all" | DemoFlowId>("all");

  const filteredPacks = useMemo(() => {
    return phrasePacks
      .map((pack) => ({
        ...pack,
        phrases: pack.phrases.filter((phrase) => {
          if (sceneFilter === "all") return true;
          if (sceneFilter === "generic") return !phrase.flowId || phrase.flowId === "generic";
          return phrase.flowId === sceneFilter || !phrase.flowId;
        })
      }))
      .filter((pack) => pack.phrases.length > 0);
  }, [sceneFilter]);

  return (
    <div className="sb-view">
      <section className="sb-page-title">
        <p className="sb-kicker">点一句就能递出去</p>
        <h1>不用临时组织语言。</h1>
      </section>

      <div className="sb-record-chips" role="tablist" aria-label="按场景筛选话术">
        {SCENE_FILTERS.map((option) => (
          <button
            type="button"
            key={option.id}
            role="tab"
            aria-selected={sceneFilter === option.id}
            className={sceneFilter === option.id ? "sb-record-chip is-active" : "sb-record-chip"}
            onClick={() => setSceneFilter(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="sb-phrase-packs">
        {filteredPacks.map((pack) => (
          <section className="sb-phrase-pack" key={pack.id}>
            <div className="sb-panel-head">
              <span>{pack.title}</span>
              <strong>{pack.description}</strong>
            </div>
            <div className="sb-phrase-list">
              {pack.phrases.map((phrase) => (
                <button
                  type="button"
                  className={activePhraseId === phrase.id ? "is-active" : ""}
                  key={phrase.id}
                  onClick={() => onUsePhrase(phrase)}
                >
                  <span>
                    {phrase.intent}
                    {phrase.flowId ? ` · ${labelForFlow(phrase.flowId)}` : ""}
                  </span>
                  <strong>{phrase.text}</strong>
                  <small>使用</small>
                </button>
              ))}
            </div>
          </section>
        ))}
        {filteredPacks.length === 0 && (
          <div className="sb-record-empty">
            <p>这个场景还没有专属话术，可切到「全部」或「通用」。</p>
          </div>
        )}
      </div>
    </div>
  );
}

function labelForFlow(flowId: DemoFlowId) {
  switch (flowId) {
    case "clinic":
      return "医院";
    case "pharmacy":
      return "药店";
    case "service":
      return "政务";
    case "traffic":
      return "交通";
    default:
      return "通用";
  }
}
