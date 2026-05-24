"use client";

import { useState } from "react";
import { generateToolkit } from "@/lib/toolkit/generate";
import { formatDifferentiatedPapersText } from "@/lib/toolkit/format-result";
import { getToolkitTool } from "@/lib/toolkit/tools";
import type { DifferentiatedPapers } from "@/lib/toolkit/types";
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

const tool = getToolkitTool("differentiated-papers");

export function DifferentiatedPapersToolPage() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFileInfo | null>(
    null,
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(10);
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DifferentiatedPapers | null>(null);
  const { handleSave, isSaving, isSaved } = useSaveToLibrary(
    "differentiated-papers",
    result,
  );

  const handleGenerate = async () => {
    if (!uploadedFile || isGenerating) {
      return;
    }

    if (questionCount < 3 || questionCount > 20) {
      setError("Please enter between 3 and 20 questions per paper.");
      return;
    }

    setError(null);
    setIsGenerating(true);
    setProgress(0);

    try {
      const response = await generateToolkit(
        {
          tool: "differentiated-papers",
          uploadedFile: {
            filename: uploadedFile.filename,
            originalName: uploadedFile.originalName,
            mimeType: uploadedFile.mimeType,
          },
          questionCount,
          additionalInfo: additionalInfo.trim() || undefined,
        },
        { onProgress: setProgress },
      );

      setResult(response.result as DifferentiatedPapers);
    } catch (generateError) {
      setError(
        generateError instanceof Error
          ? generateError.message
          : "Failed to generate differentiated papers",
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
          title="Creating differentiated papers"
          description="AI is generating Easy, Moderate, and Challenging papers from your material."
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
            onCopy={() => formatDifferentiatedPapersText(result)}
            onStartOver={handleStartOver}
          />
          <ToolkitResultPreview tool="differentiated-papers" result={result} />
        </div>
      </ToolkitToolShell>
    );
  }

  return (
    <ToolkitToolShell title={tool.title} description={tool.description}>
      <div className="mx-auto max-w-2xl space-y-6">
        <ToolkitResultCard>
          <ToolkitFieldLabel>Upload source material</ToolkitFieldLabel>
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

        <ToolkitResultCard title="Paper settings">
          <div>
            <ToolkitFieldLabel>Questions per paper</ToolkitFieldLabel>
            <ToolkitNumberInput
              value={questionCount}
              onChange={setQuestionCount}
              min={3}
              max={20}
            />
            <p className="mt-1 text-xs text-[#9ca3af]">
              Between 3 and 20 questions per paper
            </p>
          </div>
          <div>
            <ToolkitFieldLabel>Additional notes (optional)</ToolkitFieldLabel>
            <ToolkitTextArea
              value={additionalInfo}
              onChange={setAdditionalInfo}
              placeholder="Topic emphasis, class level, or differentiation guidance..."
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
