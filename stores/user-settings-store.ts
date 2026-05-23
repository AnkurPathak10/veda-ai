"use client";

import { create } from "zustand";
import type { UserSettings } from "@/lib/users/types";

type UserSettingsState = {
  settings: UserSettings | null;
  isLoading: boolean;
  error: string | null;
  setSettings: (settings: UserSettings) => void;
  patchSettings: (patch: Partial<UserSettings>) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
};

export const useUserSettingsStore = create<UserSettingsState>((set) => ({
  settings: null,
  isLoading: false,
  error: null,
  setSettings: (settings) => set({ settings, error: null }),
  patchSettings: (patch) =>
    set((state) => ({
      settings: state.settings
        ? { ...state.settings, ...patch }
        : {
            id: "",
            email: null,
            firstName: null,
            lastName: null,
            imageUrl: null,
            schoolName: null,
            schoolLocation: null,
            ...patch,
          },
      error: null,
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
}));
