"use client";

import { useAuth } from "@clerk/nextjs";
import {
  BookOpen,
  ClipboardList,
  FileText,
  Layers,
  Loader2,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { deleteLibraryItem, fetchLibraryItems } from "@/lib/library/api";
import type { LibraryListItem } from "@/lib/library/types";
import { formatDisplayDate } from "@/lib/assignments/format-date";
import { TOOLKIT_TOOL_LABELS } from "@/lib/toolkit/result-title";
import type { ToolkitToolId } from "@/lib/toolkit/types";
import { useToastStore } from "@/stores/toast-store";

const TOOL_ICONS: Record<
  ToolkitToolId,
  typeof BookOpen
> = {
  "lesson-plan": ClipboardList,
  worksheet: FileText,
  "differentiated-papers": Layers,
  "chapter-summary": BookOpen,
};

const TOOL_ACCENTS: Record<ToolkitToolId, string> = {
  "lesson-plan": "bg-[#eff6ff] text-[#2563eb]",
  worksheet: "bg-[#f0fdf4] text-[#16a34a]",
  "differentiated-papers": "bg-[#fff7ed] text-[#ea580c]",
  "chapter-summary": "bg-[#faf5ff] text-[#9333ea]",
};

export function LibraryPage() {
  const { getToken } = useAuth();
  const showToast = useToastStore((s) => s.show);
  const [items, setItems] = useState<LibraryListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadLibrary = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const data = await fetchLibraryItems(token);
      setItems(data.items);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load library",
      );
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    void loadLibrary();
  }, [loadLibrary]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return items;
    }

    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        TOOLKIT_TOOL_LABELS[item.tool].toLowerCase().includes(query),
    );
  }, [items, searchQuery]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);

    try {
      const token = await getToken();
      await deleteLibraryItem(id, token);
      setItems((current) => current.filter((item) => item.id !== id));
      showToast("Removed from library");
    } catch (deleteError) {
      showToast(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete item",
        "error",
      );
    } finally {
      setDeletingId(null);
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
          onClick={() => void loadLibrary()}
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
            Saved lesson plans, worksheets, differentiated papers, and chapter
            summaries from AI Teacher&apos;s Toolkit.
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

        {filteredItems.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f3f4f6]">
              <BookOpen className="h-8 w-8 text-[#9ca3af]" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-[#1a1a1a]">
              No saved toolkit items yet
            </h2>
            <p className="mt-2 max-w-sm text-sm text-[#6b7280]">
              Generate a lesson plan, worksheet, differentiated paper, or
              chapter summary and save it to your library.
            </p>
            <Link
              href="/toolkit"
              className="mt-6 rounded-full bg-[#1a1a1a] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Open AI Toolkit
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
            {filteredItems.map((item) => (
              <LibraryCard
                key={item.id}
                item={item}
                isDeleting={deletingId === item.id}
                onDelete={() => void handleDelete(item.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LibraryCard({
  item,
  isDeleting,
  onDelete,
}: {
  item: LibraryListItem;
  isDeleting: boolean;
  onDelete: () => void;
}) {
  const Icon = TOOL_ICONS[item.tool];

  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm transition-colors hover:border-[#d1d5db]">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${TOOL_ACCENTS[item.tool]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <Link href={`/library/${item.id}`} className="block">
            <h3 className="text-base font-bold text-[#1a1a1a] sm:text-lg">
              {item.title}
            </h3>
            <p className="mt-1 text-xs text-[#6b7280]">
              {TOOLKIT_TOOL_LABELS[item.tool]}
            </p>
          </Link>
        </div>
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#6b7280] transition-colors hover:bg-[#fef2f2] hover:text-[#ef4444] disabled:opacity-50"
          aria-label="Delete from library"
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className="mt-6 text-xs text-[#6b7280] sm:text-sm">
        Saved :{" "}
        <span className="font-medium text-[#374151]">
          {formatDisplayDate(item.createdAt)}
        </span>
      </div>
    </div>
  );
}
