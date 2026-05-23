import { API_BASE_URL } from "@/lib/create-assignment/constants";
import type {
  SearchUsersResponse,
  UpdateUserSettingsPayload,
  UserSettingsResponse,
} from "./types";

type ApiError = {
  error?: string;
};

async function parseJson<T>(response: Response): Promise<T & ApiError> {
  return (await response.json()) as T & ApiError;
}

export async function fetchUserSettings(
  token: string | null,
): Promise<UserSettingsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/users/me`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  const data = await parseJson<UserSettingsResponse>(response);

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to load user settings");
  }

  return data;
}

export async function updateUserSettings(
  payload: UpdateUserSettingsPayload,
  token: string | null,
): Promise<UserSettingsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/users/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = await parseJson<UserSettingsResponse>(response);

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to update user settings");
  }

  return data;
}

export async function searchUsersByEmail(
  email: string,
  token: string | null,
): Promise<SearchUsersResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/users/search?email=${encodeURIComponent(email)}`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );

  const data = await parseJson<SearchUsersResponse>(response);

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to search users");
  }

  return data;
}
