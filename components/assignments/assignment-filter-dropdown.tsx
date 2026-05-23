"use client";

import { Filter } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  ASSIGNMENT_FILTER_OPTIONS,
  ASSIGNMENT_SORT_OPTIONS,
  DEFAULT_ASSIGNMENT_FILTERS,
  hasActiveFilters,
  type AssignmentFilters,
} from "@/lib/assignments/filter-assignments";

type AssignmentFilterDropdownProps = {
  filters: AssignmentFilters;
  onChange: (filters: AssignmentFilters) => void;
};

export function AssignmentFilterDropdown({
  filters,
  onChange,
}: AssignmentFilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isActive = hasActiveFilters(filters);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleReset = () => {
    onChange(DEFAULT_ASSIGNMENT_FILTERS);
    setOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors lg:px-5 ${
          isActive
            ? "border-[#1a1a1a] bg-[#1a1a1a] text-white"
            : "border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f9fafb]"
        }`}
        aria-expanded={open}
      >
        <Filter className="h-4 w-4" />
        <span className="lg:hidden">Filter</span>
        <span className="hidden lg:inline">Filter By</span>
        {isActive && (
          <span className="rounded-full bg-[#f97316] px-1.5 py-0.5 text-[10px] font-bold text-white">
            On
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 z-30 mt-2 w-[min(100vw-2rem,320px)] overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-xl sm:left-0">
          <div className="flex items-center justify-between border-b border-[#e5e7eb] px-4 py-3">
            <h3 className="text-sm font-semibold text-[#1a1a1a]">
              Filter & Sort
            </h3>
            {isActive && (
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-medium text-[#6b7280] hover:text-[#1a1a1a]"
              >
                Reset
              </button>
            )}
          </div>

          <div className="max-h-[min(70vh,420px)] overflow-y-auto p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
                Sort by
              </p>
              <div className="mt-2 space-y-1">
                {ASSIGNMENT_SORT_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm text-[#374151] hover:bg-[#f9fafb]"
                  >
                    <input
                      type="radio"
                      name="assignment-sort"
                      value={option.value}
                      checked={filters.sort === option.value}
                      onChange={() =>
                        onChange({ ...filters, sort: option.value })
                      }
                      className="h-4 w-4 accent-[#1a1a1a]"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
                Filter by
              </p>
              <div className="mt-2 space-y-1">
                {ASSIGNMENT_FILTER_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm text-[#374151] hover:bg-[#f9fafb]"
                  >
                    <input
                      type="radio"
                      name="assignment-filter"
                      value={option.value}
                      checked={filters.filter === option.value}
                      onChange={() =>
                        onChange({ ...filters, filter: option.value })
                      }
                      className="h-4 w-4 accent-[#1a1a1a]"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
