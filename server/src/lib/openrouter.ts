const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const DEFAULT_MODEL = "openrouter/free";

/** OpenRouter allows at most 3 models in the `models` array per request. */
const MAX_MODELS_PER_REQUEST = 3;

/** Free models tried in order when the primary model is rate-limited or down. */
const DEFAULT_FALLBACK_MODELS = [
  DEFAULT_MODEL,
  "google/gemma-3-12b-it:free",
  "meta-llama/llama-3.2-3b-instruct:free",
];

const MAX_RATE_LIMIT_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 2_000;

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isRateLimitError(message: string): boolean {
  const normalized = message.toLowerCase();

  return (
    normalized.includes("rate-limit") ||
    normalized.includes("rate limit") ||
    normalized.includes("429") ||
    normalized.includes("too many requests")
  );
}

function getOpenRouterErrorMessage(
  response: Response,
  data: OpenRouterResponse,
): string {
  const providerMessage =
    typeof data.error?.metadata === "object" &&
    data.error.metadata !== null &&
    "raw" in data.error.metadata &&
    typeof data.error.metadata.raw === "string"
      ? data.error.metadata.raw
      : null;

  return (
    providerMessage ??
    data.error?.message ??
    `OpenRouter request failed (${response.status})`
  );
}

function getModelsToTry(): string[] {
  const primaryModel = process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL;
  const configuredFallbacks = process.env.OPENROUTER_MODEL_FALLBACKS?.split(",")
    .map((model) => model.trim())
    .filter(Boolean);

  return Array.from(
    new Set([primaryModel, ...(configuredFallbacks ?? DEFAULT_FALLBACK_MODELS)]),
  ).slice(0, MAX_MODELS_PER_REQUEST);
}

async function callOpenRouter(
  models: string[],
  messages: OpenRouterMessage[],
): Promise<{ content: string; model: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not configured. Add it to your .env file.",
    );
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RATE_LIMIT_RETRIES; attempt += 1) {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        "X-Title": "VedaAI",
      },
      body: JSON.stringify({
        models,
        messages,
        temperature: 0.4,
        response_format: { type: "json_object" },
      }),
    });

    const data = (await response.json()) as OpenRouterResponse;

    if (!response.ok) {
      const message = getOpenRouterErrorMessage(response, data);
      lastError = new Error(message);

      if (isRateLimitError(message) && attempt < MAX_RATE_LIMIT_RETRIES) {
        const delayMs = INITIAL_RETRY_DELAY_MS * 2 ** attempt;
        console.warn(
          `OpenRouter rate-limited (attempt ${attempt + 1}/${MAX_RATE_LIMIT_RETRIES + 1}), retrying in ${delayMs}ms`,
        );
        await sleep(delayMs);
        continue;
      }

      throw lastError;
    }

    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("OpenRouter returned an empty response");
    }

    return {
      content,
      model: data.model ?? models[0] ?? DEFAULT_MODEL,
    };
  }

  throw lastError ?? new Error("OpenRouter request failed");
}

export async function generateStructuredJson(
  systemPrompt: string,
  userPrompt: string,
): Promise<{ content: string; model: string }> {
  const modelsToTry = getModelsToTry();
  const messages: OpenRouterMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  try {
    return await callOpenRouter(modelsToTry, messages);
  } catch (error) {
    if (error instanceof Error && isRateLimitError(error.message)) {
      throw new Error(
        "All free AI models are temporarily busy. Please wait a minute and try again, or add credits at openrouter.ai/settings/credits for higher limits.",
      );
    }

    throw error;
  }
}
