import type { ChatAiIntentEnum } from "@/shared/enums/ticket/chat.enum";
export { ChatAiIntentEnum } from "@/shared/enums/ticket/chat.enum";
import type { ActorRoleEnum } from "@/shared/enums/ticket/ticket.enum";
import type { AddCommentPayload } from "@/shared/types/ticket/ticket.types";

// ── Chat outbox (offline-first comment sending) ──────────────────────────
// Messages queued for the BE, persisted in localStorage per ticket. A worker
// sends them FIFO with backoff retry; past the deadline → status "failed"
// (waiting for the user to retry). These are not tokens, so this does not
// break the project's "cookie only" rule.
export type OutboxStatus = "queued" | "sending" | "failed";

export interface OutboxMessage {
  /** Temporary FE-side id — "temp-{ticketId}-{seq}", seq from a persisted counter in the store. */
  tempId: string;
  ticketId: string;
  payload: AddCommentPayload;
  status: OutboxStatus;
  /** Number of send attempts so far (used to compute the backoff delay). */
  attempt: number;
  createdAt: number;
  /** createdAt + total timeout — still unsent past this point → "failed". */
  deadline: number;
  /** Failure reason shown to the user (e.g. duplicate content) — set only when retrying is pointless. */
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
  /** Required when editing someone else's message via chat.edit.any (outside the author's 15-minute window) */
  editReason?: string;
}

// GET /api/tickets/{id}/chats/{id}/reactions — aggregate grouped by the 5 reaction types.
// Matches the BE's TicketChatReactionsAggregateDTO. "reactedByMe" is NOT provided — the FE
// derives it by comparing the userIds in users[] against the current user.
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
  chatId?: string;
  userId: string;
  displayName: string;
  /** Null → render the initial of displayName instead. */
  avatarUrl?: string | null;
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

// POST /api/tickets/{id}/chats/voice (application/json — ChatAttachmentInput for an
// audio file already uploaded through FileStorage). Creates a placeholder chat and
// transcribes asynchronously; the response mirrors the TicketActionResponse shared by
// the other ticket actions.
export interface ChatVoiceActionDTO {
  id: string | null;
  ticketId: string | null;
  code: string | null;
  status: string;
  warnings?: string[] | null;
}

// ── AI chat (GH-133 Group C) ─────────────────────────────────────────────
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
