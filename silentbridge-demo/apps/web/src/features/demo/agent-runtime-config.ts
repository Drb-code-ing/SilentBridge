import { silentBridgeAgentGraph } from "./agent-graph";

export interface AgentRuntimeStatus {
  asrMode: "manual" | "browser-ready";
  agentMode: "local-fallback" | "proxy-ready";
  graphName: string;
  privacyNote: string;
}

export function getAgentRuntimeStatus(input?: {
  microphoneReady?: boolean;
  proxyReady?: boolean;
}): AgentRuntimeStatus {
  return {
    asrMode: input?.microphoneReady ? "browser-ready" : "manual",
    agentMode: input?.proxyReady ? "proxy-ready" : "local-fallback",
    graphName: silentBridgeAgentGraph.name,
    privacyNote: "当前 Demo 不在前端保存或展示任何 API key。"
  };
}
