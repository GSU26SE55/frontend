import Cookies from "js-cookie";
import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import type { SessionDto } from "@/shared/types/account/session.types";

/**
 * The current user's own login sessions (one per refresh token).
 *
 * Distinct from `adminAccountsService.getSessions`, which reads *another* account's sessions
 * and needs an id — here the BE derives the account from the JWT.
 */
export const sessionService = {
  // activeOnly=true drops expired/revoked rows, which is all the "where am I signed in"
  // list should show; the full history is an audit concern and has no UI.
  listMine: () =>
    axiosInstance.get<CommonResponse<SessionDto[]>>(ENDPOINTS.SESSIONS.ME, {
      params: { activeOnly: true },
    }),

  revokeOne: (id: string) =>
    axiosInstance.delete<CommonResponse<unknown>>(
      ENDPOINTS.SESSIONS.REVOKE(id),
    ),

  /**
   * Sign out every OTHER device, keeping the caller signed in.
   *
   * A refresh token is an opaque random string that never appears in the access token, so the
   * BE cannot tell which session is calling — it has to be told. Without `currentRefreshToken`
   * the BE cannot honour `exceptCurrent` and would sign this device out too.
   */
  revokeAllOthers: () =>
    axiosInstance.post<CommonResponse<number>>(ENDPOINTS.SESSIONS.REVOKE_ALL, {
      exceptCurrent: true,
      currentRefreshToken: Cookies.get("refreshToken"),
    }),
};
