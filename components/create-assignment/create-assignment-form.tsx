"use client";

import { useAuth } from "@clerk/nextjs";
import { ArrowLeft, ArrowRight, Loader2, Mic } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileUploadZone } from "@/components/create-assignment/file-upload-zone";
import { DueDatePicker } from "@/components/create-assignment/due-date-picker";
import { GenerationLoading } from "@/components/create-assignment/generation-loading";
import { QuestionPaperPreview } from "@/components/create-assignment/question-paper-preview";
import {
  AddQuestionTypeButton,
  QuestionTypeRowDesktop,
  QuestionTypeRowMobile,
} from "@/components/create-assignment/question-type-rows";
import { createAssignment } from "@/lib/assignments/api";
import { generateQuestionPaper } from "@/lib/create-assignment/generate-question-paper";
import { computeGenerationInputHash } from "@/lib/create-assignment/generation-input-hash";
import { createNotification } from "@/lib/notifications/api";
import { refreshNotificationsStore } from "@/lib/notifications/refresh";
import { useSpeechRecognition } from "@/lib/speech-recognition/use-speech-recognition";
import {
  getAssignmentTotals,
  resetCreateAssignmentStore,
  useCreateAssignmentStore,
} from "@/stores/create-assignment-store";
import { useToastStore } from "@/stores/toast-store";

export function CreateAssignmentForm() {
  const router = useRouter();
  const { getToken } = useAuth();
  const showToast = useToastStore((s) => s.show);

  const step = useCreateAssignmentStore((s) => s.step);
  const uploadedFile = useCreateAssignmentStore((s) => s.uploadedFile);
  const dueDate = useCreateAssignmentStore((s) => s.dueDate);
  const questionRows = useCreateAssignmentStore((s) => s.questionRows);
  const additionalInfo = useCreateAssignmentStore((s) => s.additionalInfo);
  const errors = useCreateAssignmentStore((s) => s.errors);
  const isGenerating = useCreateAssignmentStore((s) => s.isGenerating);
  const generationError = useCreateAssignmentStore((s) => s.generationError);
  const questionPaper = useCreateAssignmentStore((s) => s.questionPaper);
  const generationInputHash = useCreateAssignmentStore(
    (s) => s.generationInputHash,
  );
  const isSaving = useCreateAssignmentStore((s) => s.isSaving);
  const saveError = useCreateAssignmentStore((s) => s.saveError);
  const setStep = useCreateAssignmentStore((s) => s.setStep);
  const setDueDate = useCreateAssignmentStore((s) => s.setDueDate);
  const setAdditionalInfo = useCreateAssignmentStore((s) => s.setAdditionalInfo);
  const setIsGenerating = useCreateAssignmentStore((s) => s.setIsGenerating);
  const setGenerationError = useCreateAssignmentStore((s) => s.setGenerationError);
  const setQuestionPaper = useCreateAssignmentStore((s) => s.setQuestionPaper);
  const setGenerationInputHash = useCreateAssignmentStore(
    (s) => s.setGenerationInputHash,
  );
  const setIsSaving = useCreateAssignmentStore((s) => s.setIsSaving);
  const setSaveError = useCreateAssignmentStore((s) => s.setSaveError);
  const addQuestionRow = useCreateAssignmentStore((s) => s.addQuestionRow);
  const removeQuestionRow = useCreateAssignmentStore((s) => s.removeQuestionRow);
  const updateQuestionRow = useCreateAssignmentStore((s) => s.updateQuestionRow);
  const validate = useCreateAssignmentStore((s) => s.validate);
  const [generationProgress, setGenerationProgress] = useState<number | null>(
    null,
  );

  const { totalQuestions, totalMarks } = getAssignmentTotals(questionRows);

  const { isListening, isTranscribing, isSupported, toggle: toggleSpeechRecognition } =
    useSpeechRecognition({
      value: additionalInfo,
      onChange: setAdditionalInfo,
      onError: (message) => showToast(message, "error"),
    });

  const handleNext = async () => {
    if (!validate() || !uploadedFile || isGenerating) {
      return;
    }

    const currentInputHash = computeGenerationInputHash({
      uploadedFile,
      questionRows,
      additionalInfo,
      dueDate,
    });

    setGenerationError(null);
    setStep(2);

    if (questionPaper && generationInputHash === currentInputHash) {
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      const result = await generateQuestionPaper(
        {
          uploadedFile: {
            filename: uploadedFile.filename,
            originalName: uploadedFile.originalName,
            mimeType: uploadedFile.mimeType,
          },
          questionRows: questionRows.map(({ type, count, marks }) => ({
            type,
            count,
            marks,
          })),
          additionalInfo: additionalInfo.trim() || undefined,
          dueDate: dueDate || undefined,
        },
        {
          onProgress: (progress) => {
            setGenerationProgress(progress);
          },
        },
      );

      setQuestionPaper(result.questionPaper);
      setGenerationInputHash(currentInputHash);

      const token = await getToken();
      const subject = result.questionPaper.header.subject?.trim();
      await createNotification(
        {
          type: "SUCCESS",
          title: "Question paper generated",
          message: subject
            ? `Your question paper for ${subject} is ready to preview`
            : "Your question paper is ready to preview",
        },
        token,
      );
      await refreshNotificationsStore(getToken);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to generate question paper";
      setGenerationError(message);
      setQuestionPaper(null);
      setGenerationInputHash(null);

      const token = await getToken();
      await createNotification(
        {
          type: "ERROR",
          title: "Generation failed",
          message,
        },
        token,
      );
      await refreshNotificationsStore(getToken);
    } finally {
      setIsGenerating(false);
      setGenerationProgress(null);
    }
  };

  const handlePrevious = () => {
    if (step === 2) {
      setStep(1);
      setGenerationError(null);
      setSaveError(null);
      return;
    }

    router.push("/");
  };

  const handleDone = async () => {
    if (!uploadedFile || !questionPaper || !dueDate || isSaving) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const token = await getToken();
      await createAssignment(
        {
          dueDate,
          additionalInfo: additionalInfo.trim() || undefined,
          uploadedFile,
          questionRows: questionRows.map(({ type, count, marks }) => ({
            type,
            count,
            marks,
          })),
          questionPaper,
        },
        token,
      );

      resetCreateAssignmentStore();
      showToast("Assignment saved successfully");
      await refreshNotificationsStore(getToken);
      router.push("/");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save assignment";
      setSaveError(message);
      showToast(message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const progressWidth = step === 1 ? "w-1/2" : "w-full";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      {/* Mobile sub-header */}
      <div className="flex items-center gap-3 border-b border-[#e5e7eb] px-4 py-4 lg:hidden">
        <button
          type="button"
          onClick={handlePrevious}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#1a1a1a]"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-center text-base font-semibold text-[#1a1a1a]">
          {step === 1 ? "Create Assignment" : "Question Paper"}
        </h1>
        <div className="w-10" />
      </div>

      <div className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        {/* Desktop header */}
        <div className="hidden lg:block">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
            <h1 className="text-2xl font-bold tracking-tight text-[#1a1a1a]">
              {step === 1 ? "Create Assignment" : "Question Paper"}
            </h1>
          </div>
          <p className="mt-1 text-sm text-[#6b7280]">
            {step === 1
              ? "Set up a new assignment for your students"
              : "Review the AI-generated question paper"}
          </p>
          <div className="mt-5 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-[#e5e7eb]">
            <div
              className={`h-full rounded-full bg-[#1a1a1a] transition-all ${progressWidth}`}
            />
          </div>
        </div>

        {/* Mobile progress bar */}
        <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-[#e5e7eb] lg:hidden">
          <div
            className={`h-full rounded-full bg-[#1a1a1a] transition-all ${progressWidth}`}
          />
        </div>

        {step === 1 ? (
          <div className="mt-6 rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm sm:p-6 lg:mt-8 lg:p-8">
            <div>
              <h2 className="text-lg font-bold text-[#1a1a1a]">
                Assignment Details
              </h2>
              <p className="mt-1 text-sm text-[#6b7280]">
                Basic information about your assignment
              </p>
            </div>

            <div className="mt-6 space-y-6">
              <FileUploadZone />

              <div>
                <label
                  htmlFor="due-date"
                  className="mb-2 block text-sm font-semibold text-[#1a1a1a]"
                >
                  Due Date
                </label>
                <DueDatePicker
                  id="due-date"
                  value={dueDate}
                  onChange={setDueDate}
                  error={errors.dueDate}
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#1a1a1a] lg:mb-4">
                  Question Type
                </h3>

                <div className="hidden lg:block">
                  <div className="grid grid-cols-[1fr_140px_140px_40px] gap-4 border-b border-[#e5e7eb] pb-3 text-xs font-medium text-[#9ca3af]">
                    <span>Question Type</span>
                    <span>No. of Questions</span>
                    <span>Marks</span>
                    <span />
                  </div>
                  {questionRows.map((row) => (
                    <QuestionTypeRowDesktop
                      key={row.id}
                      row={row}
                      canRemove={questionRows.length > 1}
                      rowErrors={errors.rows?.[row.id]}
                      onUpdate={updateQuestionRow}
                      onRemove={removeQuestionRow}
                    />
                  ))}
                </div>

                <div className="space-y-3 lg:hidden">
                  {questionRows.map((row) => (
                    <QuestionTypeRowMobile
                      key={row.id}
                      row={row}
                      canRemove={questionRows.length > 1}
                      rowErrors={errors.rows?.[row.id]}
                      onUpdate={updateQuestionRow}
                      onRemove={removeQuestionRow}
                    />
                  ))}
                </div>

                {errors.questionTypes && (
                  <p className="mt-2 text-sm text-[#ef4444]">
                    {errors.questionTypes}
                  </p>
                )}

                <AddQuestionTypeButton onClick={addQuestionRow} />

                <div className="mt-6 flex flex-col items-end gap-1 text-sm">
                  <p className="font-medium text-[#1a1a1a]">
                    Total Questions :{" "}
                    <span className="font-bold">{totalQuestions}</span>
                  </p>
                  <p className="font-medium text-[#1a1a1a]">
                    Total Marks :{" "}
                    <span className="font-bold">{totalMarks}</span>
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="additional-info"
                  className="mb-2 block text-sm font-semibold text-[#1a1a1a]"
                >
                  Additional Information{" "}
                  <span className="font-normal text-[#9ca3af]">
                    (For better output)
                  </span>
                </label>
                <div className="relative">
                  <textarea
                    id="additional-info"
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    rows={4}
                    placeholder="e.g Generate a question paper for 3 hour exam duration..."
                    className="w-full resize-none rounded-2xl border border-[#e5e7eb] bg-white px-4 py-3 pr-12 text-sm text-[#1a1a1a] outline-none transition-colors placeholder:text-[#9ca3af] focus:border-[#1a1a1a]"
                  />
                  <button
                    type="button"
                    onClick={toggleSpeechRecognition}
                    disabled={!isSupported || isTranscribing}
                    aria-label={
                      isTranscribing
                        ? "Transcribing speech"
                        : isListening
                          ? "Stop voice input"
                          : "Start voice input"
                    }
                    aria-pressed={isListening}
                    title={
                      !isSupported
                        ? "Voice input works in Chrome, Edge, and Brave"
                        : isTranscribing
                          ? "Transcribing speech..."
                          : isListening
                            ? "Stop listening"
                            : "Speak to type"
                    }
                    className={`absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                      isListening || isTranscribing
                        ? "bg-[#fef2f2] text-[#ef4444] hover:bg-[#fee2e2]"
                        : "text-[#9ca3af] hover:bg-[#f3f4f6] hover:text-[#1a1a1a]"
                    }`}
                  >
                    {isTranscribing ? (
                      <Loader2
                        className="h-5 w-5 animate-spin"
                        strokeWidth={1.75}
                      />
                    ) : (
                      <Mic
                        className={`h-5 w-5 ${isListening ? "animate-pulse" : ""}`}
                        strokeWidth={1.75}
                      />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 lg:mt-8">
            {isGenerating && (
              <GenerationLoading progress={generationProgress} />
            )}

            {!isGenerating && generationError && (
              <div className="rounded-2xl border border-[#fecaca] bg-[#fef2f2] px-5 py-4 text-sm text-[#b91c1c]">
                {generationError}
              </div>
            )}

            {!isGenerating && questionPaper && (
              <QuestionPaperPreview questionPaper={questionPaper} />
            )}

            {!isGenerating && saveError && (
              <div className="mt-4 rounded-2xl border border-[#fecaca] bg-[#fef2f2] px-5 py-4 text-sm text-[#b91c1c]">
                {saveError}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer navigation */}
      <div className="sticky bottom-0 border-t border-[#e5e7eb] bg-[#f5f5f5] px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handlePrevious}
            className="inline-flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-6 py-3 text-sm font-semibold text-[#1a1a1a] transition-colors hover:bg-[#f9fafb]"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </button>

          {step === 1 ? (
            <button
              type="button"
              onClick={() => void handleNext()}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 rounded-full bg-[#1a1a1a] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2d2d2d] disabled:opacity-60"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleDone()}
              disabled={isSaving || isGenerating || !questionPaper}
              className="inline-flex items-center gap-2 rounded-full bg-[#1a1a1a] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2d2d2d] disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Done
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
