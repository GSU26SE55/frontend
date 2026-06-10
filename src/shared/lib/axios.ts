import axios from "axios";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { env } from "@/config/env";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import { decodeToken } from "@/shared/types/session.types";
import { useSessionStore } from "@/shared/stores/sessionStore";
import { EntityError, HttpError } from "@/shared/lib/errors";

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
export const saveTokens = (accessToken: string, refreshToken: string) => {
  const { exp } = jwtDecode<{ exp: number }>(accessToken);
  Cookies.set("accessToken", accessToken, { expires: new Date(exp * 1000) });
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
    if (!res.data?.isSuccess) throw new Error("Refresh failed");
    const { accessToken, refreshToken: newRefreshToken } = res.data.data;
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
  async (error) => {
    const originalRequest = error.config;
    const status: number | undefined = error.response?.status;
    const data = error.response?.data;

    if (status === 401 && !originalRequest._retry) {
      const errorCode = data?.data?.errorCode;
      if (errorCode === "MISSING_TOKEN") {
        logout();
        return Promise.reject(
          new HttpError(401, getErrorMessage(401, data?.message)),
        );
      }
      originalRequest._retry = true;
      const newToken = await tryRefresh();
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      }
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
