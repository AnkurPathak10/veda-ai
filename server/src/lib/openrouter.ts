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

const MAX_RETRIES_PER_CALL = 4;
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

function isRetryableOpenRouterError(message: string): boolean {
  const normalized = message.toLowerCase();

  return (
    isRateLimitError(message) ||
    normalized.includes("empty response") ||
    normalized.includes("502") ||
    normalized.includes("503") ||
    normalized.includes("504") ||
    normalized.includes("timeout") ||
    normalized.includes("overloaded") ||
    normalized.includes("temporarily unavailable") ||
    normalized.includes("provider returned error")
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

function getAllModelsToTry(): string[] {
  const primaryModel = process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL;
  const configuredFallbacks = process.env.OPENROUTER_MODEL_FALLBACKS?.split(",")
    .map((model) => model.trim())
    .filter(Boolean);

  return Array.from(
    new Set([
      primaryModel,
      ...(configuredFallbacks ?? DEFAULT_FALLBACK_MODELS),
      ...DEFAULT_FALLBACK_MODELS,
    ]),
  );
}

async function requestOpenRouterOnce(
  models: string[],
  messages: OpenRouterMessage[],
  useJsonFormat: boolean,
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
      "HTTP-Referer":
        process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": "VedaAI",
    },
    body: JSON.stringify({
      models,
      messages,
      temperature: 0.4,
      ...(useJsonFormat ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  const data = (await response.json()) as OpenRouterResponse;

  if (!response.ok) {
    throw new Error(getOpenRouterErrorMessage(response, data));
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

async function requestOpenRouterWithRetries(
  models: string[],
  messages: OpenRouterMessage[],
  useJsonFormat: boolean,
): Promise<{ content: string; model: string } | null> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES_PER_CALL; attempt += 1) {
    try {
      return await requestOpenRouterOnce(models, messages, useJsonFormat);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "OpenRouter request failed";
      lastError = error instanceof Error ? error : new Error(message);

      if (
        isRetryableOpenRouterError(message) &&
        attempt < MAX_RETRIES_PER_CALL - 1
      ) {
        const delayMs = INITIAL_RETRY_DELAY_MS * 2 ** attempt;
        console.warn(
          `OpenRouter retry (${models.join(" -> ")}), attempt ${attempt + 1}/${MAX_RETRIES_PER_CALL}: ${message}. Retrying in ${delayMs}ms`,
        );
        await sleep(delayMs);
        continue;
      }

      if (attempt === MAX_RETRIES_PER_CALL - 1) {
        break;
      }

      throw lastError;
    }
  }

  if (lastError) {
    console.warn(
      `OpenRouter exhausted retries for models [${models.join(", ")}]: ${lastError.message}`,
    );
  }

  return null;
}

export async function generateStructuredJson(
  systemPrompt: string,
  userPrompt: string,
): Promise<{ content: string; model: string }> {
  const allModels = getAllModelsToTry();
  const messages: OpenRouterMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  const modelGroups: string[][] = [];

  for (let index = 0; index < allModels.length; index += MAX_MODELS_PER_REQUEST) {
    modelGroups.push(allModels.slice(index, index + MAX_MODELS_PER_REQUEST));
  }

  for (const models of modelGroups) {
    const result = await requestOpenRouterWithRetries(models, messages, true);
    if (result) {
      return result;
    }
  }

  for (const model of allModels) {
    const result = await requestOpenRouterWithRetries([model], messages, true);
    if (result) {
      return result;
    }
  }

  for (const model of allModels.slice(0, MAX_MODELS_PER_REQUEST)) {
    const result = await requestOpenRouterWithRetries([model], messages, false);
    if (result) {
      return result;
    }
  }

  throw new Error(
    "AI models are temporarily busy or returned no content. Please wait a minute and try again, or add credits at openrouter.ai/settings/credits for more reliable generation.",
  );
}
