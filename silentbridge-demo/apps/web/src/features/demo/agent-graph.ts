import type { AiUnderstanding, CaptionLine, DemoFlow } from "./demo-content";
import type { TranscriptSegmentPayload } from "./api-contracts";
import { createUnderstandingFromTranscript } from "./real-input-engine";

export type AgentNodeId =
  | "asr_capture"
  | "context_classifier"
  | "risk_guard"
  | "confirmation_question"
  | "record_writer";

export interface AgentNode {
  id: AgentNodeId;
  label: string;
  description: string;
}

export interface AgentEdge {
  from: AgentNodeId;
  to: AgentNodeId;
}

export interface AgentRunInput {
  flow: DemoFlow;
  transcript: Array<CaptionLine | TranscriptSegmentPayload>;
  userMessage?: string;
}

export interface AgentRunResult {
  graphName: string;
  visitedNodes: AgentNodeId[];
  understanding: AiUnderstanding;
}

export const silentBridgeAgentGraph = {
  name: "silentbridge-front-demo-agent",
  nodes: [
    {
      id: "asr_capture",
      label: "ASR Capture",
      description: "Capture or simulate spoken words as transcript lines."
    },
    {
      id: "context_classifier",
      label: "Context Classifier",
      description: "Identify scene intent and convert transcript into user-facing facts."
    },
    {
      id: "risk_guard",
      label: "Risk Guard",
      description: "Find missing details and high-risk misunderstandings."
    },
    {
      id: "confirmation_question",
      label: "Confirmation Question",
      description: "Generate one short follow-up sentence for the user to show."
    },
    {
      id: "record_writer",
      label: "Record Writer",
      description: "Package confirmed facts, risks, and next step into a saved record."
    }
  ] satisfies AgentNode[],
  edges: [
    { from: "asr_capture", to: "context_classifier" },
    { from: "context_classifier", to: "risk_guard" },
    { from: "risk_guard", to: "confirmation_question" },
    { from: "confirmation_question", to: "record_writer" }
  ] satisfies AgentEdge[]
};

export function runDemoAgent(input: AgentRunInput): AgentRunResult {
  return {
    graphName: silentBridgeAgentGraph.name,
    visitedNodes: silentBridgeAgentGraph.nodes.map((node) => node.id),
    understanding: createUnderstandingFromTranscript({
      flow: input.flow,
      transcript: input.transcript,
      userMessage: input.userMessage ?? ""
    })
  };
}
