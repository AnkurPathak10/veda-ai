"use client";

import { ArrowLeft, Bookmark, Copy, Loader2, RotateCcw } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useToastStore } from "@/stores/toast-store";

type ToolkitToolShellProps = {
  title: string;
  description: string;
  backHref?: string;
  children: ReactNode;
};

export function ToolkitToolShell({
  title,
  description,
  backHref = "/toolkit",
  children,
}: ToolkitToolShellProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#6b7280] transition-colors hover:text-[#1a1a1a]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Toolkit
        </Link>

        <div className="mt-4">
          <h1 className="text-2xl font-bold tracking-tight text-[#1a1a1a]">
            {title}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[#6b7280]">{description}</p>
        </div>

        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}

type ToolkitResultActionsProps = {
  onCopy: () => string;
  onStartOver: () => void;
  onSave?: () => void;
  isSaving?: boolean;
  isSaved?: boolean;
};

export function ToolkitResultActions({
  onCopy,
  onStartOver,
  onSave,
  isSaving = false,
  isSaved = false,
}: ToolkitResultActionsProps) {
  const showToast = useToastStore((s) => s.show);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(onCopy());
      showToast("Copied to clipboard");
    } catch {
      showToast("Failed to copy to clipboard", "error");
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      {onSave ? (
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving || isSaved}
          className="inline-flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-5 py-2.5 text-sm font-semibold text-[#374151] transition-colors hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Bookmark className="h-4 w-4" />
          )}
          {isSaved ? "Saved to Library" : "Save to Library"}
        </button>
      ) : null}
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
        onClick={onStartOver}
        className="inline-flex items-center gap-2 rounded-full bg-[#1a1a1a] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2d2d2d]"
      >
        <RotateCcw className="h-4 w-4" />
        Generate again
      </button>
    </div>
  );
}

export function ToolkitIntroBanner({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3 text-sm text-[#374151]">
      {message}
    </div>
  );
}

export function ToolkitResultCard({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm sm:p-6">
      {title ? (
        <h2 className="text-lg font-bold text-[#1a1a1a]">{title}</h2>
      ) : null}
      <div className={title ? "mt-4 space-y-4" : "space-y-4"}>{children}</div>
    </div>
  );
}

export function ToolkitFieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-2 block text-sm font-semibold text-[#1a1a1a]">
      {children}
    </label>
  );
}

export function ToolkitTextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-2xl border border-[#e5e7eb] bg-white px-4 py-3 text-sm text-[#1a1a1a] outline-none transition-colors placeholder:text-[#9ca3af] focus:border-[#1a1a1a]"
    />
  );
}

export function ToolkitSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-2xl border border-[#e5e7eb] bg-white px-4 py-3 text-sm text-[#1a1a1a] outline-none transition-colors focus:border-[#1a1a1a]"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function ToolkitNumberInput({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}) {
  return (
    <input
      type="number"
      min={min}
      max={max}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="w-full rounded-2xl border border-[#e5e7eb] bg-white px-4 py-3 text-sm text-[#1a1a1a] outline-none transition-colors focus:border-[#1a1a1a]"
    />
  );
}

export function ToolkitGenerateButton({
  onClick,
  disabled,
  label = "Generate with AI",
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center rounded-full bg-[#1a1a1a] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2d2d2d] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {label}
    </button>
  );
}
