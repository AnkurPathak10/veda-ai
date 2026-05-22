"use client";

import { CheckCircle2, X, XCircle } from "lucide-react";
import { useEffect } from "react";
import { useToastStore } from "@/stores/toast-store";

export function ToastProvider() {
  const message = useToastStore((s) => s.message);
  const variant = useToastStore((s) => s.variant);
  const dismiss = useToastStore((s) => s.dismiss);

  useEffect(() => {
    if (!message) {
      return;
    }

    const timer = window.setTimeout(() => {
      dismiss();
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [message, dismiss]);

  if (!message) {
    return null;
  }

  const isSuccess = variant === "success";

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-4">
      <div
        role="status"
        className={`pointer-events-auto flex max-w-md items-start gap-3 rounded-2xl px-4 py-3 shadow-lg ring-1 ${
          isSuccess
            ? "bg-[#1a1a1a] text-white ring-black/10"
            : "bg-[#fef2f2] text-[#991b1b] ring-[#fecaca]"
        }`}
      >
        {isSuccess ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#4ade80]" />
        ) : (
          <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
        )}
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button
          type="button"
          onClick={dismiss}
          className={`rounded-lg p-1 transition-colors ${
            isSuccess ? "hover:bg-white/10" : "hover:bg-[#fee2e2]"
          }`}
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
