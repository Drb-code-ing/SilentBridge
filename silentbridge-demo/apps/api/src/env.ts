/**
 * Server-side environment reader.
 * Only exposes boolean flags, never raw key values.
 */
export function getServerEnv() {
  return {
    asrApiKeyConfigured: Boolean(process.env.ASR_API_KEY),
    agentApiKeyConfigured: Boolean(process.env.AGENT_API_KEY),
    hasZhipuKey: Boolean(process.env.ZHIPU_API_KEY),
    hasBaiduAsr: Boolean(process.env.BAIDU_API_KEY && process.env.BAIDU_SECRET_KEY)
  };
}

export function getBaiduCredentials() {
  return {
    apiKey: process.env.BAIDU_API_KEY ?? "",
    secretKey: process.env.BAIDU_SECRET_KEY ?? ""
  };
}
