import type { AssignmentListItem } from "./types";

export type AssignmentSortOption =
  | "due-date-asc"
  | "due-date-desc"
  | "assigned-date-desc"
  | "assigned-date-asc"
  | "title-asc"
  | "title-desc";

export type AssignmentFilterOption =
  | "all"
  | "with-question-paper"
  | "without-question-paper"
  | "due-soon"
  | "overdue";

export type AssignmentFilters = {
  sort: AssignmentSortOption;
  filter: AssignmentFilterOption;
};

export const DEFAULT_ASSIGNMENT_FILTERS: AssignmentFilters = {
  sort: "due-date-asc",
  filter: "all",
};

export const ASSIGNMENT_SORT_OPTIONS: Array<{
  value: AssignmentSortOption;
  label: string;
}> = [
  { value: "due-date-asc", label: "Due date: soonest first" },
  { value: "due-date-desc", label: "Due date: latest first" },
  { value: "assigned-date-desc", label: "Assigned: newest first" },
  { value: "assigned-date-asc", label: "Assigned: oldest first" },
  { value: "title-asc", label: "Title: A to Z" },
  { value: "title-desc", label: "Title: Z to A" },
];

export const ASSIGNMENT_FILTER_OPTIONS: Array<{
  value: AssignmentFilterOption;
  label: string;
}> = [
  { value: "all", label: "All assignments" },
  { value: "with-question-paper", label: "With question paper" },
  { value: "without-question-paper", label: "Without question paper" },
  { value: "due-soon", label: "Due within 7 days" },
  { value: "overdue", label: "Overdue" },
];

function parseIsoDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const isoDate = value.includes("T") ? value.slice(0, 10) : value;
  const [year, month, day] = isoDate.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function matchesFilter(
  assignment: AssignmentListItem,
  filter: AssignmentFilterOption,
): boolean {
  switch (filter) {
    case "all":
      return true;
    case "with-question-paper":
      return assignment.hasQuestionPaper;
    case "without-question-paper":
      return !assignment.hasQuestionPaper;
    case "due-soon": {
      const due = parseIsoDate(assignment.dueDate);
      if (!due) {
        return false;
      }

      const today = startOfToday();
      const limit = new Date(today);
      limit.setDate(limit.getDate() + 7);

      return due >= today && due <= limit;
    }
    case "overdue": {
      const due = parseIsoDate(assignment.dueDate);
      if (!due) {
        return false;
      }

      return due < startOfToday();
    }
    default:
      return true;
  }
}

function compareDueDates(
  left: AssignmentListItem,
  right: AssignmentListItem,
  direction: "asc" | "desc",
) {
  const leftDue = parseIsoDate(left.dueDate);
  const rightDue = parseIsoDate(right.dueDate);

  if (!leftDue && !rightDue) {
    return 0;
  }

  if (!leftDue) {
    return 1;
  }

  if (!rightDue) {
    return -1;
  }

  const diff = leftDue.getTime() - rightDue.getTime();
  return direction === "asc" ? diff : -diff;
}

function compareAssignedDates(
  left: AssignmentListItem,
  right: AssignmentListItem,
  direction: "asc" | "desc",
) {
  const leftDate = new Date(left.assignedDate).getTime();
  const rightDate = new Date(right.assignedDate).getTime();
  const diff = leftDate - rightDate;
  return direction === "asc" ? diff : -diff;
}

function compareTitles(
  left: AssignmentListItem,
  right: AssignmentListItem,
  direction: "asc" | "desc",
) {
  const diff = left.title.localeCompare(right.title, undefined, {
    sensitivity: "base",
  });
  return direction === "asc" ? diff : -diff;
}

function sortAssignments(
  assignments: AssignmentListItem[],
  sort: AssignmentSortOption,
) {
  const sorted = [...assignments];

  sorted.sort((left, right) => {
    switch (sort) {
      case "due-date-asc":
        return compareDueDates(left, right, "asc");
      case "due-date-desc":
        return compareDueDates(left, right, "desc");
      case "assigned-date-desc":
        return compareAssignedDates(left, right, "desc");
      case "assigned-date-asc":
        return compareAssignedDates(left, right, "asc");
      case "title-asc":
        return compareTitles(left, right, "asc");
      case "title-desc":
        return compareTitles(left, right, "desc");
      default:
        return 0;
    }
  });

  return sorted;
}

export function filterAndSortAssignments(
  assignments: AssignmentListItem[],
  searchQuery: string,
  filters: AssignmentFilters,
) {
  const query = searchQuery.trim().toLowerCase();

  const filtered = assignments.filter((assignment) => {
    const matchesSearch =
      !query || assignment.title.toLowerCase().includes(query);

    return matchesSearch && matchesFilter(assignment, filters.filter);
  });

  return sortAssignments(filtered, filters.sort);
}

export function hasActiveFilters(filters: AssignmentFilters) {
  return (
    filters.filter !== DEFAULT_ASSIGNMENT_FILTERS.filter ||
    filters.sort !== DEFAULT_ASSIGNMENT_FILTERS.sort
  );
}
