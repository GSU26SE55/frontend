import type {
  ActorRoleEnum,
  ParticipantTypeEnum,
} from "@/shared/enums/ticket/ticket.enum";

// GET /api/tickets/{ticketId}/participants → CommonResponse<TicketParticipantDto[]>
// Matches the BE's TicketParticipantDTO (TicketService.Application/DTOs/Response/Tickets).
// The BE returns only active participants (RemovedAt == null), ordered by addedAt.
export interface TicketParticipantDto {
  id: string;
  ticketId: string;
  userId: string;
  displayName: string;
  userRole: ActorRoleEnum;
  participantType: ParticipantTypeEnum;
  /** Allowed to post chat messages on this ticket. */
  canPost: boolean;
  /** Allowed to see and receive internal chat. */
  canViewInternal: boolean;
  addedByUserId: string;
  addedAt: string;
}
