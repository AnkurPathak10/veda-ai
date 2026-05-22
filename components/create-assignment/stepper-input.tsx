"use client";

import { Minus, Plus } from "lucide-react";

type StepperInputProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
  error?: string;
};

export function StepperInput({
  value,
  onChange,
  min = 1,
  max = 99,
  label,
  error,
}: StepperInputProps) {
  const decrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const increment = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <span className="text-xs font-medium text-[#6b7280] lg:hidden">
          {label}
        </span>
      )}
      <div
        className={`flex items-center justify-between rounded-xl border bg-white px-2 py-1.5 ${
          error ? "border-[#ef4444]" : "border-[#e5e7eb]"
        }`}
      >
        <button
          type="button"
          onClick={decrement}
          disabled={value <= min}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6b7280] transition-colors hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={`Decrease ${label ?? "value"}`}
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="min-w-[2rem] text-center text-sm font-semibold text-[#1a1a1a]">
          {value}
        </span>
        <button
          type="button"
          onClick={increment}
          disabled={value >= max}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6b7280] transition-colors hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={`Increase ${label ?? "value"}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      {error && <p className="text-xs text-[#ef4444]">{error}</p>}
    </div>
  );
}
