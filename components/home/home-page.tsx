"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import {
  CalendarClock,
  ClipboardList,
  FileText,
  Loader2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo } from "react";
import { EmptyAssignmentsState } from "@/components/dashboard/empty-assignments-state";
import { CREATE_ASSIGNMENT_HREF } from "@/components/dashboard/nav-items";
import { formatDisplayDate } from "@/lib/assignments/format-date";
import { fetchAssignments } from "@/lib/assignments/api";
import type { AssignmentListItem } from "@/lib/assignments/types";
import { useAssignmentsStore } from "@/stores/assignments-store";

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof ClipboardList;
}) {
  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#6b7280]">{label}</p>
          <p className="mt-1 text-3xl font-bold text-[#1a1a1a]">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f3f4f6]">
          <Icon className="h-5 w-5 text-[#4b5563]" />
        </div>
      </div>
    </div>
  );
}

function isDueWithinDays(dueDate: string | null, days: number) {
  if (!dueDate) {
    return false;
  }

  const due = new Date(`${dueDate}T23:59:59`);
  const now = new Date();
  const limit = new Date();
  limit.setDate(limit.getDate() + days);

  return due >= now && due <= limit;
}

export function HomePage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const assignments = useAssignmentsStore((s) => s.assignments);
  const total = useAssignmentsStore((s) => s.total);
  const isLoading = useAssignmentsStore((s) => s.isLoading);
  const error = useAssignmentsStore((s) => s.error);
  const setAssignments = useAssignmentsStore((s) => s.setAssignments);
  const setLoading = useAssignmentsStore((s) => s.setLoading);
  const setError = useAssignmentsStore((s) => s.setError);

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

  const stats = useMemo(() => {
    const withQuestionPaper = assignments.filter(
      (assignment) => assignment.hasQuestionPaper,
    ).length;
    const dueSoon = assignments.filter((assignment) =>
      isDueWithinDays(assignment.dueDate, 7),
    ).length;

    return {
      total,
      dueSoon,
      withQuestionPaper,
    };
  }, [assignments, total]);

  const recentAssignments = useMemo(
    () => assignments.slice(0, 3),
    [assignments],
  );

  const upcomingDue = useMemo(
    () =>
      assignments
        .filter((assignment) => isDueWithinDays(assignment.dueDate, 14))
        .slice(0, 5),
    [assignments],
  );

  const displayName =
    user?.firstName ||
    user?.fullName?.split(" ")[0] ||
    "Teacher";

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
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
            <h1 className="text-2xl font-bold tracking-tight text-[#1a1a1a]">
              {isLoaded ? `Welcome back, ${displayName}` : "Welcome back"}
            </h1>
          </div>
          <p className="mt-1 text-sm text-[#6b7280]">
            Here&apos;s an overview of your assignments and activity.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total Assignments" value={stats.total} icon={ClipboardList} />
          <StatCard label="Due This Week" value={stats.dueSoon} icon={CalendarClock} />
          <StatCard
            label="With Question Papers"
            value={stats.withQuestionPaper}
            icon={FileText}
          />
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={CREATE_ASSIGNMENT_HREF}
            className="inline-flex items-center gap-2 rounded-full bg-[#1a1a1a] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2d2d2d]"
          >
            <Sparkles className="h-4 w-4 text-[#fbbf24]" />
            Create Assignment
          </Link>
          <Link
            href="/library"
            className="inline-flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-5 py-2.5 text-sm font-semibold text-[#374151] transition-colors hover:bg-[#f9fafb]"
          >
            <FileText className="h-4 w-4" />
            My Library
          </Link>
        </div>

        <div className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#1a1a1a]">Recent Assignments</h2>
            <Link
              href="/"
              className="text-sm font-medium text-[#6b7280] hover:text-[#1a1a1a]"
            >
              See all
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
            {recentAssignments.map((assignment) => (
              <ReadOnlyAssignmentCard key={assignment.id} assignment={assignment} />
            ))}
          </div>
        </div>

        {upcomingDue.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-bold text-[#1a1a1a]">Upcoming Due Dates</h2>
            <div className="mt-4 overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white">
              {upcomingDue.map((assignment, index) => (
                <Link
                  key={assignment.id}
                  href={`/assignments/${assignment.id}`}
                  className={`flex items-center justify-between px-4 py-3.5 transition-colors hover:bg-[#f9fafb] ${
                    index > 0 ? "border-t border-[#f3f4f6]" : ""
                  }`}
                >
                  <span className="text-sm font-medium text-[#1a1a1a]">
                    {assignment.title}
                  </span>
                  <span className="text-xs text-[#6b7280]">
                    Due {assignment.dueDate}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ReadOnlyAssignmentCard({
  assignment,
}: {
  assignment: AssignmentListItem;
}) {
  return (
    <Link
      href={`/assignments/${assignment.id}`}
      className="block rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm transition-colors hover:border-[#d1d5db]"
    >
      <h3 className="text-base font-bold text-[#1a1a1a] sm:text-lg">
        {assignment.title}
      </h3>
      <div className="mt-8 flex items-end justify-between gap-4 text-xs text-[#6b7280] sm:text-sm">
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
    </Link>
  );
}
