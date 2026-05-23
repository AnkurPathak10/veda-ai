"use client";

import { useAuth } from "@clerk/nextjs";
import { FileText, Loader2, Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDisplayDate } from "@/lib/assignments/format-date";
import { fetchAssignments } from "@/lib/assignments/api";
import type { AssignmentListItem } from "@/lib/assignments/types";
import { useAssignmentsStore } from "@/stores/assignments-store";

export function LibraryPage() {
  const { getToken } = useAuth();
  const assignments = useAssignmentsStore((s) => s.assignments);
  const isLoading = useAssignmentsStore((s) => s.isLoading);
  const error = useAssignmentsStore((s) => s.error);
  const setAssignments = useAssignmentsStore((s) => s.setAssignments);
  const setLoading = useAssignmentsStore((s) => s.setLoading);
  const setError = useAssignmentsStore((s) => s.setError);
  const [searchQuery, setSearchQuery] = useState("");

  const loadAssignments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const data = await fetchAssignments(token);
      setAssignments(data.assignments, data.total);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load library",
      );
    } finally {
      setLoading(false);
    }
  }, [getToken, setAssignments, setError, setLoading]);

  useEffect(() => {
    void loadAssignments();
  }, [loadAssignments]);

  const libraryItems = useMemo(() => {
    const withPapers = assignments.filter(
      (assignment) => assignment.hasQuestionPaper,
    );
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return withPapers;
    }

    return withPapers.filter((assignment) =>
      assignment.title.toLowerCase().includes(query),
    );
  }, [assignments, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#6b7280]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
        <p className="text-sm text-[#ef4444]">{error}</p>
        <button
          type="button"
          onClick={() => void loadAssignments()}
          className="mt-4 rounded-full bg-[#1a1a1a] px-5 py-2.5 text-sm font-semibold text-white"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
            <h1 className="text-2xl font-bold tracking-tight text-[#1a1a1a]">
              My Library
            </h1>
          </div>
          <p className="mt-1 text-sm text-[#6b7280]">
            Browse your saved question papers and generated assignments.
          </p>
        </div>

        <div className="mt-8 flex justify-end">
          <label className="relative block w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search library"
              className="w-full rounded-full border border-[#e5e7eb] bg-white py-2.5 pr-4 pl-11 text-sm text-[#1a1a1a] outline-none transition-colors placeholder:text-[#9ca3af] focus:border-[#1a1a1a]"
            />
          </label>
        </div>

        {libraryItems.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f3f4f6]">
              <FileText className="h-8 w-8 text-[#9ca3af]" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-[#1a1a1a]">
              No question papers yet
            </h2>
            <p className="mt-2 max-w-sm text-sm text-[#6b7280]">
              Create an assignment and generate a question paper to see it here.
            </p>
            <Link
              href="/assignments/create"
              className="mt-6 rounded-full bg-[#1a1a1a] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Create Assignment
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
            {libraryItems.map((assignment) => (
              <LibraryCard key={assignment.id} assignment={assignment} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LibraryCard({ assignment }: { assignment: AssignmentListItem }) {
  return (
    <Link
      href={`/assignments/${assignment.id}`}
      className="block rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm transition-colors hover:border-[#d1d5db]"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ecfdf5]">
          <FileText className="h-5 w-5 text-[#22c55e]" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-[#1a1a1a] sm:text-lg">
            {assignment.title}
          </h3>
          <p className="mt-1 text-xs text-[#6b7280]">
            Generated question paper
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-end justify-between gap-4 text-xs text-[#6b7280] sm:text-sm">
        <p>
          Created :{" "}
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
    </Link>
  );
}
