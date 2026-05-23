"use client";

import { useAuth } from "@clerk/nextjs";
import { Loader2, Plus, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createGroup, fetchGroups } from "@/lib/groups/api";
import type { GroupListItem } from "@/lib/groups/types";
import { useToastStore } from "@/stores/toast-store";

export function GroupsPage() {
  const { getToken } = useAuth();
  const showToast = useToastStore((s) => s.show);
  const [groups, setGroups] = useState<GroupListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const loadGroups = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const data = await fetchGroups(token);
      setGroups(data.groups);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load groups",
      );
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  const handleCreate = async () => {
    if (!name.trim()) {
      showToast("Group name is required", "error");
      return;
    }

    setIsCreating(true);

    try {
      const token = await getToken();
      const group = await createGroup(
        {
          name: name.trim(),
          description: description.trim() || undefined,
        },
        token,
      );
      setGroups((current) => [group, ...current]);
      setName("");
      setDescription("");
      setShowCreateForm(false);
      showToast("Group created successfully");
    } catch (createError) {
      showToast(
        createError instanceof Error
          ? createError.message
          : "Failed to create group",
        "error",
      );
    } finally {
      setIsCreating(false);
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
          onClick={() => void loadGroups()}
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
              <h1 className="text-2xl font-bold tracking-tight text-[#1a1a1a]">
                My Groups
              </h1>
            </div>
            <p className="mt-1 text-sm text-[#6b7280]">
              Create groups with other teachers and share assignments.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateForm((current) => !current)}
            className="inline-flex items-center gap-2 rounded-full bg-[#1a1a1a] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2d2d2d]"
          >
            <Plus className="h-4 w-4" />
            Create Group
          </button>
        </div>

        {showCreateForm && (
          <div className="mt-6 max-w-xl rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-[#1a1a1a]">
              New Group
            </h2>
            <div className="mt-4 space-y-3">
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Group name"
                className="w-full rounded-xl border border-[#e5e7eb] px-4 py-2.5 text-sm outline-none focus:border-[#1a1a1a]"
              />
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Description (optional)"
                rows={3}
                className="w-full resize-none rounded-xl border border-[#e5e7eb] px-4 py-2.5 text-sm outline-none focus:border-[#1a1a1a]"
              />
              <button
                type="button"
                onClick={() => void handleCreate()}
                disabled={isCreating}
                className="rounded-full bg-[#1a1a1a] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isCreating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        )}

        {groups.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f3f4f6]">
              <Users className="h-8 w-8 text-[#9ca3af]" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-[#1a1a1a]">
              No groups yet
            </h2>
            <p className="mt-2 max-w-sm text-sm text-[#6b7280]">
              Create a group and invite teachers by email to collaborate and
              share assignments.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {groups.map((group) => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm transition-colors hover:border-[#d1d5db]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-[#1a1a1a]">
                      {group.name}
                    </h3>
                    {group.description && (
                      <p className="mt-1 text-sm text-[#6b7280]">
                        {group.description}
                      </p>
                    )}
                  </div>
                  <span className="rounded-full bg-[#f3f4f6] px-2.5 py-1 text-xs font-medium text-[#4b5563]">
                    {group.role === "OWNER" ? "Owner" : "Member"}
                  </span>
                </div>
                <div className="mt-6 flex gap-4 text-xs text-[#6b7280] sm:text-sm">
                  <span>{group.memberCount} members</span>
                  <span>{group.sharedAssignmentCount} shared assignments</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
