export {
  BlogPostStatusEnum,
  BlogPostStatusLabel,
  BlogPostOriginEnum,
  BlogPostOriginLabel,
} from "@/shared/enums/blog/blog.enum";

import type {
  BlogPostStatusEnum,
  BlogPostOriginEnum,
} from "@/shared/enums/blog/blog.enum";

// ── DTOs (match the BE contract — status/origin enums come as STRINGS) ──

export interface BlogPostDTO {
  id: string;
  title: string;
  slug: string;
  summary: string;
  contentHtml: string;
  status: BlogPostStatusEnum;
  origin: BlogPostOriginEnum;
  sourceKbArticleId?: string | null;
  blogTemplateId?: string | null;
  authorUserId: string;
  currentVersion: number;
  createdAt: string;
  updatedAt?: string | null;
}

// List item — does NOT include contentHtml
export interface BlogPostListItemDTO {
  id: string;
  title: string;
  slug: string;
  summary: string;
  status: BlogPostStatusEnum;
  origin: BlogPostOriginEnum;
  authorUserId: string;
  currentVersion: number;
  createdAt: string;
  updatedAt?: string | null;
}

export interface BlogPostVersionDTO {
  id: string;
  blogPostId: string;
  versionNumber: number;
  title: string;
  summary: string;
  contentHtml: string;
  changedByUserId: string;
  changeNote?: string | null;
  createdAt: string;
}

// The diff compares contentHtml ONLY — no per-field diff like the KB has
export interface BlogDiffDTO {
  oldVersionNumber: number;
  newVersionNumber: number;
  oldContentHtml: string;
  newContentHtml: string;
}

// Lightweight payload returned by actions (create/update/publish/archive/delete/generate)
export interface BlogPostActionDTO {
  id: string;
  title: string;
  status: BlogPostStatusEnum;
  currentVersion: number;
}

export interface BlogTemplateDTO {
  id: string;
  name: string;
  description: string;
  contentHtml: string;
  isActive: boolean;
  createdByUserId: string;
  createdAt: string;
  updatedAt?: string | null;
}

// ── Query params ──
// ⚠️ Blog uses `Page`, the KB uses `PageNumber` — but both responses return `pageNumber`.

export interface BlogPostListParams {
  status?: BlogPostStatusEnum;
  origin?: BlogPostOriginEnum;
  page?: number;
  pageSize?: number;
  /** Search keyword matched against title / summary — filtered by the BE, not the client. */
  q?: string;
}

export interface BlogTemplateListParams {
  isActive?: boolean;
}

// ⚠️ Compare uses the version NUMBER (unlike the KB, which uses a Guid versionId)
export interface BlogCompareParams {
  oldVersionNumber: number;
  newVersionNumber: number;
}

// ── Payloads ──

export interface CreateBlogPostPayload {
  title: string;
  slug: string;
  summary: string;
  contentHtml: string;
  blogTemplateId?: string;
}

export interface UpdateBlogPostPayload extends CreateBlogPostPayload {
  changeNote?: string;
  // Optimistic concurrency — must match BlogPost.currentVersion in the DB; a mismatch → 409
  currentVersion: number;
}

export interface CreateBlogTemplatePayload {
  name: string;
  description?: string;
  contentHtml: string;
}

export interface UpdateBlogTemplatePayload extends CreateBlogTemplatePayload {
  isActive: boolean;
}
