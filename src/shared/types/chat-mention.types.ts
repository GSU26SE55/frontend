export interface ChatMentionDto {
  id: string;
  chatId: string;
  ticketId: string;
  chatBody: string;
  mentionedByName: string;
  acknowledgedAt?: string | null;
  createdAt: string;
}

export interface ChatMentionParams {
  pageNumber?: number;
  pageSize?: number;
  acknowledged?: boolean;
}
