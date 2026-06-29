import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type {
  ChatTemplateDto,
  CreateChatTemplatePayload,
  UpdateChatTemplatePayload,
  ChatTemplateListParams,
} from "@/shared/types/chat-template.types";

export const chatTemplateService = {
  getList: (params?: ChatTemplateListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<ChatTemplateDto>>>(
      ENDPOINTS.CHAT_TEMPLATES.LIST,
      { params },
    ),

  getById: (id: string) =>
    axiosInstance.get<CommonResponse<ChatTemplateDto>>(
      ENDPOINTS.CHAT_TEMPLATES.DETAIL(id),
    ),

  create: (payload: CreateChatTemplatePayload) =>
    axiosInstance.post<CommonResponse<ChatTemplateDto>>(
      ENDPOINTS.CHAT_TEMPLATES.LIST,
      payload,
    ),

  update: (id: string, payload: UpdateChatTemplatePayload) =>
    axiosInstance.put<CommonResponse<ChatTemplateDto>>(
      ENDPOINTS.CHAT_TEMPLATES.DETAIL(id),
      payload,
    ),

  remove: (id: string) =>
    axiosInstance.delete<CommonResponse<void>>(
      ENDPOINTS.CHAT_TEMPLATES.DETAIL(id),
    ),
};
