import type { ActorRoleEnum } from "@/shared/enums/ticket/ticket.enum";
export type { ActorRoleEnum } from "@/shared/enums/ticket/ticket.enum";

// GET /api/chats/mentions/me → CommonResponse<PaginationResponse<ChatMentionDto>>
// Matches the BE's TicketChatMentionDTO (TicketService.Application/DTOs/Response/Chats).
// GH-866: the BE dropped isAcknowledged/acknowledgedAt (there is no ACK mechanism
// anymore) and added isInternal.
export interface ChatMentionDto {
  id: string;
  chatId: string;
  ticketId?: string | null;
  mentionedUserId: string;
  mentionedUserRole: ActorRoleEnum;
  mentionedDisplayName?: string | null;
  /** The mention sits in an internal chat — picks the public/internal view. NOT an authz check. */
  isInternal: boolean;
  createdAt: string;
}

// Query params for GET /api/chats/mentions/me
export interface MyMentionsParams {
  page?: number;
  pageSize?: number;
}
