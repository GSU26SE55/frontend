import axios from 'axios';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { env } from '@/config/env';
import { ENDPOINTS } from '@/shared/utils/endpoints';
import { decodeToken } from '@/shared/types/session.types';
import { useSessionStore } from '@/shared/stores/sessionStore';
import { EntityError, HttpError } from '@/shared/lib/errors';

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
  Cookies.set('accessToken', accessToken, { expires: new Date(exp * 1000) });
  Cookies.set('refreshToken', refreshToken, { expires: 7 });
};

export const clearTokens = () => {
  Cookies.remove('accessToken');
  Cookies.remove('refreshToken');
};

const axiosInstance = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

const logout = () => {
  clearTokens();
  useSessionStore.getState().clearSession();
  window.location.href = '/login';
};

const tryRefresh = async (): Promise<string | null> => {
  if (isRefreshing) {
    return new Promise(resolve => pendingQueue.push(resolve));
  }
  isRefreshing = true;
  try {
    const refreshToken = Cookies.get('refreshToken');
    if (!refreshToken) throw new Error('No refresh token');

    const res = await axios.post(
      `${env.VITE_API_BASE_URL}${ENDPOINTS.AUTH.REFRESH_TOKEN}`,
      { refreshToken },
      { timeout: 10_000 }
    );
    const { accessToken, refreshToken: newRefreshToken } = res.data.data;
    saveTokens(accessToken, newRefreshToken);
    useSessionStore.getState().setSession(decodeToken(accessToken));
    pendingQueue.forEach(cb => cb(accessToken));
    return accessToken;
  } catch {
    pendingQueue.forEach(cb => cb(null));
    logout();
    return null;
  } finally {
    isRefreshing = false;
    pendingQueue = [];
  }
};

axiosInstance.interceptors.request.use(async config => {
  const accessToken = Cookies.get('accessToken');
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

axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    const status: number | undefined = error.response?.status;
    const data = error.response?.data;

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const newToken = await tryRefresh();
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      }
    }

    // 400 Bad Request / 422 Unprocessable Entity — parse listErrors for form field mapping
    if (status === 400 || status === 422) {
      if (Array.isArray(data?.listErrors) && data.listErrors.length > 0) {
        return Promise.reject(new EntityError(data.listErrors));
      }
      return Promise.reject(new HttpError(status, data?.message ?? 'Yêu cầu không hợp lệ'));
    }

    // Other HTTP errors — wrap as HttpError for consistent handling
    if (status !== undefined) {
      return Promise.reject(new HttpError(status, data?.message ?? error.message));
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
