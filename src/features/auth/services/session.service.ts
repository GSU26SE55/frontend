import axiosInstance from '@/shared/lib/axios';
import { ENDPOINTS } from '@/shared/utils/endpoints';
import type { CommonResponse } from '@/shared/types/api.types';
import type { SessionDto, RevokeAllSessionsPayload } from '@/features/auth/types/auth.types';

export const sessionService = {
  getSessions: (activeOnly?: boolean) =>
    axiosInstance.get<CommonResponse<SessionDto[]>>(ENDPOINTS.SESSIONS.ME, {
      params: { activeOnly },
    }),

  revokeSession: (sessionId: string) =>
    axiosInstance.delete<CommonResponse<number>>(ENDPOINTS.SESSIONS.REVOKE(sessionId)),

  revokeAllSessions: (payload?: RevokeAllSessionsPayload) =>
    axiosInstance.post<CommonResponse<number>>(ENDPOINTS.SESSIONS.REVOKE_ALL, payload),
};
