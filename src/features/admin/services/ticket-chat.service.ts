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
  ChatReactionsAggregateDto,
  ChatReaderDto,
  ChatMarkReadPayload,
} from "@/shared/types/chat.types";
import type { ReactionTypeEnum } from "@/shared/enums/reaction.enum";
import type { TicketActionResponse } from "@/shared/types/ticket.types";
import type {
  ChatOverrideEditPayload,
  ChatOverrideDeletePayload,
} from "@/features/admin/schemas/chat-override.schema";

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
    axiosInstance.get<CommonResponse<ChatReactionsAggregateDto>>(
      ENDPOINTS.TICKETS.CHAT_REACTIONS(ticketId, chatId),
    ),

  // BE nhận reactionType dạng string name (JsonStringEnumConverter). Idempotent nếu đã reaction cùng loại.
  // Response Data = aggregate mới nhất → dùng luôn để cập nhật cache tức thì.
  addReaction: (
    ticketId: string,
    chatId: string,
    reactionType: ReactionTypeEnum,
  ) =>
    axiosInstance.post<CommonResponse<ChatReactionsAggregateDto>>(
      ENDPOINTS.TICKETS.CHAT_REACTIONS(ticketId, chatId),
      { reactionType },
    ),

  // Remove qua query param ?type= (BE [FromQuery] ReactionTypeEnum type), KHÔNG dùng body.
  removeReaction: (
    ticketId: string,
    chatId: string,
    reactionType: ReactionTypeEnum,
  ) =>
    axiosInstance.delete<CommonResponse<ChatReactionsAggregateDto>>(
      ENDPOINTS.TICKETS.CHAT_REACTIONS(ticketId, chatId),
      { params: { type: reactionType } },
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

  removeAttachment: (ticketId: string, chatId: string, attachmentId: string) =>
    axiosInstance.delete<CommonResponse<void>>(
      ENDPOINTS.TICKETS.CHAT_ATTACHMENT(ticketId, chatId, attachmentId),
    ),

  // ── GH-133 C4 — Admin override sửa/xóa chat trên ticket đã Closed (Admin only) ──
  overrideEdit: (
    ticketId: string,
    chatId: string,
    payload: ChatOverrideEditPayload,
  ) =>
    axiosInstance.put<TicketActionResponse>(
      ENDPOINTS.ADMIN.CHAT_CLOSED_OVERRIDE_ITEM(ticketId, chatId),
      payload,
    ),

  overrideDelete: (
    ticketId: string,
    chatId: string,
    payload: ChatOverrideDeletePayload,
  ) =>
    axiosInstance.delete<TicketActionResponse>(
      ENDPOINTS.ADMIN.CHAT_CLOSED_OVERRIDE_ITEM(ticketId, chatId),
      { data: payload },
    ),
};
