import { Plus } from "lucide-react";
import { EmptyAssignmentsIllustration } from "./empty-assignments-illustration";

export function EmptyAssignmentsState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center sm:px-8">
      <EmptyAssignmentsIllustration />

      <h1 className="mt-6 text-2xl font-bold tracking-tight text-[#1a1a1a] sm:text-[28px]">
        No assignments yet
      </h1>

      <p className="mt-3 max-w-md text-sm leading-relaxed text-[#6b7280] sm:text-[15px]">
        Create your first assignment to start collecting and grading student
        submissions. You can set up rubrics, define marking criteria, and let AI
        assist with grading.
      </p>

      <button
        type="button"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#1a1a1a] px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#2d2d2d] sm:px-10 sm:text-base"
      >
        <Plus className="h-5 w-5" strokeWidth={2.5} />
        Create Your First Assignment
      </button>
    </div>
  );
}
