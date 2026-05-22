const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const DEFAULT_MODEL = "openrouter/free";

type OpenRouterMessage = {
  role: "system" | "user";
  content: string;
};

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  model?: string;
  error?: {
    message?: string;
    code?: number | string;
    metadata?: unknown;
  };
};

async function callOpenRouter(
  model: string,
  messages: OpenRouterMessage[],
): Promise<{ content: string; model: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not configured. Add it to your .env file.",
    );
  }

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": "VedaAI",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4,
      response_format: { type: "json_object" },
    }),
  });

  const data = (await response.json()) as OpenRouterResponse;

  if (!response.ok) {
    const providerMessage =
      typeof data.error?.metadata === "object" &&
      data.error.metadata !== null &&
      "raw" in data.error.metadata &&
      typeof data.error.metadata.raw === "string"
        ? data.error.metadata.raw
        : null;

    throw new Error(
      providerMessage ??
        data.error?.message ??
        `OpenRouter request failed (${response.status})`,
    );
  }

  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("OpenRouter returned an empty response");
  }

  return {
    content,
    model: data.model ?? model,
  };
}

export async function generateStructuredJson(
  systemPrompt: string,
  userPrompt: string,
): Promise<{ content: string; model: string }> {
  const primaryModel = process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL;
  const modelsToTry = Array.from(new Set([primaryModel, DEFAULT_MODEL]));
  const messages: OpenRouterMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  let lastError: unknown;

  for (const model of modelsToTry) {
    try {
      return await callOpenRouter(model, messages);
    } catch (error) {
      lastError = error;
      if (model === modelsToTry.at(-1)) {
        break;
      }

      console.warn(`Model failed (${model}), retrying with ${DEFAULT_MODEL}:`, error);
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error("OpenRouter request failed");
}
