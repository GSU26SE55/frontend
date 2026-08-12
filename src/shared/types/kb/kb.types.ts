export {
  KbArticleStatusEnum,
  KbArticleStatusLabel,
  KbArticleStatusCode,
  KbVersionStatusEnum,
  KbVersionStatusLabel,
  KbReferenceTypeEnum,
  KbReferenceTypeLabel,
} from "@/shared/enums/kb/kb.enum";

import type {
  KbArticleStatusEnum,
  KbReferenceTypeEnum,
  KbVersionStatusEnum,
} from "@/shared/enums/kb/kb.enum";
import type { TicketCategoryEnum } from "@/shared/enums/ticket/ticket.enum";

// ── DTOs (match the BE contract — status/category enums come as STRINGs) ──

export interface KbArticleDTO {
  id: string;
  code: string;
  category: TicketCategoryEnum;
  title: string;
  content: string;
  tags: string[];
  status: KbArticleStatusEnum;
  isInternalOnly: boolean;
  /** Template article — used as the skeleton for a new article via copy-template. */
  isTemplate: boolean;
  version: number;
  viewCount: number;
  helpfulCount: number;
  reviewRequired: boolean;
  pendingReviewBy?: string | null;
  managerRejectReason?: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt?: string | null;
}

// List item (GET /api/knowledge-base) — does NOT carry tags/content
export interface KbArticleSummaryDTO {
  id: string;
  code: string;
  title: string;
  category: TicketCategoryEnum;
  status: KbArticleStatusEnum;
  /** Template article — drives the badge shown in the list. */
  isTemplate: boolean;
  viewCount: number;
  helpfulCount: number;
  reviewRequired: boolean;
  createdAt: string;
}

// Version (status comes as a STRING — the BE enables JsonStringEnumConverter)
export interface KbArticleVersionDTO {
  id: string;
  articleId: string;
  majorVersion: number;
  minorVersion: number;
  status: KbVersionStatusEnum;
  title: string;
  content: string;
  tags: string[];
  changeDescription: string;
  changedBy: string;
  createdAt: string;
}

export interface DiffSection {
  oldValue: string;
  newValue: string;
  isChanged: boolean;
}

export interface KbArticleDiffDTO {
  fromVersion: string;
  toVersion: string;
  titleDiff: DiffSection;
  contentDiff: DiffSection;
  tagsDiff: DiffSection;
}

export interface KbArticleActionDTO {
  id: string;
  code: string;
  status: KbArticleStatusEnum;
}

export interface TicketKbReferenceDTO {
  id: string;
  ticketId: string;
  kbArticleId: string;
  kbArticleCode: string;
  kbArticleTitle?: string | null;
  referencedByUserId: string;
  referenceType: KbReferenceTypeEnum;
  note?: string | null;
  createdAt: string;
}

// GET /api/knowledge-base/{id}/usage-stats — stats broken down by KbReferenceTypeEnum.
export interface KbUsageByTypeDTO {
  consultedDuringResolve: number;
  providedToCustomer: number;
  generatedAfterResolve: number;
}

export interface KbUsageStatsDTO {
  kbArticleId: string;
  kbArticleCode: string;
  kbArticleTitle: string;
  totalReferences: number;
  byType: KbUsageByTypeDTO;
}

// ── Payloads ──

export interface CreateKbArticlePayload {
  category: TicketCategoryEnum;
  title: string;
  content: string;
  tags?: string[];
  isInternalOnly: boolean;
  /**
   * Mark the article as a template so Staff can copy-template it.
   * Defaults to false on the BE.
   */
  isTemplate?: boolean;
}

export interface UpdateKbArticlePayload extends CreateKbArticlePayload {
  changeDescription?: string;
}

export interface RejectReviewPayload {
  reason: string;
}

export interface RollbackPayload {
  toVersionId: string;
}

export interface AddTicketKbReferencePayload {
  ticketId: string;
  kbArticleId: string;
  referenceType: KbReferenceTypeEnum;
  note?: string;
}

// ── Params ──

export interface KbArticleListParams {
  pageNumber?: number;
  pageSize?: number;
  q?: string;
  category?: number; // int — the BE filter takes a number
  status?: KbArticleStatusEnum;
  tag?: string; // one tag at a time
  sortBy?: string;
  sortDir?: string;
}

export interface KbCompareParams {
  fromVersionId: string;
  toVersionId?: string;
}

// The suggest API returns its own DTO (no category/status)
export interface KbSuggestItemDTO {
  id: string;
  code: string;
  title: string;
  content: string;
  helpfulCount: number;
  viewCount: number;
  /**
   * GH-132 (G) — internal-only article: must not be attached with
   * referenceType ProvidedToCustomer.
   */
  isInternalOnly: boolean;
}

export interface KbSuggestParams {
  ticketId: string;
}
