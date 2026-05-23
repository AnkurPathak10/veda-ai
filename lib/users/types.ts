export type UserSettings = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  schoolName: string | null;
  schoolLocation: string | null;
};

export type UserSettingsResponse = {
  user: UserSettings;
};

export type UpdateUserSettingsPayload = {
  schoolName?: string;
  schoolLocation?: string;
};

export type SearchUsersResponse = {
  users: Array<{
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
  }>;
};
