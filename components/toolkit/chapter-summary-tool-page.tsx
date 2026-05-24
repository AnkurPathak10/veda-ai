"use client";

import { useState } from "react";
import { generateToolkit } from "@/lib/toolkit/generate";
import { formatChapterSummaryText } from "@/lib/toolkit/format-result";
import { getToolkitTool } from "@/lib/toolkit/tools";
import type { ChapterSummary } from "@/lib/toolkit/types";
import { ToolkitGenerationLoading } from "./toolkit-generation-loading";
import {
  getToolkitIntroMessage,
  ToolkitResultPreview,
} from "./toolkit-result-preview";
import {
  ToolkitFieldLabel,
  ToolkitGenerateButton,
  ToolkitIntroBanner,
  ToolkitResultActions,
  ToolkitResultCard,
  ToolkitSelect,
  ToolkitTextArea,
  ToolkitToolShell,
} from "./toolkit-tool-shell";
import {
  ToolkitUploadZone,
  type UploadedFileInfo,
} from "./toolkit-upload-zone";
import { useSaveToLibrary } from "./use-save-to-library";

const tool = getToolkitTool("chapter-summary");

export function ChapterSummaryToolPage() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFileInfo | null>(
    null,
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [summaryLength, setSummaryLength] = useState<
    "short" | "medium" | "detailed"
  >("medium");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ChapterSummary | null>(null);
  const { handleSave, isSaving, isSaved } = useSaveToLibrary(
    "chapter-summary",
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
          tool: "chapter-summary",
          uploadedFile: {
            filename: uploadedFile.filename,
            originalName: uploadedFile.originalName,
            mimeType: uploadedFile.mimeType,
          },
          summaryLength,
          additionalInfo: additionalInfo.trim() || undefined,
        },
        { onProgress: setProgress },
      );

      setResult(response.result as ChapterSummary);
    } catch (generateError) {
      setError(
        generateError instanceof Error
          ? generateError.message
          : "Failed to generate chapter summary",
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
          title="Creating your chapter summary"
          description="AI is building a revision handout with key points, terms, and self-check questions."
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
            onCopy={() => formatChapterSummaryText(result)}
            onStartOver={handleStartOver}
          />
          <ToolkitResultPreview tool="chapter-summary" result={result} />
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

        <ToolkitResultCard title="Summary settings">
          <div>
            <ToolkitFieldLabel>Summary length</ToolkitFieldLabel>
            <ToolkitSelect
              value={summaryLength}
              onChange={(value) =>
                setSummaryLength(value as "short" | "medium" | "detailed")
              }
              options={[
                { value: "short", label: "Short — quick revision" },
                { value: "medium", label: "Medium — balanced" },
                { value: "detailed", label: "Detailed — comprehensive" },
              ]}
            />
          </div>
          <div>
            <ToolkitFieldLabel>Additional notes (optional)</ToolkitFieldLabel>
            <ToolkitTextArea
              value={additionalInfo}
              onChange={setAdditionalInfo}
              placeholder="Exam focus, topics to emphasize, or class level..."
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
