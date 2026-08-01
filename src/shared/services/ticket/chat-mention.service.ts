import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type {
  ChatMentionDto,
  MyMentionsParams,
} from "@/shared/types/chat/mention.types";

export const chatMentionService = {
  // GET /api/chats/mentions/me?unreadOnly&page&pageSize
  getMyMentions: (params?: MyMentionsParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<ChatMentionDto>>>(
      ENDPOINTS.CHAT_MENTIONS.ME,
      { params },
    ),

  // PATCH /api/chats/mentions/{id}/acknowledge — chỉ chính chủ mention.
  acknowledge: (id: string) =>
    axiosInstance.patch<CommonResponse<ChatMentionDto>>(
      ENDPOINTS.CHAT_MENTIONS.ACKNOWLEDGE(id),
    ),
};
