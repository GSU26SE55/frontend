export {
  KbArticleStatusEnum,
  KbArticleStatusLabel,
  KbReferenceTypeEnum,
  KbReferenceTypeLabel,
} from "@/shared/enums/kb.enum";

import type {
  KbArticleStatusEnum,
  KbReferenceTypeEnum,
} from "@/shared/enums/kb.enum";

// ── DTOs ──

export interface KbArticleDTO {
  id: string;
  code: string;
  category: number;
  title: string;
  symptoms: string;
  diagnosisSteps: string;
  solutionSteps: string;
  recommendedParts?: string | null;
  tags: string[];
  status: KbArticleStatusEnum;
  version: number;
  viewCount: number;
  helpfulCount: number;
  createdByUserId: string;
  createdByFullName?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface KbArticleSummaryDTO {
  id: string;
  code: string;
  title: string;
  category: number;
  status: KbArticleStatusEnum;
  tags: string[];
  viewCount: number;
  helpfulCount: number;
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

// ── Payloads ──

export interface CreateKbArticlePayload {
  category: number;
  title: string;
  symptoms: string;
  diagnosisSteps: string;
  solutionSteps: string;
  recommendedParts?: string;
  tags?: string[];
}

export interface UpdateKbArticlePayload extends CreateKbArticlePayload {}

export interface AddTicketKbReferencePayload {
  kbArticleId: string;
  referenceType: KbReferenceTypeEnum;
  note?: string;
}

// ── Params ──

export interface KbArticleListParams {
  pageNumber?: number;
  pageSize?: number;
  keyword?: string;
  category?: number;
  status?: KbArticleStatusEnum;
  sortBy?: string;
  isDescending?: boolean;
}
