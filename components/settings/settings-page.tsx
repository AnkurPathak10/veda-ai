"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { Loader2, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { fetchUserSettings, updateUserSettings } from "@/lib/users/api";
import { refreshNotificationsStore } from "@/lib/notifications/refresh";
import { useToastStore } from "@/stores/toast-store";
import { useUserSettingsStore } from "@/stores/user-settings-store";

export function SettingsPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const showToast = useToastStore((s) => s.show);

  const settings = useUserSettingsStore((s) => s.settings);
  const isLoading = useUserSettingsStore((s) => s.isLoading);
  const error = useUserSettingsStore((s) => s.error);
  const setSettings = useUserSettingsStore((s) => s.setSettings);
  const patchSettings = useUserSettingsStore((s) => s.patchSettings);
  const setLoading = useUserSettingsStore((s) => s.setLoading);
  const setError = useUserSettingsStore((s) => s.setError);

  const [schoolName, setSchoolName] = useState("");
  const [schoolLocation, setSchoolLocation] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const data = await fetchUserSettings(token);
      setSettings(data.user);
      setSchoolName(data.user.schoolName ?? "");
      setSchoolLocation(data.user.schoolLocation ?? "");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load settings",
      );
    } finally {
      setLoading(false);
    }
  }, [getToken, setError, setLoading, setSettings]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const handleSave = async () => {
    const trimmedSchoolName = schoolName.trim();
    const trimmedSchoolLocation = schoolLocation.trim();

    setIsSaving(true);
    patchSettings({
      schoolName: trimmedSchoolName || null,
      schoolLocation: trimmedSchoolLocation || null,
    });

    try {
      const token = await getToken();
      const data = await updateUserSettings(
        {
          schoolName: trimmedSchoolName,
          schoolLocation: trimmedSchoolLocation,
        },
        token,
      );
      setSettings(data.user);
      showToast("Settings saved successfully");
      await refreshNotificationsStore(getToken);
    } catch (saveError) {
      await loadSettings();
      showToast(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save settings",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const displayName =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "User";

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
          onClick={() => void loadSettings()}
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
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
            <h1 className="text-2xl font-bold tracking-tight text-[#1a1a1a]">
              Settings
            </h1>
          </div>
          <p className="mt-1 text-sm text-[#6b7280]">
            Manage your profile and school information.
          </p>
        </div>

        <div className="mt-8 max-w-2xl space-y-6">
          <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-[#1a1a1a]">Profile</h2>
            <div className="mt-4 flex items-center gap-4">
              {user?.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.imageUrl}
                  alt={displayName}
                  className="h-14 w-14 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f3f4f6] text-lg font-semibold text-[#4b5563]">
                  {displayName.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-[#1a1a1a]">
                  {isLoaded ? displayName : "..."}
                </p>
                <p className="text-sm text-[#6b7280]">
                  {settings?.email ?? user?.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-[#1a1a1a]">School</h2>
            <p className="mt-1 text-sm text-[#6b7280]">
              This appears in your sidebar across the app.
            </p>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-[#374151]">
                  School name
                </span>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(event) => setSchoolName(event.target.value)}
                  placeholder="Delhi Public School"
                  className="mt-1.5 w-full rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm text-[#1a1a1a] outline-none transition-colors focus:border-[#1a1a1a]"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-[#374151]">
                  Location
                </span>
                <input
                  type="text"
                  value={schoolLocation}
                  onChange={(event) => setSchoolLocation(event.target.value)}
                  placeholder="Bokaro Steel City"
                  className="mt-1.5 w-full rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm text-[#1a1a1a] outline-none transition-colors focus:border-[#1a1a1a]"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#1a1a1a] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2d2d2d] disabled:opacity-60"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save changes
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
