"use client";

import { Loader2, Sparkles } from "lucide-react";

type GenerationLoadingProps = {
  progress?: number | null;
};

export function GenerationLoading({ progress = null }: GenerationLoadingProps) {
  const showProgress = typeof progress === "number";

  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="relative mb-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1a1a1a]">
          <Sparkles className="h-8 w-8 text-[#facc15]" />
        </div>
        <Loader2 className="absolute -right-1 -bottom-1 h-6 w-6 animate-spin text-[#6b7280]" />
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
