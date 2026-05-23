"use client";

import { Sparkles } from "lucide-react";

type GenerationLoadingProps = {
  progress?: number | null;
};

export function GenerationLoading({ progress = null }: GenerationLoadingProps) {
  const showProgress = typeof progress === "number";

  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="relative mb-6 flex h-20 w-20 items-center justify-center">
        <div
          aria-hidden
          className="absolute h-16 w-16 rounded-2xl bg-[#1a1a1a]/25 animate-ai-glow"
        />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1a1a1a] animate-ai-breathe shadow-[0_8px_24px_rgba(26,26,26,0.18)]">
          <Sparkles className="h-8 w-8 text-[#facc15]" />
        </div>
      </div>
      <h2 className="text-lg font-bold text-[#1a1a1a]">
        Generating your question paper
      </h2>
      <p className="mt-2 max-w-md text-sm text-[#6b7280]">
        AI is reading your document and preparing sections, questions, and an
        answer key. This may take a minute.
      </p>
      {showProgress ? (
        <div className="mt-6 w-full max-w-xs">
          <div className="mb-2 text-sm font-medium text-[#1a1a1a]">
            {Math.round(progress)}% complete
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#e5e7eb]">
            <div
              className="h-full rounded-full bg-[#1a1a1a] transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
