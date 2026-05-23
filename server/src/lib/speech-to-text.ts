const OPENROUTER_STT_URL = "https://openrouter.ai/api/v1/audio/transcriptions";
const DEFAULT_STT_MODEL = "openai/whisper-1";

type OpenRouterSttResponse = {
  text?: string;
  error?: {
    message?: string;
  };
};

export async function transcribeAudioWithOpenRouter(
  audioBase64: string,
  format: string,
  language?: string,
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not configured. Add it to your .env file.",
    );
  }

  const model = process.env.OPENROUTER_STT_MODEL ?? DEFAULT_STT_MODEL;

  const response = await fetch(OPENROUTER_STT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": "VedaAI",
    },
    body: JSON.stringify({
      model,
      input_audio: {
        data: audioBase64,
        format,
      },
      ...(language ? { language } : {}),
    }),
  });

  const data = (await response.json()) as OpenRouterSttResponse;

  if (!response.ok) {
    throw new Error(
      data.error?.message ??
        `Speech transcription failed (${response.status})`,
    );
  }

  const text = data.text?.trim();

  if (!text) {
    throw new Error("No speech was detected in the recording.");
  }

  return text;
}
