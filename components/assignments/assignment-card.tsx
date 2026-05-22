"use client";

import { MoreVertical } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatDisplayDate } from "@/lib/assignments/format-date";
import type { AssignmentListItem } from "@/lib/assignments/types";

type AssignmentCardProps = {
  assignment: AssignmentListItem;
  onDelete: (assignment: AssignmentListItem) => void;
};

export function AssignmentCard({ assignment, onDelete }: AssignmentCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <article className="relative rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-bold text-[#1a1a1a] sm:text-lg">
          {assignment.title}
        </h3>

        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#1a1a1a]"
            aria-label="Assignment options"
            aria-expanded={menuOpen}
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white py-1 shadow-lg">
              <Link
                href={`/assignments/${assignment.id}`}
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 text-sm font-medium text-[#1a1a1a] transition-colors hover:bg-[#f9fafb]"
              >
                View Assignment
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(assignment);
                }}
                className="block w-full px-4 py-2.5 text-left text-sm font-medium text-[#ef4444] transition-colors hover:bg-[#fef2f2]"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

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
    </article>
  );
}
