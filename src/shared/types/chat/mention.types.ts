import type { ActorRoleEnum } from "@/shared/enums/ticket/ticket.enum";
export type { ActorRoleEnum } from "@/shared/enums/ticket/ticket.enum";

// GET  /api/chats/mentions/me           → CommonResponse<PaginationResponse<ChatMentionDto>>
// PATCH /api/chats/mentions/{id}/acknowledge → CommonResponse<ChatMentionDto>
// Khớp BE TicketChatMentionDTO (TicketService.Application/DTOs/Response/Chats).
export interface ChatMentionDto {
  id: string;
  chatId: string;
  ticketId?: string | null;
  mentionedUserId: string;
  mentionedUserRole: ActorRoleEnum;
  mentionedDisplayName?: string | null;
  isAcknowledged: boolean;
  acknowledgedAt?: string | null;
  createdAt: string;
}

// Query params cho GET /api/chats/mentions/me
export interface MyMentionsParams {
  unreadOnly?: boolean;
  page?: number;
  pageSize?: number;
}
