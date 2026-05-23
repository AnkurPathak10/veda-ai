type Transcriber = (
  audio: Float32Array | string,
  options?: {
    language?: string;
    task?: "transcribe" | "translate";
  },
) => Promise<{ text?: string } | string>;

let transcriberPromise: Promise<Transcriber> | null = null;

async function loadTranscriber(): Promise<Transcriber> {
  const { pipeline, env } = await import("@xenova/transformers");

  env.allowLocalModels = false;
  env.useBrowserCache = true;

  return pipeline(
    "automatic-speech-recognition",
    "Xenova/whisper-tiny.en",
  ) as Promise<Transcriber>;
}

function getTranscriber(): Promise<Transcriber> {
  if (!transcriberPromise) {
    transcriberPromise = loadTranscriber();
  }

  return transcriberPromise;
}

async function blobToMonoPcm(
  blob: Blob,
  targetSampleRate = 16_000,
): Promise<Float32Array> {
  const audioContext = new AudioContext();

  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    const sourceData =
      audioBuffer.numberOfChannels === 1
        ? audioBuffer.getChannelData(0)
        : mixToMono(audioBuffer);

    if (audioBuffer.sampleRate === targetSampleRate) {
      return sourceData;
    }

    return resampleAudio(sourceData, audioBuffer.sampleRate, targetSampleRate);
  } finally {
    await audioContext.close();
  }
}

function mixToMono(audioBuffer: AudioBuffer): Float32Array {
  const length = audioBuffer.length;
  const mixed = new Float32Array(length);

  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel += 1) {
    const channelData = audioBuffer.getChannelData(channel);

    for (let index = 0; index < length; index += 1) {
      mixed[index] += channelData[index] / audioBuffer.numberOfChannels;
    }
  }

  return mixed;
}

function resampleAudio(
  samples: Float32Array,
  sourceRate: number,
  targetRate: number,
): Float32Array {
  if (sourceRate === targetRate) {
    return samples;
  }

  const ratio = sourceRate / targetRate;
  const newLength = Math.round(samples.length / ratio);
  const resampled = new Float32Array(newLength);

  for (let index = 0; index < newLength; index += 1) {
    const sourceIndex = index * ratio;
    const lowerIndex = Math.floor(sourceIndex);
    const upperIndex = Math.min(lowerIndex + 1, samples.length - 1);
    const weight = sourceIndex - lowerIndex;

    resampled[index] =
      samples[lowerIndex] * (1 - weight) + samples[upperIndex] * weight;
  }

  return resampled;
}

function extractTranscript(
  output: { text?: string } | string | undefined,
): string {
  if (typeof output === "string") {
    return output.trim();
  }

  return output?.text?.trim() ?? "";
}

export async function transcribeRecordedAudio(
  blob: Blob,
  language = "en",
): Promise<string> {
  const transcriber = await getTranscriber();
  const audio = await blobToMonoPcm(blob);
  const output = await transcriber(audio, {
    language,
    task: "transcribe",
  });

  const text = extractTranscript(output);

  if (!text) {
    throw new Error("No speech was detected. Please try again.");
  }

  return text;
}

export function preloadSpeechModel(): void {
  void getTranscriber().catch(() => {
    transcriberPromise = null;
  });
}
