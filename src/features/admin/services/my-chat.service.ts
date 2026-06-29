import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type { ChatDto, ChatListParams } from "@/shared/types/chat.types";

export const myChatService = {
  getMy: (params?: ChatListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<ChatDto>>>(
      ENDPOINTS.MY_CHATS.LIST,
      { params },
    ),

  eraseMyData: () =>
    axiosInstance.delete<CommonResponse<void>>(ENDPOINTS.MY_CHATS.ERASE),
};
