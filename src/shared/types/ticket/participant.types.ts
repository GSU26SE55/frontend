import type {
  ActorRoleEnum,
  ParticipantTypeEnum,
} from "@/shared/enums/ticket/ticket.enum";

// GET /api/tickets/{ticketId}/participants → CommonResponse<TicketParticipantDto[]>
// Khớp BE TicketParticipantDTO (TicketService.Application/DTOs/Response/Tickets).
// BE chỉ trả participant còn active (RemovedAt == null), sắp xếp theo addedAt.
export interface TicketParticipantDto {
  id: string;
  ticketId: string;
  userId: string;
  displayName: string;
  userRole: ActorRoleEnum;
  participantType: ParticipantTypeEnum;
  /** Được phép gửi chat trên ticket này. */
  canPost: boolean;
  /** Được phép xem/nhận chat nội bộ. */
  canViewInternal: boolean;
  addedByUserId: string;
  addedAt: string;
}
