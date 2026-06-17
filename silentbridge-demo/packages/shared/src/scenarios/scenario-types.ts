export type ScenarioId = "medical" | "interview" | "classroom" | "public-service";

export interface TranscriptLine {
  id: string;
  speaker: "doctor" | "interviewer" | "teacher" | "staff" | "user" | "system";
  speakerLabel: string;
  text: string;
  emphasis?: boolean;
  timestamp?: string;
}

export interface InsightCard {
  id: string;
  title: string;
  items: string[];
  severity?: "info" | "attention" | "critical";
}

export interface ReplySuggestion {
  id: string;
  label: string;
  text: string;
  intent: "confirm" | "slow-down" | "clarify" | "answer" | "ask-follow-up";
}

export interface QuickCard {
  id: string;
  text: string;
  category: "accessibility" | "confirm" | "repeat" | "handoff";
}

export interface ConversationSummary {
  scenarioId: ScenarioId;
  keyPoints: string[];
  toConfirm: string[];
  nextActions: string[];
  shareText: string;
}

export interface Scenario {
  id: ScenarioId;
  name: string;
  shortName: string;
  description: string;
  userGoal: string;
  transcript: TranscriptLine[];
  insights: InsightCard[];
  replySuggestions: ReplySuggestion[];
  quickCards: QuickCard[];
  summary: ConversationSummary;
}
