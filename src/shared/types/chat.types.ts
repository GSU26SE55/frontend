export interface ChatDto {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  body: string;
  isInternal: boolean;
  editCount: number;
  parentChatId?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  deletedAt?: string | null;
}

export interface ChatListParams {
  pageNumber?: number;
  pageSize?: number;
  cursor?: string;
  isInternal?: boolean;
}

export interface CreateChatPayload {
  body: string;
  isInternal?: boolean;
  parentChatId?: string;
}

export interface UpdateChatPayload {
  body: string;
}

export interface ChatReactionDto {
  emoji: string;
  count: number;
  reactedByMe: boolean;
}

export interface ChatReaderDto {
  userId: string;
  displayName: string;
  readAt: string;
}

export interface ChatMarkReadPayload {
  chatIds: string[];
}
