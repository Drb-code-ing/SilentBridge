const ZHIPU_ENDPOINT = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
const ZHIPU_MODEL = "glm-4-flash";
const REQUEST_TIMEOUT_MS = 12000;

interface ZhipuChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ZhipuChatRequest {
  model: string;
  messages: ZhipuChatMessage[];
  response_format?: { type: "json_object" };
  temperature?: number;
}

interface ZhipuChatResponse {
  id?: string;
  choices: Array<{
    index: number;
    message: { role: string; content: string };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export interface ZhipuChatResult {
  content: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export async function callZhipuChat(input: {
  apiKey: string;
  systemPrompt: string;
  userPrompt: string;
}): Promise<ZhipuChatResult> {
  const body: ZhipuChatRequest = {
    model: ZHIPU_MODEL,
    messages: [
      { role: "system", content: input.systemPrompt },
      { role: "user", content: input.userPrompt }
    ],
    response_format: { type: "json_object" },
    temperature: 0.3
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(ZHIPU_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${input.apiKey}`
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`zhipu api error ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as ZhipuChatResponse;
    const content = data.choices?.[0]?.message?.content ?? "";

    if (!content) {
      throw new Error("zhipu api returned empty content");
    }

    return {
      content,
      usage: {
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens,
        totalTokens: data.usage?.total_tokens
      }
    };
  } finally {
    clearTimeout(timeout);
  }
}
