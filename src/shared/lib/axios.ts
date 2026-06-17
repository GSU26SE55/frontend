import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { env } from "@/config/env";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import { decodeToken } from "@/shared/types/session.types";
import { useSessionStore } from "@/shared/stores/sessionStore";
import { EntityError, HttpError } from "@/shared/lib/errors";
import type { ErrorEntity } from "@/shared/types/api.types";

// Mở rộng config chuẩn của axios để mang số lần đã retry — type-safe thay cho `any`.
declare module "axios" {
  export interface InternalAxiosRequestConfig {
    _retryCount?: number;
  }
}

// Shape của body lỗi BE trả về (CommonResponse) — errorCode nằm trong data.
interface ApiErrorData {
  message?: string;
  data?: { errorCode?: string };
  listErrors?: ErrorEntity[];
}

const CLOCK_SKEW_MS = 30_000;

export const isTokenExpired = (token: string): boolean => {
  try {
    const { exp } = jwtDecode<{ exp: number }>(token);
    return Date.now() >= exp * 1000 - CLOCK_SKEW_MS;
  } catch {
    return true;
  }
};

// SECURITY: non-httpOnly cookie, acceptable for capstone scope
// accessToken cookie sống 7 ngày như refreshToken — KHÔNG set expires = exp.
// Nếu cookie hết hạn đúng mốc JWT exp, sau mốc đó browser xoá cookie → request gửi
// thiếu Bearer → BE trả MISSING_TOKEN → logout oan. Việc token hết hạn được phát hiện
// qua isTokenExpired (JWT exp) để trigger refresh, không phụ thuộc vào vòng đời cookie.
export const saveTokens = (accessToken: string, refreshToken: string) => {
  Cookies.set("accessToken", accessToken, { expires: 7 });
  Cookies.set("refreshToken", refreshToken, { expires: 7 });
};

export const clearTokens = () => {
  Cookies.remove("accessToken");
  Cookies.remove("refreshToken");
};

const axiosInstance = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

const logout = () => {
  clearTokens();
  useSessionStore.getState().clearSession();
  window.location.href = "/login";
};

const tryRefresh = async (): Promise<string | null> => {
  if (isRefreshing) {
    return new Promise((resolve) => pendingQueue.push(resolve));
  }
  isRefreshing = true;
  try {
    const refreshToken = Cookies.get("refreshToken");
    if (!refreshToken) throw new Error("No refresh token");

    const res = await axios.post(
      `${env.VITE_API_BASE_URL}${ENDPOINTS.AUTH.REFRESH_TOKEN}`,
      { refreshToken },
      { timeout: 10_000 },
    );
    // GH-295: refresh trả LoginResultDto — token nằm trong data.tokens (challenge luôn null)
    if (!res.data?.isSuccess || !res.data.data?.tokens)
      throw new Error("Refresh failed");
    const { accessToken, refreshToken: newRefreshToken } = res.data.data.tokens;
    saveTokens(accessToken, newRefreshToken);
    useSessionStore.getState().setSession(decodeToken(accessToken));
    pendingQueue.forEach((cb) => cb(accessToken));
    return accessToken;
  } catch {
    pendingQueue.forEach((cb) => cb(null));
    logout();
    return null;
  } finally {
    isRefreshing = false;
    pendingQueue = [];
  }
};

axiosInstance.interceptors.request.use(async (config) => {
  const accessToken = Cookies.get("accessToken");
  if (!accessToken) return config;

  if (!isTokenExpired(accessToken)) {
    config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
  }

  const newToken = await tryRefresh();
  if (newToken) {
    config.headers.Authorization = `Bearer ${newToken}`;
  }
  return config;
});

const HTTP_ERROR_MESSAGES: Record<number, string> = {
  400: "Yêu cầu không hợp lệ",
  401: "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại",
  403: "Bạn không có quyền thực hiện thao tác này",
  404: "Không tìm thấy dữ liệu yêu cầu",
  405: "Phương thức không được hỗ trợ",
  409: "Dữ liệu bị xung đột, vui lòng kiểm tra lại",
  422: "Dữ liệu không hợp lệ theo quy tắc nghiệp vụ",
  429: "Bạn đã gửi quá nhiều yêu cầu, vui lòng thử lại sau",
  500: "Lỗi máy chủ nội bộ, vui lòng thử lại sau",
  502: "Cổng kết nối lỗi, vui lòng thử lại sau",
  503: "Dịch vụ tạm thời không khả dụng, vui lòng thử lại sau",
  504: "Kết nối máy chủ hết thời gian chờ, vui lòng thử lại sau",
};

const getErrorMessage = (status: number, serverMessage?: string): string =>
  serverMessage || HTTP_ERROR_MESSAGES[status] || `Đã xảy ra lỗi (${status})`;

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorData>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig;
    const status: number | undefined = error.response?.status;
    const data = error.response?.data;

    if (status === 401) {
      const errorCode = data?.data?.errorCode;
      const retryCount: number = originalRequest._retryCount ?? 0;

      // CHỈ TOKEN_EXPIRED mới thử refresh — token còn hợp lệ nhưng hết hạn.
      // MISSING_TOKEN (không có token), INVALID_SIGNATURE / INVALID_TOKEN (token hỏng/giả mạo)
      // → refresh vô nghĩa → logout ngay.
      if (errorCode !== "TOKEN_EXPIRED") {
        logout();
        return Promise.reject(
          new HttpError(401, getErrorMessage(401, data?.message)),
        );
      }

      // Đã retry 1 lần (refresh xong gọi lại) mà vẫn TOKEN_EXPIRED → logout.
      if (retryCount >= 1) {
        logout();
        return Promise.reject(
          new HttpError(401, getErrorMessage(401, data?.message)),
        );
      }

      originalRequest._retryCount = retryCount + 1;
      const newToken = await tryRefresh();
      // tryRefresh thành công → đã saveTokens (cookie) + setSession (zustand) với token mới.
      // Đệ quy gọi lại request vừa bị missing token với accessToken mới.
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      }
      // tryRefresh trả null → bên trong đã logout() rồi, chỉ cần reject.
      return Promise.reject(
        new HttpError(401, getErrorMessage(401, data?.message)),
      );
    }

    // 400 / 422 — parse listErrors for form field mapping
    if (status === 400 || status === 422) {
      if (Array.isArray(data?.listErrors) && data.listErrors.length > 0) {
        return Promise.reject(new EntityError(data.listErrors, status));
      }
      return Promise.reject(
        new HttpError(status, getErrorMessage(status, data?.message)),
      );
    }

    if (status !== undefined) {
      return Promise.reject(
        new HttpError(status, getErrorMessage(status, data?.message)),
      );
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
