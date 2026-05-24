import { API_BASE_URL } from "@/lib/create-assignment/constants";
import type {
  LibraryItemResponse,
  ListLibraryResponse,
  SaveLibraryItemPayload,
  SaveLibraryItemResponse,
} from "./types";

type ApiError = {
  error?: string;
};

async function parseJson<T>(response: Response): Promise<T & ApiError> {
  return (await response.json()) as T & ApiError;
}

export async function fetchLibraryItems(
  token: string | null,
): Promise<ListLibraryResponse> {
  const response = await fetch(`${API_BASE_URL}/api/library`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  const data = await parseJson<ListLibraryResponse>(response);

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to load library");
  }

  return data;
}

export async function fetchLibraryItem(
  id: string,
  token: string | null,
): Promise<LibraryItemResponse> {
  const response = await fetch(`${API_BASE_URL}/api/library/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  const data = await parseJson<LibraryItemResponse>(response);

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to load library item");
  }

  return data;
}

export async function saveLibraryItem(
  payload: SaveLibraryItemPayload,
  token: string | null,
): Promise<SaveLibraryItemResponse> {
  const response = await fetch(`${API_BASE_URL}/api/library`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = await parseJson<SaveLibraryItemResponse>(response);

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to save to library");
  }

  return data;
}

export async function deleteLibraryItem(
  id: string,
  token: string | null,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/library/${id}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  const data = await parseJson<{ success?: boolean }>(response);

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to delete library item");
  }
}
