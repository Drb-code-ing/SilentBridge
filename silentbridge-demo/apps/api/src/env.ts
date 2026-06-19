/**
 * Server-side environment reader.
 * Only exposes boolean flags, never raw key values.
 */
export function getServerEnv() {
  return {
    asrApiKeyConfigured: Boolean(process.env.ASR_API_KEY),
    agentApiKeyConfigured: Boolean(process.env.AGENT_API_KEY)
  };
}
