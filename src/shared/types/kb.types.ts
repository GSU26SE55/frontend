export {
  KbArticleStatusEnum,
  KbArticleStatusLabel,
  KbArticleStatusCode,
  KbVersionStatusEnum,
  KbVersionStatusLabel,
  KbReferenceTypeEnum,
  KbReferenceTypeLabel,
} from "@/shared/enums/kb.enum";

import type {
  KbArticleStatusEnum,
  KbReferenceTypeEnum,
} from "@/shared/enums/kb.enum";
import type { TicketCategoryEnum } from "@/shared/enums/ticket.enum";

// ── DTOs (khớp contract BE — enum status/category dạng STRING) ──

export interface KbArticleDTO {
  id: string;
  code: string;
  category: TicketCategoryEnum;
  title: string;
  symptoms: string;
  diagnosisSteps: string;
  solutionSteps: string;
  recommendedParts?: string[] | null;
  tags: string[];
  status: KbArticleStatusEnum;
  isInternalOnly: boolean;
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

// List item (GET /api/knowledge-base) — KHÔNG có tags/symptoms
export interface KbArticleSummaryDTO {
  id: string;
  code: string;
  title: string;
  category: TicketCategoryEnum;
  status: KbArticleStatusEnum;
  viewCount: number;
  helpfulCount: number;
  reviewRequired: boolean;
  createdAt: string;
}

// Version (status là SỐ — BE để raw int)
export interface KbArticleVersionDTO {
  id: string;
  articleId: string;
  majorVersion: number;
  minorVersion: number;
  status: number;
  title: string;
  symptoms: string;
  diagnosisSteps: string;
  solutionSteps: string;
  recommendedParts?: string[] | null;
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
  symptomsDiff: DiffSection;
  diagnosisStepsDiff: DiffSection;
  solutionStepsDiff: DiffSection;
  recommendedPartsDiff: DiffSection;
  tagsDiff: DiffSection;
}

// copy-template (category là SỐ raw int)
export interface KbArticleTemplateDTO {
  category: number;
  symptoms: string;
  diagnosisSteps: string;
  solutionSteps: string;
  recommendedParts?: string[] | null;
  tags: string[];
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

// GET /api/knowledge-base/{id}/usage-stats — thống kê theo KbReferenceTypeEnum.
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
  symptoms: string;
  diagnosisSteps: string;
  solutionSteps: string;
  recommendedParts?: string[];
  tags?: string[];
  isInternalOnly: boolean;
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
  category?: number; // int — BE filter nhận số
  status?: KbArticleStatusEnum;
  tag?: string; // 1 tag/lần
}

export interface KbCompareParams {
  fromVersionId: string;
  toVersionId?: string;
}

// Suggest API trả DTO riêng (không có category/status)
export interface KbSuggestItemDTO {
  id: string;
  code: string;
  title: string;
  symptoms: string;
  helpfulCount: number;
  viewCount: number;
}

export interface KbSuggestParams {
  ticketId: string;
}
