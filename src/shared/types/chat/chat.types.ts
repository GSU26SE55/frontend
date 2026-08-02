import type { ChatAiIntentEnum } from "@/shared/enums/ticket/chat.enum";
export { ChatAiIntentEnum } from "@/shared/enums/ticket/chat.enum";
import type { ActorRoleEnum } from "@/shared/enums/ticket/ticket.enum";
import type { AddCommentPayload } from "@/shared/types/ticket/ticket.types";

// ── Chat outbox (gửi comment offline-first) ──────────────────────────────
// Tin nhắn đang chờ gửi lên BE, lưu bền ở localStorage per-ticket. Worker gửi
// tuần tự FIFO + backoff retry; hết deadline → status "failed" (chờ user bấm
// thử lại). KHÔNG phải token nên không vi phạm rule "cookie only" của dự án.
export type OutboxStatus = "queued" | "sending" | "failed";

export interface OutboxMessage {
  /** id tạm phía FE — "temp-{ticketId}-{seq}", seq lấy từ counter bền trong store. */
  tempId: string;
  ticketId: string;
  payload: AddCommentPayload;
  status: OutboxStatus;
  /** số lần đã thử gửi (dùng tính backoff delay). */
  attempt: number;
  createdAt: number;
  /** createdAt + tổng timeout — quá mốc này mà chưa gửi được → "failed". */
  deadline: number;
  /** Lý do fail hiển thị cho user (vd trùng nội dung) — chỉ set khi retry vô nghĩa. */
  failReason?: string;
}

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

// GET /api/tickets/{id}/chats/{id}/reactions — aggregate group theo 5 loại reaction.
// Khớp BE TicketChatReactionsAggregateDTO. "reactedByMe" KHÔNG có sẵn — FE tự tính
// bằng cách so userId trong users[] với current user.
export interface ChatReactionUserDto {
  userId: string;
  role: ActorRoleEnum;
}
export interface ChatReactionGroupDto {
  count: number;
  users: ChatReactionUserDto[];
}
export interface ChatReactionsAggregateDto {
  thumbsUp: ChatReactionGroupDto;
  acknowledged: ChatReactionGroupDto;
  resolved: ChatReactionGroupDto;
  needMoreInfo: ChatReactionGroupDto;
  disagree: ChatReactionGroupDto;
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

// POST /api/tickets/{id}/chats/voice (application/json — ChatAttachmentInput của
// file audio đã upload sẵn qua FileStorage). Tạo chat placeholder + transcribe async;
// response giống TicketActionResponse dùng chung cho các action ticket khác.
export interface ChatVoiceActionDTO {
  id: string | null;
  ticketId: string | null;
  code: string | null;
  status: string;
  warnings?: string[] | null;
}

// ── AI chat (GH-133 Nhóm C) ──────────────────────────────────────────────
// POST /api/tickets/{id}/chats/suggest — body
export interface ChatSuggestPayload {
  intent: ChatAiIntentEnum;
}

// POST /api/tickets/{id}/chats/suggest — response data
export interface ChatSuggestDTO {
  suggestionId: string;
  suggestions: string[];
}

// POST /api/tickets/{id}/chats/summarize — response data
export interface ChatSummarizeDTO {
  summary: string;
}
