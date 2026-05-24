"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import { saveLibraryItem } from "@/lib/library/api";
import { getToolkitResultTitle } from "@/lib/toolkit/result-title";
import type { ToolkitResult, ToolkitToolId } from "@/lib/toolkit/types";
import { useToastStore } from "@/stores/toast-store";

export function useSaveToLibrary(tool: ToolkitToolId, result: ToolkitResult | null) {
  const { getToken } = useAuth();
  const showToast = useToastStore((s) => s.show);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setIsSaved(false);
  }, [result]);

  const handleSave = useCallback(async () => {
    if (!result || isSaving || isSaved) {
      return;
    }

    setIsSaving(true);

    try {
      const token = await getToken();
      await saveLibraryItem(
        {
          tool,
          title: getToolkitResultTitle(tool, result),
          content: result,
        },
        token,
      );
      setIsSaved(true);
      showToast("Saved to My Library");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to save to library",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  }, [getToken, isSaved, isSaving, result, showToast, tool]);

  return {
    handleSave,
    isSaving,
    isSaved,
  };
}
