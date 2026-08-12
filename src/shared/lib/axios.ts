import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { env } from "@/config/env";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import { decodeToken } from "@/shared/types/account/session.types";
import { useSessionStore } from "@/shared/stores/sessionStore";
import { getDeviceId } from "@/shared/lib/deviceId";
import { EntityError, HttpError } from "@/shared/lib/errors";
import type { ErrorEntity } from "@/shared/types/api.types";

// Extend axios's standard config to carry the retry count — type-safe instead of `any`.
declare module "axios" {
  export interface InternalAxiosRequestConfig {
    _retryCount?: number;
  }
}

// Shape of the error body the BE returns (CommonResponse) — errorCode lives in data.
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
// The accessToken cookie lives 7 days, same as refreshToken — do NOT set expires = exp.
// If the cookie expired exactly at the JWT exp mark, the browser would delete the cookie
// right after that, so requests would go out missing the Bearer token → BE returns
// MISSING_TOKEN → an unwarranted logout. Token expiry is instead detected via
// isTokenExpired (JWT exp) to trigger a refresh, independent of the cookie's lifetime.
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
    // GH-295: refresh returns a LoginResultDto — the token lives in data.tokens (challenge is always null)
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
  // #AUTH-48: send the device id on every request (BE only reads it for trusted-devices).
  config.headers["X-Device-Id"] = getDeviceId();

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
  400: "Invalid request",
  401: "Session expired, please log in again",
  403: "You don't have permission to perform this action",
  404: "Requested data not found",
  405: "Method not supported",
  409: "Data conflict, please check and try again",
  422: "Data invalid per business rules",
  429: "You've sent too many requests, please try again later",
  500: "Internal server error, please try again later",
  502: "Gateway error, please try again later",
  503: "Service temporarily unavailable, please try again later",
  504: "Server connection timed out, please try again later",
};

const getErrorMessage = (status: number, serverMessage?: string): string =>
  serverMessage ||
  HTTP_ERROR_MESSAGES[status] ||
  `An error occurred (${status})`;

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorData>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig;
    const status: number | undefined = error.response?.status;
    let data = error.response?.data;

    // Requests using responseType: "blob" (AuthImage, downloadFile) — on error, axios
    // still forces the body into a Blob per the request config even though the BE
    // returned JSON, so errorCode/message always read as undefined → 401 TOKEN_EXPIRED
    // gets mistaken for a forged token and logs the user out instead of refreshing.
    // Re-parse manually if the blob body is actually JSON.
    const rawData: unknown = error.response?.data;
    if (rawData instanceof Blob && rawData.type.includes("json")) {
      try {
        data = JSON.parse(await rawData.text()) as ApiErrorData;
      } catch {
        // Couldn't parse — keep data as a Blob, fall through to the default handling.
      }
    }

    if (status === 401) {
      const errorCode = data?.data?.errorCode;
      const retryCount: number = originalRequest._retryCount ?? 0;

      // ONLY TOKEN_EXPIRED attempts a refresh — the token is otherwise valid but expired.
      // MISSING_TOKEN (no token), INVALID_SIGNATURE / INVALID_TOKEN (corrupted/forged token)
      // → refreshing is pointless → logout immediately.
      if (errorCode !== "TOKEN_EXPIRED") {
        logout();
        return Promise.reject(
          new HttpError(401, getErrorMessage(401, data?.message)),
        );
      }

      // Already retried once (after a refresh) and still TOKEN_EXPIRED → logout.
      if (retryCount >= 1) {
        logout();
        return Promise.reject(
          new HttpError(401, getErrorMessage(401, data?.message)),
        );
      }

      originalRequest._retryCount = retryCount + 1;
      const newToken = await tryRefresh();
      // tryRefresh succeeded → already saveTokens (cookie) + setSession (zustand) with the new token.
      // Recursively retry the request that failed with the new accessToken.
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      }
      // tryRefresh returned null → it already called logout() internally, just reject.
      return Promise.reject(
        new HttpError(401, getErrorMessage(401, data?.message)),
      );
    }

    // 400 / 422 — parse listErrors for form field mapping
    if (status === 400 || status === 422) {
      if (Array.isArray(data?.listErrors) && data.listErrors.length > 0) {
        // BE returns `field` in PascalCase (e.g. "QuietHoursStart") — RHF registers fields
        // in camelCase, so lowercase the first letter so setError() matches the right input field.
        // Guard: if the JSON key is "Field" (PascalCase) → e.field is undefined; leave it as
        // is, don't call charAt on undefined (this interceptor is app-wide — avoid throwing).
        const normalized = data.listErrors.map((e) =>
          typeof e.field === "string"
            ? {
                ...e,
                field: e.field.charAt(0).toLowerCase() + e.field.slice(1),
              }
            : e,
        );
        return Promise.reject(new EntityError(normalized, status));
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
