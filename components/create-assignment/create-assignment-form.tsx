"use client";

import { ArrowLeft, ArrowRight, Loader2, Mic } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileUploadZone } from "@/components/create-assignment/file-upload-zone";
import { DueDatePicker } from "@/components/create-assignment/due-date-picker";
import { GenerationLoading } from "@/components/create-assignment/generation-loading";
import { QuestionPaperPreview } from "@/components/create-assignment/question-paper-preview";
import {
  AddQuestionTypeButton,
  QuestionTypeRowDesktop,
  QuestionTypeRowMobile,
} from "@/components/create-assignment/question-type-rows";
import { generateQuestionPaper } from "@/lib/create-assignment/generate-question-paper";
import {
  getAssignmentTotals,
  useCreateAssignmentStore,
} from "@/stores/create-assignment-store";

export function CreateAssignmentForm() {
  const router = useRouter();

  const step = useCreateAssignmentStore((s) => s.step);
  const uploadedFile = useCreateAssignmentStore((s) => s.uploadedFile);
  const dueDate = useCreateAssignmentStore((s) => s.dueDate);
  const questionRows = useCreateAssignmentStore((s) => s.questionRows);
  const additionalInfo = useCreateAssignmentStore((s) => s.additionalInfo);
  const errors = useCreateAssignmentStore((s) => s.errors);
  const isGenerating = useCreateAssignmentStore((s) => s.isGenerating);
  const generationError = useCreateAssignmentStore((s) => s.generationError);
  const questionPaper = useCreateAssignmentStore((s) => s.questionPaper);
  const setStep = useCreateAssignmentStore((s) => s.setStep);
  const setDueDate = useCreateAssignmentStore((s) => s.setDueDate);
  const setAdditionalInfo = useCreateAssignmentStore((s) => s.setAdditionalInfo);
  const setIsGenerating = useCreateAssignmentStore((s) => s.setIsGenerating);
  const setGenerationError = useCreateAssignmentStore((s) => s.setGenerationError);
  const setQuestionPaper = useCreateAssignmentStore((s) => s.setQuestionPaper);
  const addQuestionRow = useCreateAssignmentStore((s) => s.addQuestionRow);
  const removeQuestionRow = useCreateAssignmentStore((s) => s.removeQuestionRow);
  const updateQuestionRow = useCreateAssignmentStore((s) => s.updateQuestionRow);
  const validate = useCreateAssignmentStore((s) => s.validate);

  const { totalQuestions, totalMarks } = getAssignmentTotals(questionRows);

  const handleNext = async () => {
    if (!validate() || !uploadedFile || isGenerating) {
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setStep(2);

    try {
      const result = await generateQuestionPaper({
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
      });

      setQuestionPaper(result.questionPaper);
    } catch (error) {
      setGenerationError(
        error instanceof Error
          ? error.message
          : "Failed to generate question paper",
      );
      setQuestionPaper(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrevious = () => {
    if (step === 2) {
      setStep(1);
      setGenerationError(null);
      return;
    }

    router.push("/");
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
                  <Mic
                    className="pointer-events-none absolute bottom-3 right-3 h-5 w-5 text-[#9ca3af]"
                    strokeWidth={1.75}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 lg:mt-8">
            {isGenerating && <GenerationLoading />}

            {!isGenerating && generationError && (
              <div className="rounded-2xl border border-[#fecaca] bg-[#fef2f2] px-5 py-4 text-sm text-[#b91c1c]">
                {generationError}
              </div>
            )}

            {!isGenerating && questionPaper && (
              <QuestionPaperPreview questionPaper={questionPaper} />
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
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-[#1a1a1a] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2d2d2d]"
            >
              Done
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
