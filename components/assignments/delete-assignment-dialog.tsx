"use client";

import { Loader2 } from "lucide-react";
import type { AssignmentListItem } from "@/lib/assignments/types";

type DeleteAssignmentDialogProps = {
  assignment: AssignmentListItem | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteAssignmentDialog({
  assignment,
  isDeleting,
  onCancel,
  onConfirm,
}: DeleteAssignmentDialogProps) {
  if (!assignment) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        aria-label="Close delete dialog"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-[#1a1a1a]">Delete assignment?</h2>
        <p className="mt-2 text-sm leading-relaxed text-[#6b7280]">
          &ldquo;{assignment.title}&rdquo; will be permanently removed. This
          action cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-full border border-[#e5e7eb] px-5 py-2.5 text-sm font-semibold text-[#1a1a1a] transition-colors hover:bg-[#f9fafb] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 rounded-full bg-[#ef4444] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#dc2626] disabled:opacity-60"
          >
            {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
