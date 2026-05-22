"use client";

import { useAuth } from "@clerk/nextjs";
import { Filter, Loader2, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AssignmentCard } from "@/components/assignments/assignment-card";
import { DeleteAssignmentDialog } from "@/components/assignments/delete-assignment-dialog";
import { EmptyAssignmentsState } from "@/components/dashboard/empty-assignments-state";
import { CREATE_ASSIGNMENT_HREF } from "@/components/dashboard/nav-items";
import { deleteAssignment, fetchAssignments } from "@/lib/assignments/api";
import type { AssignmentListItem } from "@/lib/assignments/types";
import { useAssignmentsStore } from "@/stores/assignments-store";
import { useToastStore } from "@/stores/toast-store";

export function AssignmentsPage() {
  const { getToken } = useAuth();
  const assignments = useAssignmentsStore((s) => s.assignments);
  const total = useAssignmentsStore((s) => s.total);
  const isLoading = useAssignmentsStore((s) => s.isLoading);
  const error = useAssignmentsStore((s) => s.error);
  const setAssignments = useAssignmentsStore((s) => s.setAssignments);
  const setLoading = useAssignmentsStore((s) => s.setLoading);
  const setError = useAssignmentsStore((s) => s.setError);
  const removeAssignmentFromStore = useAssignmentsStore((s) => s.removeAssignment);
  const showToast = useToastStore((s) => s.show);

  const [searchQuery, setSearchQuery] = useState("");
  const [assignmentToDelete, setAssignmentToDelete] =
    useState<AssignmentListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
          : "Failed to load assignments",
      );
    } finally {
      setLoading(false);
    }
  }, [getToken, setAssignments, setError, setLoading]);

  useEffect(() => {
    void loadAssignments();
  }, [loadAssignments]);

  const filteredAssignments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return assignments;
    }

    return assignments.filter((assignment) =>
      assignment.title.toLowerCase().includes(query),
    );
  }, [assignments, searchQuery]);

  const handleDeleteConfirm = async () => {
    if (!assignmentToDelete) {
      return;
    }

    setIsDeleting(true);

    try {
      const token = await getToken();
      await deleteAssignment(assignmentToDelete.id, token);
      removeAssignmentFromStore(assignmentToDelete.id);
      showToast("Assignment deleted successfully");
      setAssignmentToDelete(null);
    } catch (deleteError) {
      showToast(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete assignment",
        "error",
      );
    } finally {
      setIsDeleting(false);
    }
  };

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

  if (total === 0) {
    return <EmptyAssignmentsState />;
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {/* Mobile sub-header */}
        <div className="flex items-center gap-3 border-b border-[#e5e7eb] px-4 py-4 lg:hidden">
          <div className="w-10" />
          <h1 className="flex-1 text-center text-base font-semibold text-[#1a1a1a]">
            Assignments
          </h1>
          <div className="w-10" />
        </div>

        <div className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          {/* Desktop header */}
          <div className="hidden lg:block">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
              <h1 className="text-2xl font-bold tracking-tight text-[#1a1a1a]">
                Assignments
              </h1>
            </div>
            <p className="mt-1 text-sm text-[#6b7280]">
              Manage and create assignments for your classes.
            </p>
          </div>

          {/* Search & filter */}
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:mt-8">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm font-medium text-[#374151] lg:px-5"
            >
              <Filter className="h-4 w-4" />
              <span className="lg:hidden">Filter</span>
              <span className="hidden lg:inline">Filter By</span>
            </button>

            <label className="relative block w-full sm:max-w-xs lg:max-w-sm">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search Assignment"
                className="w-full rounded-full border border-[#e5e7eb] bg-white py-2.5 pr-4 pl-11 text-sm text-[#1a1a1a] outline-none transition-colors placeholder:text-[#9ca3af] focus:border-[#1a1a1a]"
              />
            </label>
          </div>

          {filteredAssignments.length === 0 ? (
            <div className="mt-10 text-center text-sm text-[#6b7280]">
              No assignments match your search.
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 lg:mt-8 lg:grid-cols-2 lg:gap-5">
              {filteredAssignments.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  onDelete={setAssignmentToDelete}
                />
              ))}
            </div>
          )}
        </div>

        {/* Desktop floating create button */}
        <div className="pointer-events-none sticky bottom-6 hidden justify-center pb-2 lg:flex">
          <Link
            href={CREATE_ASSIGNMENT_HREF}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-[#1a1a1a] px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-[#2d2d2d]"
          >
            <Sparkles className="h-4 w-4 text-[#fbbf24]" />
            Create Assignment
          </Link>
        </div>
      </div>

      <DeleteAssignmentDialog
        assignment={assignmentToDelete}
        isDeleting={isDeleting}
        onCancel={() => setAssignmentToDelete(null)}
        onConfirm={() => void handleDeleteConfirm()}
      />
    </>
  );
}
