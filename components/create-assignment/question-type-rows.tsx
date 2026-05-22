"use client";

import { ChevronDown, Plus, X } from "lucide-react";
import { QUESTION_TYPE_OPTIONS } from "@/lib/create-assignment/constants";
import type { QuestionTypeRow } from "@/lib/create-assignment/types";
import { StepperInput } from "./stepper-input";

type QuestionTypeRowDesktopProps = {
  row: QuestionTypeRow;
  canRemove: boolean;
  rowErrors?: { type?: string; count?: string; marks?: string };
  onUpdate: (
    id: string,
    patch: Partial<Pick<QuestionTypeRow, "type" | "count" | "marks">>,
  ) => void;
  onRemove: (id: string) => void;
};

export function QuestionTypeRowDesktop({
  row,
  canRemove,
  rowErrors,
  onUpdate,
  onRemove,
}: QuestionTypeRowDesktopProps) {
  return (
    <div className="grid grid-cols-[1fr_140px_140px_40px] items-center gap-4 border-b border-[#f3f4f6] py-4 last:border-b-0">
      <div className="relative">
        <select
          value={row.type}
          onChange={(e) =>
            onUpdate(row.id, {
              type: e.target.value as QuestionTypeRow["type"],
            })
          }
          className={`w-full appearance-none rounded-xl border bg-white px-4 py-2.5 pr-10 text-sm font-medium text-[#1a1a1a] outline-none transition-colors focus:border-[#1a1a1a] ${
            rowErrors?.type ? "border-[#ef4444]" : "border-[#e5e7eb]"
          }`}
        >
          {QUESTION_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
        {rowErrors?.type && (
          <p className="mt-1 text-xs text-[#ef4444]">{rowErrors.type}</p>
        )}
      </div>

      <StepperInput
        value={row.count}
        onChange={(count) => onUpdate(row.id, { count })}
        error={rowErrors?.count}
      />

      <StepperInput
        value={row.marks}
        onChange={(marks) => onUpdate(row.id, { marks })}
        error={rowErrors?.marks}
      />

      <button
        type="button"
        onClick={() => onRemove(row.id)}
        disabled={!canRemove}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-[#9ca3af] transition-colors hover:bg-[#f3f4f6] hover:text-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-30"
        aria-label="Remove question type"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

type QuestionTypeRowMobileProps = QuestionTypeRowDesktopProps;

export function QuestionTypeRowMobile({
  row,
  canRemove,
  rowErrors,
  onUpdate,
  onRemove,
}: QuestionTypeRowMobileProps) {
  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4">
      <div className="flex items-start gap-2">
        <div className="relative min-w-0 flex-1">
          <select
            value={row.type}
            onChange={(e) =>
              onUpdate(row.id, {
                type: e.target.value as QuestionTypeRow["type"],
              })
            }
            className={`w-full appearance-none rounded-xl border bg-[#f9fafb] px-3 py-2.5 pr-9 text-sm font-medium text-[#1a1a1a] outline-none ${
              rowErrors?.type ? "border-[#ef4444]" : "border-[#e5e7eb]"
            }`}
          >
            {QUESTION_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
        </div>
        <button
          type="button"
          onClick={() => onRemove(row.id)}
          disabled={!canRemove}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#9ca3af] disabled:opacity-30"
          aria-label="Remove question type"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <StepperInput
          label="No. of Questions"
          value={row.count}
          onChange={(count) => onUpdate(row.id, { count })}
          error={rowErrors?.count}
        />
        <StepperInput
          label="Marks"
          value={row.marks}
          onChange={(marks) => onUpdate(row.id, { marks })}
          error={rowErrors?.marks}
        />
      </div>
    </div>
  );
}

type AddQuestionTypeButtonProps = {
  onClick: () => void;
};

export function AddQuestionTypeButton({ onClick }: AddQuestionTypeButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#1a1a1a] transition-colors hover:text-[#4b5563]"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1a1a1a] text-white">
        <Plus className="h-4 w-4" />
      </span>
      Add Question Type
    </button>
  );
}
