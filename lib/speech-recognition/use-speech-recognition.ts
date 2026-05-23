"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { preloadSpeechModel, transcribeRecordedAudio } from "./client-transcribe";
import { getPreferredSpeechMode } from "./detect-browser-speech";
import type {
  SpeechRecognitionConstructor,
  SpeechRecognitionInstance,
} from "./types";

type SpeechMode = "browser" | "recorder";

type UseSpeechRecognitionOptions = {
  value: string;
  onChange: (value: string) => void;
  lang?: string;
  onError?: (message: string) => void;
};

const MAX_RECORDING_MS = 60_000;
const MAX_RECORDING_BYTES = 8 * 1024 * 1024;
const RECORDER_BITRATE = 32_000;

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

function getRecorderMimeType(): string {
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
    return "audio/webm;codecs=opus";
  }

  if (MediaRecorder.isTypeSupported("audio/webm")) {
    return "audio/webm";
  }

  if (MediaRecorder.isTypeSupported("audio/mp4")) {
    return "audio/mp4";
  }

  return "";
}

function toWhisperLanguage(lang: string): string {
  return lang.split("-")[0]?.toLowerCase() ?? "en";
}

export function useSpeechRecognition({
  value,
  onChange,
  lang = "en-IN",
  onError,
}: UseSpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [mode, setMode] = useState<SpeechMode | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isListeningRef = useRef(false);
  const baseTextRef = useRef("");
  const finalTranscriptRef = useRef("");
  const onChangeRef = useRef(onChange);
  const onErrorRef = useRef(onError);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimeoutRef = useRef<number | null>(null);

  onChangeRef.current = onChange;
  onErrorRef.current = onError;

  const cleanupMediaRecording = useCallback(() => {
    if (recordingTimeoutRef.current !== null) {
      window.clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }

    mediaRecorderRef.current = null;
    audioChunksRef.current = [];

    for (const track of mediaStreamRef.current?.getTracks() ?? []) {
      track.stop();
    }

    mediaStreamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const preferredMode = await getPreferredSpeechMode();

      if (cancelled) {
        return;
      }

      if (!preferredMode) {
        setIsSupported(false);
        setMode(null);
        return;
      }

      setMode(preferredMode);
      setIsSupported(true);

      if (preferredMode === "recorder") {
        preloadSpeechModel();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (mode !== "browser") {
      return;
    }

    const SpeechRecognition = getSpeechRecognition();

    if (!SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onresult = (event) => {
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? "";

        if (result.isFinal) {
          finalTranscriptRef.current += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      onChangeRef.current(
        `${baseTextRef.current}${finalTranscriptRef.current}${interimTranscript}`,
      );
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted" || event.error === "no-speech") {
        return;
      }

      const message =
        event.error === "not-allowed"
          ? "Microphone access was denied. Allow mic permission in your browser."
          : event.error === "network"
            ? "Speech recognition needs an internet connection."
            : "Speech recognition failed. Please try again.";

      onErrorRef.current?.(message);
      isListeningRef.current = false;
      setIsListening(false);
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch {
          isListeningRef.current = false;
          setIsListening(false);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      isListeningRef.current = false;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [lang, mode]);

  useEffect(() => {
    return () => {
      cleanupMediaRecording();
    };
  }, [cleanupMediaRecording]);

  const stopBrowser = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    recognitionRef.current?.stop();
  }, []);

  const startBrowser = useCallback(() => {
    const recognition = recognitionRef.current;

    if (!recognition) {
      onErrorRef.current?.(
        "Speech recognition is not supported in this browser. Use Chrome or Edge.",
      );
      return;
    }

    baseTextRef.current = value;
    finalTranscriptRef.current = "";
    isListeningRef.current = true;
    setIsListening(true);

    try {
      recognition.start();
    } catch {
      isListeningRef.current = false;
      setIsListening(false);
      onErrorRef.current?.("Could not start speech recognition. Please try again.");
    }
  }, [value]);

  const stopRecorder = useCallback(async () => {
    const recorder = mediaRecorderRef.current;

    if (!recorder || recorder.state === "inactive") {
      cleanupMediaRecording();
      isListeningRef.current = false;
      setIsListening(false);
      setIsTranscribing(false);
      return;
    }

    isListeningRef.current = false;
    setIsListening(false);

    const transcript = await new Promise<string>((resolve, reject) => {
      recorder.onstop = () => {
        void (async () => {
          try {
            const blob = new Blob(audioChunksRef.current, {
              type: recorder.mimeType || "audio/webm",
            });

            cleanupMediaRecording();

            if (blob.size === 0) {
              reject(new Error("No audio was recorded. Please try again."));
              return;
            }

            if (blob.size > MAX_RECORDING_BYTES) {
              reject(
                new Error(
                  "Recording is too long. Try a shorter message and record again.",
                ),
              );
              return;
            }

            const text = await transcribeRecordedAudio(
              blob,
              toWhisperLanguage(lang),
            );

            resolve(text);
          } catch (error) {
            cleanupMediaRecording();
            reject(error);
          }
        })();
      };

      recorder.stop();
    }).catch((error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : "Could not transcribe your speech. Please try again.";

      onErrorRef.current?.(message);
      return null;
    });

    setIsTranscribing(false);

    if (!transcript) {
      return;
    }

    const prefix = baseTextRef.current;
    const separator =
      prefix.length > 0 && !/\s$/.test(prefix) ? " " : "";

    onChangeRef.current(`${prefix}${separator}${transcript}`);
  }, [cleanupMediaRecording, lang]);

  const startRecorder = useCallback(async () => {
    if (isTranscribing) {
      return;
    }

    baseTextRef.current = value;
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      const mimeType = getRecorderMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType, audioBitsPerSecond: RECORDER_BITRATE })
        : new MediaRecorder(stream, { audioBitsPerSecond: RECORDER_BITRATE });

      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        cleanupMediaRecording();
        isListeningRef.current = false;
        setIsListening(false);
        onErrorRef.current?.("Recording failed. Please try again.");
      };

      recorder.start();
      isListeningRef.current = true;
      setIsListening(true);

      recordingTimeoutRef.current = window.setTimeout(() => {
        if (!isListeningRef.current) {
          return;
        }

        onErrorRef.current?.(
          "Recording stopped after 60 seconds. Transcribing what was captured.",
        );
        setIsTranscribing(true);
        void stopRecorder();
      }, MAX_RECORDING_MS);
    } catch (error) {
      cleanupMediaRecording();

      const message =
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "Microphone access was denied. Allow mic permission in your browser."
          : "Could not access the microphone. Please try again.";

      onErrorRef.current?.(message);
    }
  }, [cleanupMediaRecording, isTranscribing, stopRecorder, value]);

  const stop = useCallback(() => {
    if (mode === "recorder") {
      setIsTranscribing(true);
      void stopRecorder();
      return;
    }

    stopBrowser();
  }, [mode, stopBrowser, stopRecorder]);

  const start = useCallback(() => {
    if (mode === "recorder") {
      void startRecorder();
      return;
    }

    startBrowser();
  }, [mode, startBrowser, startRecorder]);

  const toggle = useCallback(() => {
    if (isTranscribing) {
      return;
    }

    if (isListeningRef.current) {
      stop();
      return;
    }

    start();
  }, [isTranscribing, start, stop]);

  return {
    isListening,
    isTranscribing,
    isSupported,
    mode,
    start,
    stop,
    toggle,
  };
}
