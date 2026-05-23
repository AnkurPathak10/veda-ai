import { API_BASE_URL } from "@/lib/create-assignment/constants";
import type {
  AddGroupMemberPayload,
  CreateGroupPayload,
  GroupDetail,
  GroupListItem,
  GroupMember,
  ListGroupsResponse,
  ShareAssignmentPayload,
} from "./types";

type ApiError = {
  error?: string;
};

async function parseJson<T>(response: Response): Promise<T & ApiError> {
  return (await response.json()) as T & ApiError;
}

export async function fetchGroups(
  token: string | null,
): Promise<ListGroupsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/groups`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  const data = await parseJson<ListGroupsResponse>(response);

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to load groups");
  }

  return data;
}

export async function fetchGroup(
  id: string,
  token: string | null,
): Promise<GroupDetail> {
  const response = await fetch(`${API_BASE_URL}/api/groups/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  const data = await parseJson<{ group: GroupDetail }>(response);

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to load group");
  }

  return data.group;
}

export async function createGroup(
  payload: CreateGroupPayload,
  token: string | null,
): Promise<GroupListItem> {
  const response = await fetch(`${API_BASE_URL}/api/groups`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = await parseJson<{ group: GroupListItem }>(response);

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to create group");
  }

  return data.group;
}

export async function addGroupMember(
  groupId: string,
  payload: AddGroupMemberPayload,
  token: string | null,
): Promise<GroupMember> {
  const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}/members`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = await parseJson<{ member: GroupMember }>(response);

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to add group member");
  }

  return data.member;
}

export async function shareAssignmentToGroup(
  groupId: string,
  payload: ShareAssignmentPayload,
  token: string | null,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}/share`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = await parseJson<{ sharedAssignment?: unknown }>(response);

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to share assignment");
  }
}

export async function leaveGroup(
  groupId: string,
  token: string | null,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}/leave`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  const data = await parseJson<{ success?: boolean }>(response);

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to leave group");
  }
}

export async function removeGroupMember(
  groupId: string,
  memberId: string,
  token: string | null,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/groups/${groupId}/members/${memberId}`,
    {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );

  const data = await parseJson<{ success?: boolean }>(response);

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to remove group member");
  }
}
