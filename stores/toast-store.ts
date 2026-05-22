"use client";

import { create } from "zustand";

type ToastVariant = "success" | "error";

type ToastState = {
  message: string | null;
  variant: ToastVariant;
  show: (message: string, variant?: ToastVariant) => void;
  dismiss: () => void;
};

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  variant: "success",
  show: (message, variant = "success") => set({ message, variant }),
  dismiss: () => set({ message: null }),
}));
