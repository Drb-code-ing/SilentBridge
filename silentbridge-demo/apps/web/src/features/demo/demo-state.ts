import type { ScenarioId, CommunicationContext, TranscriptLine } from "@silentbridge/shared";

export interface DemoState {
  selectedScenarioId?: ScenarioId;
  customInput: string;
  activeContext?: CommunicationContext;
  visibleTranscriptLines: TranscriptLine[];
  isSimulating: boolean;
  selectedDisplayText: string;
}

export const initialDemoState: DemoState = {
  selectedScenarioId: undefined,
  customInput: "",
  activeContext: undefined,
  visibleTranscriptLines: [],
  isSimulating: false,
  selectedDisplayText: "我听不见，但可以通过文字沟通"
};
