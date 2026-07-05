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
  /** Bắt buộc khi sửa tin của người khác qua quyền chat.edit.any (ngoài khung 15 phút của author) */
  editReason?: string;
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

// POST /api/tickets/{id}/chats/{id}/translate?to={languageCode}
export interface ChatTranslateDTO {
  translatedBody: string;
  targetLanguage: string;
  originalLanguage: string;
  provider: string;
  fromCache: boolean;
}

// POST /api/tickets/{id}/chats/voice (multipart/form-data) — response giống
// TicketActionResponse dùng chung cho các action ticket khác.
export interface ChatVoiceActionDTO {
  id: string | null;
  ticketId: string | null;
  code: string | null;
  status: string;
  warnings?: string[] | null;
}
