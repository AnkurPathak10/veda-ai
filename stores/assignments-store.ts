"use client";

import { create } from "zustand";
import type { AssignmentListItem } from "@/lib/assignments/types";

type AssignmentsState = {
  assignments: AssignmentListItem[];
  total: number;
  isLoading: boolean;
  error: string | null;
  setAssignments: (assignments: AssignmentListItem[], total: number) => void;
  setLoading: (value: boolean) => void;
  setError: (error: string | null) => void;
  removeAssignment: (id: string) => void;
};

export const useAssignmentsStore = create<AssignmentsState>((set) => ({
  assignments: [],
  total: 0,
  isLoading: true,
  error: null,
  setAssignments: (assignments, total) =>
    set({ assignments, total, error: null }),
  setLoading: (value) => set({ isLoading: value }),
  setError: (error) => set({ error }),
  removeAssignment: (id) =>
    set((state) => ({
      assignments: state.assignments.filter((item) => item.id !== id),
      total: Math.max(0, state.total - 1),
    })),
}));
