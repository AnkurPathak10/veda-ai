"use client";

import { useAuth } from "@clerk/nextjs";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { QuestionPaperPreview } from "@/components/create-assignment/question-paper-preview";
import { fetchAssignment } from "@/lib/assignments/api";
import { formatDisplayDate } from "@/lib/assignments/format-date";
import type { SavedAssignment } from "@/lib/assignments/types";
import type { QuestionPaper } from "@/lib/create-assignment/question-paper";

type AssignmentDetailProps = {
  assignmentId: string;
};

export function AssignmentDetail({ assignmentId }: AssignmentDetailProps) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [assignment, setAssignment] = useState<SavedAssignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAssignment = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const data = await fetchAssignment(assignmentId, token);
      setAssignment(data.assignment);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load assignment",
      );
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId, getToken]);

  useEffect(() => {
    void loadAssignment();
  }, [loadAssignment]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#6b7280]" />
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
        <p className="text-sm text-[#ef4444]">
          {error ?? "Assignment not found"}
        </p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-4 rounded-full bg-[#1a1a1a] px-5 py-2.5 text-sm font-semibold text-white"
        >
          Back to Assignments
        </button>
      </div>
    );
  }

  const questionPaper = assignment.questionPaper as QuestionPaper | null;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="flex items-center gap-3 border-b border-[#e5e7eb] px-4 py-4 lg:hidden">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#1a1a1a]"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="flex-1 truncate text-center text-base font-semibold text-[#1a1a1a]">
          {assignment.title}
        </h1>
        <div className="w-10" />
      </div>

      <div className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <div className="hidden lg:block">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
            <h1 className="text-2xl font-bold tracking-tight text-[#1a1a1a]">
              {assignment.title}
            </h1>
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-[#6b7280]">
            <p>
              Assigned on :{" "}
              <span className="font-medium text-[#374151]">
                {formatDisplayDate(assignment.assignedDate)}
              </span>
            </p>
            <p>
              Due :{" "}
              <span className="font-medium text-[#374151]">
                {formatDisplayDate(assignment.dueDate)}
              </span>
            </p>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap gap-4 text-xs text-[#6b7280] sm:text-sm lg:hidden">
          <p>
            Assigned on :{" "}
            <span className="font-medium text-[#374151]">
              {formatDisplayDate(assignment.assignedDate)}
            </span>
          </p>
          <p>
            Due :{" "}
            <span className="font-medium text-[#374151]">
              {formatDisplayDate(assignment.dueDate)}
            </span>
          </p>
        </div>

        {questionPaper ? (
          <QuestionPaperPreview questionPaper={questionPaper} />
        ) : (
          <div className="rounded-2xl border border-[#e5e7eb] bg-white px-5 py-8 text-center text-sm text-[#6b7280]">
            No question paper available for this assignment.
          </div>
        )}
      </div>
    </div>
  );
}
