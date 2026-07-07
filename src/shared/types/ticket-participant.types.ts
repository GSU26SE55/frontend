export type TicketParticipantRole =
  | "Owner"
  | "PrimaryAssignee"
  | "Helper"
  | "Watcher";

export interface TicketParticipantDto {
  userId: string;
  displayName: string;
  role: TicketParticipantRole;
  canPost: boolean;
  canViewInternal: boolean;
  joinedAt: string;
  leftAt?: string | null;
}

export interface AddParticipantPayload {
  userId: string;
  role: TicketParticipantRole;
}

export interface BulkAddParticipantsPayload {
  participants: AddParticipantPayload[];
}

export interface UpdateParticipantPayload {
  role?: TicketParticipantRole;
  canPost?: boolean;
  canViewInternal?: boolean;
}

export interface RemoveParticipantPayload {
  reason?: string;
}
