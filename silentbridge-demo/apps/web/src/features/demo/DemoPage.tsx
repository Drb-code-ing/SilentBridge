import { useCallback, useEffect, useMemo, useState } from "react";
import { CommunicationStarter } from "./CommunicationStarter";
import { ContextCard } from "./ContextCard";
import { DisplayCard } from "./DisplayCard";
import { ExpressionPanel } from "./ExpressionPanel";
import { InsightPanel } from "./InsightPanel";
import { TranscriptStream } from "./TranscriptStream";
import { initialDemoState } from "./demo-state";
import type { DemoState } from "./demo-state";
import {
  createContextFromScenario,
  createCustomContext,
  dailyLifeFallbackTranscript,
  getScenario,
  type CommunicationContext,
  type InsightCard,
  type QuickCard,
  type ReplySuggestion,
  type ScenarioId,
  type TranscriptLine
} from "@silentbridge/shared";

const DEFAULT_DISPLAY_TEXT = "我听不见，但可以通过文字沟通";

const customQuickCards: QuickCard[] = [
  { id: "custom-repeat", text: "请说慢一点", category: "repeat" },
  { id: "custom-write", text: "请写下关键词", category: "repeat" },
  { id: "custom-access", text: DEFAULT_DISPLAY_TEXT, category: "accessibility" },
  { id: "custom-confirm", text: "我需要确认时间、地点和费用", category: "confirm" }
];

const customReplySuggestions: ReplySuggestion[] = [
  {
    id: "custom-clarify",
    label: "请对方确认",
    text: "我想确认一下，最重要的信息是时间、地点和下一步要做什么，对吗？",
    intent: "confirm"
  }
];

function buildCustomInsights(context?: CommunicationContext): InsightCard[] {
  if (!context || context.source === "preset") {
    return [];
  }

  const baseItems = [
    "先让对方放慢语速或写下关键词",
    "把时间、地点、金额、材料这类信息单独确认",
    "不确定时使用大字卡展示给对方"
  ];

  if (context.riskLevel === "critical") {
    return [
      {
        id: "custom-critical",
        title: "高风险沟通提醒",
        items: ["健康相关内容只做信息确认", "出现紧急症状时请对方写清楚处理方式", ...baseItems],
        severity: "critical"
      }
    ];
  }

  if (context.riskLevel === "attention") {
    return [
      {
        id: "custom-attention",
        title: "需要确认的事项",
        items: ["涉及费用、证件或流程时请逐项确认", ...baseItems],
        severity: "attention"
      }
    ];
  }

  return [
    {
      id: "custom-normal",
      title: "通用沟通策略",
      items: baseItems,
      severity: "info"
    }
  ];
}

export function DemoPage() {
  const [state, setState] = useState<DemoState>(initialDemoState);
  const [currentTranscript, setCurrentTranscript] = useState<TranscriptLine[]>([]);

  const handleSelectScenario = useCallback((id: ScenarioId) => {
    setState((prev) => ({
      ...prev,
      selectedScenarioId: id,
      customInput: ""
    }));
  }, []);

  const handleCustomInputChange = useCallback((value: string) => {
    setState((prev) => ({
      ...prev,
      customInput: value,
      selectedScenarioId: undefined
    }));
  }, []);

  const handleGenerateTask = useCallback(() => {
    let context: CommunicationContext;
    let transcript: TranscriptLine[];

    if (state.selectedScenarioId) {
      context = createContextFromScenario(state.selectedScenarioId);
      transcript = getScenario(state.selectedScenarioId).transcript;
    } else if (state.customInput.trim()) {
      context = createCustomContext(state.customInput.trim());
      transcript = dailyLifeFallbackTranscript;
    } else {
      return;
    }

    setState((prev) => ({
      ...prev,
      activeContext: context,
      visibleTranscriptLines: [],
      isSimulating: false,
      selectedDisplayText: DEFAULT_DISPLAY_TEXT
    }));
    setCurrentTranscript(transcript);
  }, [state.customInput, state.selectedScenarioId]);

  const handleResetTask = useCallback(() => {
    setState({
      ...initialDemoState,
      selectedDisplayText: DEFAULT_DISPLAY_TEXT
    });
    setCurrentTranscript([]);
  }, []);

  const handleResetTranscript = useCallback(() => {
    setState((prev) => ({
      ...prev,
      visibleTranscriptLines: [],
      isSimulating: false
    }));
  }, []);

  const handleStartSimulation = useCallback(() => {
    if (state.isSimulating || currentTranscript.length === 0) {
      return;
    }

    setState((prev) => ({
      ...prev,
      visibleTranscriptLines:
        prev.visibleTranscriptLines.length === currentTranscript.length
          ? []
          : prev.visibleTranscriptLines,
      isSimulating: true
    }));
  }, [currentTranscript.length, state.isSimulating]);

  const handleSelectDisplayText = useCallback((text: string) => {
    setState((prev) => ({
      ...prev,
      selectedDisplayText: text
    }));
  }, []);

  useEffect(() => {
    if (!state.isSimulating) {
      return;
    }

    const visibleCount = state.visibleTranscriptLines.length;
    if (visibleCount >= currentTranscript.length) {
      setState((prev) => ({ ...prev, isSimulating: false }));
      return;
    }

    const timer = window.setTimeout(() => {
      const nextLine = currentTranscript[visibleCount];
      setState((prev) => ({
        ...prev,
        visibleTranscriptLines: [...prev.visibleTranscriptLines, nextLine]
      }));
    }, 800);

    return () => window.clearTimeout(timer);
  }, [currentTranscript, state.isSimulating, state.visibleTranscriptLines.length]);

  const currentScenario = state.selectedScenarioId
    ? getScenario(state.selectedScenarioId)
    : undefined;

  const insights = useMemo(() => {
    if (!state.activeContext) {
      return [];
    }
    if (state.selectedScenarioId && currentScenario) {
      return currentScenario.insights;
    }
    return buildCustomInsights(state.activeContext);
  }, [currentScenario, state.activeContext, state.selectedScenarioId]);

  const quickCards = state.selectedScenarioId && currentScenario
    ? currentScenario.quickCards
    : customQuickCards;

  const replySuggestions = state.selectedScenarioId && currentScenario
    ? currentScenario.replySuggestions
    : customReplySuggestions;

  return (
    <div className="app-shell">
      <header className="sticky top-0 z-40 border-b border-neutral-950/10 bg-[#f8f6f0]/86 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-950 text-lg font-black text-white">
              S
            </div>
            <div>
              <h1 className="text-base font-black leading-tight text-neutral-950">
                SilentBridge 无声桥
              </h1>
              <p className="label-mono text-[10px] font-bold text-neutral-500">
                MOBILE COMMUNICATION COPILOT
              </p>
            </div>
          </div>
          <span className="rounded-full bg-mint-100 px-3 py-1.5 text-xs font-bold text-mint-900">
            Phase 02
          </span>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 pb-8 pt-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr_0.95fr] lg:items-start">
        <section className="min-w-0 lg:sticky lg:top-20">
          <div className="mb-4 rounded-[1.6rem] bg-neutral-950 p-5 text-white shadow-[0_22px_60px_rgba(23,23,23,0.2)]">
            <p className="label-mono mb-3 text-[11px] font-bold text-mint-300">
              FIELD MODE
            </p>
            <h2 className="text-3xl font-black leading-[1.05] text-balance">
              把复杂对话变成一张可执行的沟通任务卡。
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/72">
              面向听障、弱听、临时失语及不便开口人群，在真实场景里完成听见、理解、表达、确认和留存。
            </p>
          </div>
          <CommunicationStarter
            selectedScenarioId={state.selectedScenarioId}
            customInput={state.customInput}
            onSelectScenario={handleSelectScenario}
            onCustomInputChange={handleCustomInputChange}
            onGenerateTask={handleGenerateTask}
          />
          {state.activeContext && (
            <div className="mt-4">
              <ContextCard context={state.activeContext} onReset={handleResetTask} />
            </div>
          )}
        </section>

        <section className="min-w-0 space-y-4">
          {state.activeContext ? (
            <>
              <TranscriptStream
                lines={state.visibleTranscriptLines}
                isSimulating={state.isSimulating}
                allLines={currentTranscript}
                onStartSimulation={handleStartSimulation}
                onReset={handleResetTranscript}
              />
              <InsightPanel insights={insights} />
            </>
          ) : (
            <div className="panel rounded-[1.6rem] p-6">
              <p className="label-mono mb-2 text-[11px] font-bold text-neutral-500">
                WAITING
              </p>
              <h3 className="text-2xl font-black text-neutral-950">先建立沟通任务</h3>
              <p className="mt-3 text-sm leading-6 text-neutral-600">
                选择推荐场景或输入真实情境后，这里会显示逐句字幕、重点句和待确认信息。
              </p>
            </div>
          )}
        </section>

        <section className="min-w-0 space-y-4 lg:sticky lg:top-20">
          {state.activeContext ? (
            <>
              <ExpressionPanel
                quickCards={quickCards}
                replySuggestions={replySuggestions}
                onSelectText={handleSelectDisplayText}
              />
              <DisplayCard text={state.selectedDisplayText} />
            </>
          ) : (
            <DisplayCard text={DEFAULT_DISPLAY_TEXT} />
          )}
        </section>
      </main>
    </div>
  );
}
