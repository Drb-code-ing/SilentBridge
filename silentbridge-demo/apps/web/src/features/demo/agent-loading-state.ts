export function isAgentLoading(state: {
  asrStatus: string;
  visibleCaptions: unknown[];
  agentResult: unknown;
}): boolean {
  return (
    state.asrStatus === "transcribing" &&
    state.visibleCaptions.length > 0 &&
    !state.agentResult
  );
}
