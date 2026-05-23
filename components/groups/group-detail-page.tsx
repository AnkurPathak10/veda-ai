"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import {
  ArrowLeft,
  Loader2,
  Share2,
  UserPlus,
  UserX,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatDisplayDate } from "@/lib/assignments/format-date";
import { fetchAssignments } from "@/lib/assignments/api";
import type { AssignmentListItem } from "@/lib/assignments/types";
import {
  addGroupMember,
  fetchGroup,
  leaveGroup,
  removeGroupMember,
  shareAssignmentToGroup,
} from "@/lib/groups/api";
import type { GroupDetail, GroupMember } from "@/lib/groups/types";
import { useToastStore } from "@/stores/toast-store";
import { useRouter } from "next/navigation";

type GroupDetailPageProps = {
  groupId: string;
};

function MemberAvatar({ member }: { member: GroupMember }) {
  const displayName =
    [member.user.firstName, member.user.lastName].filter(Boolean).join(" ") ||
    member.user.email ||
    "Member";
  const initial = displayName.charAt(0).toUpperCase();

  if (member.user.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={member.user.imageUrl}
        alt={displayName}
        className="h-10 w-10 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e5e7eb] text-sm font-semibold text-[#4b5563]">
      {initial}
    </div>
  );
}

export function GroupDetailPage({ groupId }: GroupDetailPageProps) {
  const router = useRouter();
  const { user } = useUser();
  const { getToken } = useAuth();
  const showToast = useToastStore((s) => s.show);

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [assignments, setAssignments] = useState<AssignmentListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memberEmail, setMemberEmail] = useState("");
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const currentUserEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();

  const loadGroup = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const [groupData, assignmentsData] = await Promise.all([
        fetchGroup(groupId, token),
        fetchAssignments(token),
      ]);
      setGroup(groupData);
      setAssignments(assignmentsData.assignments);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load group",
      );
    } finally {
      setIsLoading(false);
    }
  }, [getToken, groupId]);

  useEffect(() => {
    void loadGroup();
  }, [loadGroup]);

  const handleAddMember = async () => {
    if (!memberEmail.trim()) {
      showToast("Email is required", "error");
      return;
    }

    setIsAddingMember(true);

    try {
      const token = await getToken();
      await addGroupMember(groupId, { email: memberEmail.trim() }, token);
      setMemberEmail("");
      showToast("Member added successfully");
      await loadGroup();
    } catch (addError) {
      showToast(
        addError instanceof Error ? addError.message : "Failed to add member",
        "error",
      );
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleShare = async () => {
    if (!selectedAssignmentId) {
      showToast("Select an assignment to share", "error");
      return;
    }

    setIsSharing(true);

    try {
      const token = await getToken();
      await shareAssignmentToGroup(
        groupId,
        { assignmentId: selectedAssignmentId },
        token,
      );
      setSelectedAssignmentId("");
      showToast("Assignment shared successfully");
      await loadGroup();
    } catch (shareError) {
      showToast(
        shareError instanceof Error
          ? shareError.message
          : "Failed to share assignment",
        "error",
      );
    } finally {
      setIsSharing(false);
    }
  };

  const handleLeave = async () => {
    setIsLeaving(true);

    try {
      const token = await getToken();
      await leaveGroup(groupId, token);
      showToast("Left group successfully");
      router.push("/groups");
    } catch (leaveError) {
      showToast(
        leaveError instanceof Error ? leaveError.message : "Failed to leave group",
        "error",
      );
    } finally {
      setIsLeaving(false);
    }
  };

  const handleRemoveMember = async (member: GroupMember) => {
    setRemovingMemberId(member.id);

    try {
      const token = await getToken();
      await removeGroupMember(groupId, member.id, token);
      showToast("Member removed successfully");
      await loadGroup();
    } catch (removeError) {
      showToast(
        removeError instanceof Error
          ? removeError.message
          : "Failed to remove member",
        "error",
      );
    } finally {
      setRemovingMemberId(null);
    }
  };

  const canRemoveMember = (member: GroupMember) => {
    if (group?.role !== "OWNER") {
      return false;
    }

    const memberEmail = member.user.email?.toLowerCase();
    if (currentUserEmail && memberEmail === currentUserEmail) {
      return false;
    }

    return true;
  };

  const sharedAssignmentIds = new Set(
    group?.sharedAssignments.map((item) => item.assignment.id) ?? [],
  );

  const shareableAssignments = assignments.filter(
    (assignment) => !sharedAssignmentIds.has(assignment.id),
  );

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#6b7280]" />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
        <p className="text-sm text-[#ef4444]">{error ?? "Group not found"}</p>
        <Link
          href="/groups"
          className="mt-4 rounded-full bg-[#1a1a1a] px-5 py-2.5 text-sm font-semibold text-white"
        >
          Back to groups
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <Link
          href="/groups"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#6b7280] hover:text-[#1a1a1a]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to groups
        </Link>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1a1a1a]">{group.name}</h1>
            {group.description && (
              <p className="mt-1 text-sm text-[#6b7280]">{group.description}</p>
            )}
            <p className="mt-2 text-xs text-[#9ca3af]">
              {group.members.length} members · {group.role}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void handleLeave()}
            disabled={isLeaving}
            className="rounded-full border border-[#fecaca] px-4 py-2 text-sm font-medium text-[#ef4444] hover:bg-[#fef2f2] disabled:opacity-60"
          >
            {isLeaving ? "Leaving..." : "Leave group"}
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#4b5563]" />
              <h2 className="text-base font-semibold text-[#1a1a1a]">Members</h2>
            </div>

            <ul className="mt-4 space-y-3">
              {group.members.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-[#f9fafb] px-3 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <MemberAvatar member={member} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#1a1a1a]">
                        {[member.user.firstName, member.user.lastName]
                          .filter(Boolean)
                          .join(" ") || member.user.email}
                      </p>
                      <p className="truncate text-xs text-[#6b7280]">
                        {member.user.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs font-medium text-[#6b7280]">
                      {member.role}
                    </span>
                    {canRemoveMember(member) && (
                      <button
                        type="button"
                        onClick={() => void handleRemoveMember(member)}
                        disabled={removingMemberId === member.id}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6b7280] transition-colors hover:bg-[#fee2e2] hover:text-[#ef4444] disabled:opacity-60"
                        aria-label={`Remove ${member.user.email ?? "member"}`}
                        title="Remove member"
                      >
                        {removingMemberId === member.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserX className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {group.role === "OWNER" && (
              <div className="mt-4 flex gap-2">
                <input
                  type="email"
                  value={memberEmail}
                  onChange={(event) => setMemberEmail(event.target.value)}
                  placeholder="Teacher email"
                  className="min-w-0 flex-1 rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm outline-none focus:border-[#1a1a1a]"
                />
                <button
                  type="button"
                  onClick={() => void handleAddMember()}
                  disabled={isAddingMember}
                  className="inline-flex items-center gap-1 rounded-xl bg-[#1a1a1a] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  <UserPlus className="h-4 w-4" />
                  Add
                </button>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-[#4b5563]" />
              <h2 className="text-base font-semibold text-[#1a1a1a]">
                Share Assignment
              </h2>
            </div>

            <div className="mt-4 flex gap-2">
              <select
                value={selectedAssignmentId}
                onChange={(event) => setSelectedAssignmentId(event.target.value)}
                className="min-w-0 flex-1 rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm outline-none focus:border-[#1a1a1a]"
              >
                <option value="">Select assignment</option>
                {shareableAssignments.map((assignment) => (
                  <option key={assignment.id} value={assignment.id}>
                    {assignment.title}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void handleShare()}
                disabled={isSharing || !selectedAssignmentId}
                className="rounded-xl bg-[#1a1a1a] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Share
              </button>
            </div>
          </section>
        </div>

        <section className="mt-8">
          <h2 className="text-lg font-bold text-[#1a1a1a]">Shared Assignments</h2>

          {group.sharedAssignments.length === 0 ? (
            <p className="mt-4 text-sm text-[#6b7280]">
              No assignments shared in this group yet.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {group.sharedAssignments.map((shared) => (
                <Link
                  key={shared.id}
                  href={`/assignments/${shared.assignment.id}`}
                  className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm transition-colors hover:border-[#d1d5db]"
                >
                  <h3 className="text-base font-bold text-[#1a1a1a]">
                    {shared.assignment.title}
                  </h3>
                  <p className="mt-2 text-xs text-[#6b7280]">
                    Shared by{" "}
                    {[shared.sharedBy.firstName, shared.sharedBy.lastName]
                      .filter(Boolean)
                      .join(" ") || "a member"}{" "}
                    · {formatDisplayDate(shared.sharedAt)}
                  </p>
                  <p className="mt-3 text-xs text-[#6b7280]">
                    Due {formatDisplayDate(shared.assignment.dueDate)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
