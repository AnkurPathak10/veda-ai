import { API_BASE_URL } from "@/lib/create-assignment/constants";

type TranscribeAudioOptions = {
  audio: string;
  format: string;
  language?: string;
};

type TranscribeAudioResponse = {
  text?: string;
  error?: string;
};

async function readTranscribeResponse(
  response: Response,
): Promise<TranscribeAudioResponse> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await response.json()) as TranscribeAudioResponse;
  }

  const body = (await response.text()).trim();

  if (response.status === 413) {
    return {
      error: "Recording is too long. Try a shorter message and record again.",
    };
  }

  return {
    error:
      body.length > 0 && !body.startsWith("<!")
        ? body
        : "Could not transcribe audio. Please try again.",
  };
}

export async function transcribeAudio({
  audio,
  format,
  language,
}: TranscribeAudioOptions): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/speech/transcribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      audio,
      format,
      language,
    }),
  });

  const data = await readTranscribeResponse(response);

  if (!response.ok) {
    throw new Error(data.error ?? "Could not transcribe audio. Please try again.");
  }

  const text = data.text?.trim();

  if (!text) {
    throw new Error("No speech was detected. Please try again.");
  }

  return text;
}
