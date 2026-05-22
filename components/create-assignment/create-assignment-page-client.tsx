"use client";

import { useEffect } from "react";
import { CreateAssignmentForm } from "@/components/create-assignment/create-assignment-form";
import { useCreateAssignmentStore } from "@/stores/create-assignment-store";

export function CreateAssignmentHydration() {
  useEffect(() => {
    void useCreateAssignmentStore.persist.rehydrate();
  }, []);

  return null;
}

export function CreateAssignmentPageClient() {
  const hasHydrated = useCreateAssignmentStore((s) => s._hasHydrated);

  if (!hasHydrated) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#e5e7eb] border-t-[#1a1a1a]" />
      </div>
    );
  }

  return <CreateAssignmentForm />;
}
