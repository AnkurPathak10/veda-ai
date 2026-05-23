import type { SpeechRecognitionConstructor } from "./types";

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export async function isBraveBrowser(): Promise<boolean> {
  if (typeof navigator === "undefined") {
    return false;
  }

  const brave = (
    navigator as Navigator & {
      brave?: { isBrave?: () => Promise<boolean> };
    }
  ).brave;

  if (!brave?.isBrave) {
    return false;
  }

  try {
    return await brave.isBrave();
  } catch {
    return false;
  }
}

export function supportsMediaRecording(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  );
}

export async function getPreferredSpeechMode(): Promise<
  "browser" | "recorder" | null
> {
  const brave = await isBraveBrowser();
  const hasBrowserSpeech = !brave && getSpeechRecognition() !== null;

  if (hasBrowserSpeech) {
    return "browser";
  }

  if (supportsMediaRecording()) {
    return "recorder";
  }

  return null;
}
