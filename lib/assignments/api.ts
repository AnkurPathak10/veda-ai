import { API_BASE_URL } from "@/lib/create-assignment/constants";
import type {
  AssignmentResponse,
  CreateAssignmentPayload,
  CreateAssignmentResponse,
  ListAssignmentsResponse,
} from "./types";

type ApiError = {
  error?: string;
};

async function parseJson<T>(response: Response): Promise<T & ApiError> {
  return (await response.json()) as T & ApiError;
}

export async function fetchAssignments(
  token: string | null,
): Promise<ListAssignmentsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/assignments`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  const data = await parseJson<ListAssignmentsResponse>(response);

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to load assignments");
  }

  return data;
}

export async function fetchAssignment(
  id: string,
  token: string | null,
): Promise<AssignmentResponse> {
  const response = await fetch(`${API_BASE_URL}/api/assignments/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  const data = await parseJson<AssignmentResponse>(response);

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to load assignment");
  }

  return data;
}

export async function createAssignment(
  payload: CreateAssignmentPayload,
  token: string | null,
): Promise<CreateAssignmentResponse> {
  const response = await fetch(`${API_BASE_URL}/api/assignments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = await parseJson<CreateAssignmentResponse>(response);

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to save assignment");
  }

  return data;
}

export async function deleteAssignment(
  id: string,
  token: string | null,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/assignments/${id}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  const data = await parseJson<{ success?: boolean }>(response);

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to delete assignment");
  }
}
