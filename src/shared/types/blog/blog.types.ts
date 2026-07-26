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

// ── DTOs (khớp contract BE — enum status/origin dạng STRING) ──

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

// List item — KHÔNG có contentHtml
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

// Diff CHỈ so sánh contentHtml — không có per-field như KB
export interface BlogDiffDTO {
  oldVersionNumber: number;
  newVersionNumber: number;
  oldContentHtml: string;
  newContentHtml: string;
}

// Payload nhẹ trả về sau các action (create/update/publish/archive/delete/generate)
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
// ⚠️ Blog dùng `Page`, KB dùng `PageNumber` — response cả hai đều trả `pageNumber`.

export interface BlogPostListParams {
  status?: BlogPostStatusEnum;
  origin?: BlogPostOriginEnum;
  page?: number;
  pageSize?: number;
}

export interface BlogTemplateListParams {
  isActive?: boolean;
}

// ⚠️ Compare dùng SỐ version (khác KB dùng Guid versionId)
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
  // Optimistic concurrency — phải khớp BlogPost.currentVersion trong DB, lệch → 409
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
