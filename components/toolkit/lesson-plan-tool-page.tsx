"use client";

import { useState } from "react";
import { generateToolkit } from "@/lib/toolkit/generate";
import { formatLessonPlanText } from "@/lib/toolkit/format-result";
import { getToolkitTool } from "@/lib/toolkit/tools";
import type { LessonPlan } from "@/lib/toolkit/types";
import { ToolkitGenerationLoading } from "./toolkit-generation-loading";
import {
  getToolkitIntroMessage,
  ToolkitResultPreview,
} from "./toolkit-result-preview";
import {
  ToolkitFieldLabel,
  ToolkitGenerateButton,
  ToolkitIntroBanner,
  ToolkitNumberInput,
  ToolkitResultActions,
  ToolkitResultCard,
  ToolkitTextArea,
  ToolkitToolShell,
} from "./toolkit-tool-shell";
import {
  ToolkitUploadZone,
  type UploadedFileInfo,
} from "./toolkit-upload-zone";
import { useSaveToLibrary } from "./use-save-to-library";

const tool = getToolkitTool("lesson-plan");

export function LessonPlanToolPage() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFileInfo | null>(
    null,
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [className, setClassName] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LessonPlan | null>(null);
  const { handleSave, isSaving, isSaved } = useSaveToLibrary(
    "lesson-plan",
    result,
  );

  const handleGenerate = async () => {
    if (!uploadedFile || isGenerating) {
      return;
    }

    setError(null);
    setIsGenerating(true);
    setProgress(0);

    try {
      const response = await generateToolkit(
        {
          tool: "lesson-plan",
          uploadedFile: {
            filename: uploadedFile.filename,
            originalName: uploadedFile.originalName,
            mimeType: uploadedFile.mimeType,
          },
          durationMinutes,
          className: className.trim() || undefined,
          additionalInfo: additionalInfo.trim() || undefined,
        },
        { onProgress: setProgress },
      );

      setResult(response.result as LessonPlan);
    } catch (generateError) {
      setError(
        generateError instanceof Error
          ? generateError.message
          : "Failed to generate lesson plan",
      );
    } finally {
      setIsGenerating(false);
      setProgress(null);
    }
  };

  const handleStartOver = () => {
    setResult(null);
    setError(null);
  };

  if (isGenerating) {
    return (
      <ToolkitToolShell title={tool.title} description={tool.description}>
        <ToolkitGenerationLoading
          title="Building your lesson plan"
          description="AI is reading your document and structuring objectives, activities, and homework."
          progress={progress}
        />
      </ToolkitToolShell>
    );
  }

  if (result) {
    const introMessage = getToolkitIntroMessage(result);

    return (
      <ToolkitToolShell title={tool.title} description={tool.description}>
        <div className="space-y-6">
          {introMessage ? (
            <ToolkitIntroBanner message={introMessage} />
          ) : null}
          <ToolkitResultActions
            onSave={() => void handleSave()}
            isSaving={isSaving}
            isSaved={isSaved}
            onCopy={() => formatLessonPlanText(result)}
            onStartOver={handleStartOver}
          />
          <ToolkitResultPreview tool="lesson-plan" result={result} />
        </div>
      </ToolkitToolShell>
    );
  }

  return (
    <ToolkitToolShell title={tool.title} description={tool.description}>
      <div className="mx-auto max-w-2xl space-y-6">
        <ToolkitResultCard>
          <ToolkitFieldLabel>Upload chapter material</ToolkitFieldLabel>
          <ToolkitUploadZone
            uploadedFile={uploadedFile}
            isUploading={isUploading}
            uploadError={uploadError}
            onUploaded={setUploadedFile}
            onClear={() => setUploadedFile(null)}
            onUploadError={setUploadError}
            onUploadStart={() => {
              setIsUploading(true);
              setUploadError(null);
            }}
            onUploadComplete={() => setIsUploading(false)}
          />
        </ToolkitResultCard>

        <ToolkitResultCard title="Lesson settings">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <ToolkitFieldLabel>Duration (minutes)</ToolkitFieldLabel>
              <ToolkitNumberInput
                value={durationMinutes}
                onChange={setDurationMinutes}
                min={20}
                max={120}
              />
            </div>
            <div>
              <ToolkitFieldLabel>Class (optional)</ToolkitFieldLabel>
              <input
                value={className}
                onChange={(event) => setClassName(event.target.value)}
                placeholder="e.g. Class 10"
                className="w-full rounded-2xl border border-[#e5e7eb] bg-white px-4 py-3 text-sm text-[#1a1a1a] outline-none transition-colors placeholder:text-[#9ca3af] focus:border-[#1a1a1a]"
              />
            </div>
          </div>
          <div>
            <ToolkitFieldLabel>Additional notes (optional)</ToolkitFieldLabel>
            <ToolkitTextArea
              value={additionalInfo}
              onChange={setAdditionalInfo}
              placeholder="Focus areas, teaching style, or special instructions..."
            />
          </div>
        </ToolkitResultCard>

        {error ? (
          <p className="rounded-2xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">
            {error}
          </p>
        ) : null}

        <ToolkitGenerateButton
          onClick={() => void handleGenerate()}
          disabled={!uploadedFile || isUploading}
        />
      </div>
    </ToolkitToolShell>
  );
}
