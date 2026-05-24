"use client";

import { useAuth } from "@clerk/nextjs";
import { ArrowLeft, Copy, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  deleteLibraryItem,
  fetchLibraryItem,
} from "@/lib/library/api";
import type { SavedLibraryItem } from "@/lib/library/types";
import {
  formatChapterSummaryText,
  formatDifferentiatedPapersText,
  formatLessonPlanText,
  formatWorksheetText,
} from "@/lib/toolkit/format-result";
import { TOOLKIT_TOOL_LABELS } from "@/lib/toolkit/result-title";
import type { ToolkitToolId } from "@/lib/toolkit/types";
import {
  getToolkitIntroMessage,
  ToolkitResultPreview,
} from "@/components/toolkit/toolkit-result-preview";
import { ToolkitIntroBanner } from "@/components/toolkit/toolkit-tool-shell";
import { useToastStore } from "@/stores/toast-store";

function getCopyText(tool: ToolkitToolId, content: SavedLibraryItem["content"]) {
  switch (tool) {
    case "lesson-plan":
      return formatLessonPlanText(content as never);
    case "worksheet":
      return formatWorksheetText(content as never);
    case "differentiated-papers":
      return formatDifferentiatedPapersText(content as never);
    case "chapter-summary":
      return formatChapterSummaryText(content as never);
  }
}

export function LibraryItemDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { getToken } = useAuth();
  const showToast = useToastStore((s) => s.show);
  const [item, setItem] = useState<SavedLibraryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadItem = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const data = await fetchLibraryItem(params.id, token);
      setItem(data.item);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load library item",
      );
    } finally {
      setIsLoading(false);
    }
  }, [getToken, params.id]);

  useEffect(() => {
    void loadItem();
  }, [loadItem]);

  const handleCopy = async () => {
    if (!item) {
      return;
    }

    try {
      await navigator.clipboard.writeText(getCopyText(item.tool, item.content));
      showToast("Copied to clipboard");
    } catch {
      showToast("Failed to copy to clipboard", "error");
    }
  };

  const handleDelete = async () => {
    if (!item || isDeleting) {
      return;
    }

    setIsDeleting(true);

    try {
      const token = await getToken();
      await deleteLibraryItem(item.id, token);
      showToast("Removed from library");
      router.push("/library");
    } catch (deleteError) {
      showToast(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete item",
        "error",
      );
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

  if (error || !item) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
        <p className="text-sm text-[#ef4444]">
          {error ?? "Library item not found"}
        </p>
        <Link
          href="/library"
          className="mt-4 rounded-full bg-[#1a1a1a] px-5 py-2.5 text-sm font-semibold text-white"
        >
          Back to Library
        </Link>
      </div>
    );
  }

  const introMessage = getToolkitIntroMessage(item.content);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <Link
          href="/library"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#6b7280] transition-colors hover:text-[#1a1a1a]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Library
        </Link>

        <div className="mt-4">
          <p className="text-sm font-medium text-[#6b7280]">
            {TOOLKIT_TOOL_LABELS[item.tool]}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#1a1a1a]">
            {item.title}
          </h1>
        </div>

        <div className="mt-8 space-y-6">
          {introMessage ? (
            <ToolkitIntroBanner message={introMessage} />
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="inline-flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-5 py-2.5 text-sm font-semibold text-[#374151] transition-colors hover:bg-[#f9fafb]"
            >
              <Copy className="h-4 w-4" />
              Copy as text
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={isDeleting}
              className="inline-flex items-center gap-2 rounded-full border border-[#fecaca] bg-[#fef2f2] px-5 py-2.5 text-sm font-semibold text-[#b91c1c] transition-colors hover:bg-[#fee2e2] disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete from Library
            </button>
          </div>

          <ToolkitResultPreview tool={item.tool} result={item.content} />
        </div>
      </div>
    </div>
  );
}
