import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type { ChatDto } from "@/shared/types/chat.types";

export interface AdminChatSearchParams {
  keyword?: string;
  ticketId?: string;
  authorId?: string;
  isInternal?: boolean;
  from?: string;
  to?: string;
  pageNumber?: number;
  pageSize?: number;
}

export const adminChatSearchService = {
  search: (params?: AdminChatSearchParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<ChatDto>>>(
      ENDPOINTS.ADMIN_CHAT_SEARCH.SEARCH,
      { params },
    ),
};
