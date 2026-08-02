import type { ActorRoleEnum } from "@/shared/enums/ticket/ticket.enum";
export type { ActorRoleEnum } from "@/shared/enums/ticket/ticket.enum";

// GET /api/chats/mentions/me → CommonResponse<PaginationResponse<ChatMentionDto>>
// Khớp BE TicketChatMentionDTO (TicketService.Application/DTOs/Response/Chats).
// GH-866: BE bỏ isAcknowledged/acknowledgedAt (không còn cơ chế ACK) và thêm isInternal.
export interface ChatMentionDto {
  id: string;
  chatId: string;
  ticketId?: string | null;
  mentionedUserId: string;
  mentionedUserRole: ActorRoleEnum;
  mentionedDisplayName?: string | null;
  /** Mention nằm trong chat nội bộ — chọn view public/internal. KHÔNG phải authz check. */
  isInternal: boolean;
  createdAt: string;
}

// Query params cho GET /api/chats/mentions/me
export interface MyMentionsParams {
  page?: number;
  pageSize?: number;
}
