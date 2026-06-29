import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type {
  ChatDto,
  ChatListParams,
  CreateChatPayload,
  UpdateChatPayload,
  ChatReactionDto,
  ChatReaderDto,
  ChatMarkReadPayload,
} from "@/shared/types/chat.types";

export const ticketChatService = {
  getList: (ticketId: string, params?: ChatListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<ChatDto>>>(
      ENDPOINTS.TICKETS.CHATS(ticketId),
      { params },
    ),

  getById: (ticketId: string, chatId: string) =>
    axiosInstance.get<CommonResponse<ChatDto>>(
      ENDPOINTS.TICKETS.CHAT_DETAIL(ticketId, chatId),
    ),

  create: (ticketId: string, payload: CreateChatPayload) =>
    axiosInstance.post<CommonResponse<ChatDto>>(
      ENDPOINTS.TICKETS.CHATS(ticketId),
      payload,
    ),

  update: (ticketId: string, chatId: string, payload: UpdateChatPayload) =>
    axiosInstance.put<CommonResponse<ChatDto>>(
      ENDPOINTS.TICKETS.CHAT_DETAIL(ticketId, chatId),
      payload,
    ),

  remove: (ticketId: string, chatId: string, reason?: string) =>
    axiosInstance.delete<CommonResponse<void>>(
      ENDPOINTS.TICKETS.CHAT_DETAIL(ticketId, chatId),
      { data: reason ? { reason } : undefined },
    ),

  getReplies: (ticketId: string, chatId: string) =>
    axiosInstance.get<CommonResponse<ChatDto[]>>(
      ENDPOINTS.TICKETS.CHAT_REPLIES(ticketId, chatId),
    ),

  addReply: (ticketId: string, chatId: string, payload: CreateChatPayload) =>
    axiosInstance.post<CommonResponse<ChatDto>>(
      ENDPOINTS.TICKETS.CHAT_REPLIES(ticketId, chatId),
      payload,
    ),

  pin: (ticketId: string, chatId: string) =>
    axiosInstance.post<CommonResponse<void>>(
      ENDPOINTS.TICKETS.CHAT_PIN(ticketId, chatId),
    ),

  unpin: (ticketId: string, chatId: string) =>
    axiosInstance.delete<CommonResponse<void>>(
      ENDPOINTS.TICKETS.CHAT_PIN(ticketId, chatId),
    ),

  getReactions: (ticketId: string, chatId: string) =>
    axiosInstance.get<CommonResponse<ChatReactionDto[]>>(
      ENDPOINTS.TICKETS.CHAT_REACTIONS(ticketId, chatId),
    ),

  addReaction: (ticketId: string, chatId: string, emoji: string) =>
    axiosInstance.post<CommonResponse<void>>(
      ENDPOINTS.TICKETS.CHAT_REACTIONS(ticketId, chatId),
      { emoji },
    ),

  removeReaction: (ticketId: string, chatId: string, emoji: string) =>
    axiosInstance.delete<CommonResponse<void>>(
      ENDPOINTS.TICKETS.CHAT_REACTIONS(ticketId, chatId),
      { data: { emoji } },
    ),

  markRead: (ticketId: string, payload: ChatMarkReadPayload) =>
    axiosInstance.post<CommonResponse<void>>(
      ENDPOINTS.TICKETS.CHAT_MARK_READ(ticketId),
      payload,
    ),

  getReaders: (ticketId: string, chatId: string) =>
    axiosInstance.get<CommonResponse<ChatReaderDto[]>>(
      ENDPOINTS.TICKETS.CHAT_READERS(ticketId, chatId),
    ),

  getUnreadCount: (ticketId: string) =>
    axiosInstance.get<CommonResponse<number>>(
      ENDPOINTS.TICKETS.CHAT_UNREAD_COUNT(ticketId),
    ),

  getByCursor: (ticketId: string, cursor?: string, limit?: number) =>
    axiosInstance.get<CommonResponse<ChatDto[]>>(
      ENDPOINTS.TICKETS.CHAT_CURSOR(ticketId),
      { params: { cursor, limit } },
    ),

  addAttachment: (ticketId: string, chatId: string, fileId: string) =>
    axiosInstance.post<CommonResponse<void>>(
      ENDPOINTS.TICKETS.CHAT_ATTACHMENTS(ticketId, chatId),
      { fileId },
    ),

  removeAttachment: (
    ticketId: string,
    chatId: string,
    attachmentId: string,
  ) =>
    axiosInstance.delete<CommonResponse<void>>(
      ENDPOINTS.TICKETS.CHAT_ATTACHMENT(ticketId, chatId, attachmentId),
    ),
};
