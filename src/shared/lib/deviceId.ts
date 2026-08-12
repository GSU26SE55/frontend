// #AUTH-48: A stable device id so the BE can mark `isCurrentDevice` in trusted-devices.
// This is a device id (NOT a token) → storing it in localStorage is fine, doesn't violate the token-cookie-only rule.
const DEVICE_ID_KEY = "device_id";

export const getDeviceId = (): string => {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    // localStorage unavailable (private mode, etc.) → return a temporary uuid, not persisted.
    return crypto.randomUUID();
  }
};
