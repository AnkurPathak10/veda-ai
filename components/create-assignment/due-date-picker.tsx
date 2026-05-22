"use client";

import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import {
  formatDueDateDisplay,
  getStartOfToday,
  parseIsoDate,
  toIsoDate,
} from "@/lib/create-assignment/date";

type DueDatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  id?: string;
};

export function DueDatePicker({
  value,
  onChange,
  error,
  id = "due-date",
}: DueDatePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedDate = value ? parseIsoDate(value) : undefined;
  const today = getStartOfToday();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;
    onChange(toIsoDate(date));
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        id={id}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`flex w-full items-center justify-between rounded-xl border bg-white px-4 py-3 text-left text-sm transition-colors focus:border-[#1a1a1a] focus:outline-none ${
          error ? "border-[#ef4444]" : "border-[#e5e7eb]"
        }`}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span className={value ? "text-[#1a1a1a]" : "text-[#9ca3af]"}>
          {value ? formatDueDateDisplay(value) : "DD-MM-YYYY"}
        </span>
        <Calendar className="h-5 w-5 text-[#9ca3af]" />
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-2 w-[min(100%,320px)] rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-xl">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            disabled={{ before: today }}
            defaultMonth={selectedDate ?? today}
            showOutsideDays
            components={{
              Chevron: ({ orientation }) =>
                orientation === "left" ? (
                  <ChevronLeft className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                ),
            }}
            classNames={{
              root: "w-full",
              months: "flex flex-col",
              month: "space-y-3",
              month_caption:
                "flex items-center justify-center px-8 text-sm font-semibold text-[#1a1a1a]",
              nav: "flex items-center justify-between",
              button_previous:
                "absolute left-4 flex h-8 w-8 items-center justify-center rounded-lg text-[#6b7280] transition-colors hover:bg-[#f3f4f6]",
              button_next:
                "absolute right-4 flex h-8 w-8 items-center justify-center rounded-lg text-[#6b7280] transition-colors hover:bg-[#f3f4f6]",
              weekdays: "grid grid-cols-7 gap-1",
              weekday:
                "py-1 text-center text-xs font-medium uppercase tracking-wide text-[#9ca3af]",
              week: "mt-1 grid grid-cols-7 gap-1",
              day: "flex h-9 w-9 items-center justify-center p-0 text-sm",
              day_button:
                "h-9 w-9 rounded-lg text-[#1a1a1a] transition-colors hover:bg-[#f3f4f6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a1a1a]/20 disabled:cursor-not-allowed disabled:text-[#d1d5db] disabled:hover:bg-transparent",
              selected:
                "!bg-[#1a1a1a] !text-white hover:!bg-[#2d2d2d] focus:!bg-[#1a1a1a]",
              today: "font-semibold text-[#1a1a1a] ring-1 ring-[#1a1a1a]/20",
              outside: "text-[#d1d5db]",
              disabled: "text-[#d1d5db] hover:bg-transparent",
            }}
          />
        </div>
      )}

      {error && <p className="mt-1.5 text-sm text-[#ef4444]">{error}</p>}
    </div>
  );
}
