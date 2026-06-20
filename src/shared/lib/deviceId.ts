// #AUTH-48: Device id ổn định để BE đánh dấu `isCurrentDevice` trong trusted-devices.
// Đây là device id (KHÔNG phải token) → lưu localStorage hợp lệ, không vi phạm rule token-cookie-only.
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
    // localStorage không khả dụng (private mode...) → trả uuid tạm, không persist.
    return crypto.randomUUID();
  }
};
