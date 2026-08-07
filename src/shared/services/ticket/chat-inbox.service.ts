import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";

export const chatInboxService = {
  /**
   * GET /api/chats/unread-count — tổng tin chưa đọc trên MỌI ticket của user hiện tại.
   * BE đếm theo bản ghi chat nên tin có @mention đã nằm trong số này; KHÔNG cộng thêm
   * danh sách mention (sẽ đếm gấp đôi cùng một tin).
   */
  getMyUnreadCount: () =>
    axiosInstance.get<CommonResponse<number>>(ENDPOINTS.MY_CHATS.UNREAD_COUNT),
};
