import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type {
  ChatMentionDto,
  ChatMentionParams,
} from "@/shared/types/chat-mention.types";

export const chatMentionService = {
  getMy: (params?: ChatMentionParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<ChatMentionDto>>>(
      ENDPOINTS.CHAT_MENTIONS.ME,
      { params },
    ),

  acknowledge: (id: string) =>
    axiosInstance.post<CommonResponse<void>>(
      ENDPOINTS.CHAT_MENTIONS.ACKNOWLEDGE(id),
    ),
};
