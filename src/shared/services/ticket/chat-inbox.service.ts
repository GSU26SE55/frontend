import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";

export const chatInboxService = {
  /**
   * GET /api/chats/unread-count — total unread messages across ALL of the current
   * user's tickets. The BE counts by chat record, so messages with @mentions are
   * already included in this number; do NOT add the mention list on top (that would
   * double-count the same message).
   */
  getMyUnreadCount: () =>
    axiosInstance.get<CommonResponse<number>>(ENDPOINTS.MY_CHATS.UNREAD_COUNT),
};
