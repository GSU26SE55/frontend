import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type {
  BlogPostDTO,
  BlogPostListItemDTO,
  BlogPostVersionDTO,
  BlogDiffDTO,
  BlogPostActionDTO,
  BlogTemplateDTO,
  BlogPostListParams,
  BlogTemplateListParams,
  BlogCompareParams,
  CreateBlogPostPayload,
  UpdateBlogPostPayload,
  CreateBlogTemplatePayload,
  UpdateBlogTemplatePayload,
} from "@/shared/types/blog/blog.types";

// Map FE params → BE query.
// `GetBlogPostListQuery` extends `PaginationRequest` → the correct param is `PageNumber`,
// same as KB. It used to send `Page`, which the BE couldn't bind, so it always fell back
// to page 1 (blog pagination effectively didn't work).
function toListQuery(params?: BlogPostListParams) {
  if (!params) return undefined;
  return {
    Status: params.status,
    Origin: params.origin,
    PageNumber: params.page,
    PageSize: params.pageSize,
    Q: params.q?.trim() || undefined,
  };
}

/**
 * Blog service shared across all 3 roles — contains NO authorization logic.
 * Which endpoints a role can call is decided by the per-role hook; the BE still
 * enforces this via [Authorize].
 */
export const blogService = {
  // ── Public (Published posts only) ──
  getPublicList: (params?: BlogPostListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<BlogPostListItemDTO>>>(
      ENDPOINTS.BLOG.LIST,
      { params: toListQuery(params) },
    ),

  getPublicDetail: (id: string) =>
    axiosInstance.get<CommonResponse<BlogPostDTO>>(ENDPOINTS.BLOG.DETAIL(id)),

  // ── Internal (Staff/Manager/Admin — any status) ──
  getList: (params?: BlogPostListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<BlogPostListItemDTO>>>(
      ENDPOINTS.BLOG_INTERNAL.LIST,
      { params: toListQuery(params) },
    ),

  /** Used to POLL the Generating status — public detail returns 404 before it's published. */
  getDetail: (id: string) =>
    axiosInstance.get<CommonResponse<BlogPostDTO>>(
      ENDPOINTS.BLOG_INTERNAL.DETAIL(id),
    ),

  create: (payload: CreateBlogPostPayload) =>
    axiosInstance.post<CommonResponse<BlogPostActionDTO>>(
      ENDPOINTS.BLOG_INTERNAL.CREATE,
      payload,
    ),

  /** `currentVersion` must match the value in the DB — a mismatch returns 409. */
  update: (id: string, payload: UpdateBlogPostPayload) =>
    axiosInstance.put<CommonResponse<BlogPostActionDTO>>(
      ENDPOINTS.BLOG_INTERNAL.UPDATE(id),
      payload,
    ),

  getVersions: (id: string) =>
    axiosInstance.get<CommonResponse<BlogPostVersionDTO[]>>(
      ENDPOINTS.BLOG_INTERNAL.VERSIONS(id),
    ),

  /** ⚠️ Compare uses the version NUMBER (KB uses a Guid versionId). */
  compare: (id: string, params: BlogCompareParams) =>
    axiosInstance.get<CommonResponse<BlogDiffDTO>>(
      ENDPOINTS.BLOG_INTERNAL.COMPARE(id),
      {
        params: {
          OldVersionNumber: params.oldVersionNumber,
          NewVersionNumber: params.newVersionNumber,
        },
      },
    ),

  // ── Blog templates: read (Staff+) ──
  getTemplates: (params?: BlogTemplateListParams) =>
    axiosInstance.get<CommonResponse<BlogTemplateDTO[]>>(
      ENDPOINTS.BLOG_INTERNAL.TEMPLATES,
      { params: params ? { IsActive: params.isActive } : undefined },
    ),

  getTemplateDetail: (id: string) =>
    axiosInstance.get<CommonResponse<BlogTemplateDTO>>(
      ENDPOINTS.BLOG_INTERNAL.TEMPLATE_DETAIL(id),
    ),

  // ── Workflow (Manager/Admin) ──
  /** Async — returns 202, post is in the Generating status. Poll with getDetail(). */
  generateFromKb: (kbId: string) =>
    axiosInstance.post<CommonResponse<BlogPostActionDTO>>(
      ENDPOINTS.BLOG_ADMIN.GENERATE_FROM_KB(kbId),
    ),

  publish: (id: string) =>
    axiosInstance.post<CommonResponse<BlogPostActionDTO>>(
      ENDPOINTS.BLOG_ADMIN.PUBLISH(id),
    ),

  archive: (id: string) =>
    axiosInstance.post<CommonResponse<BlogPostActionDTO>>(
      ENDPOINTS.BLOG_ADMIN.ARCHIVE(id),
    ),

  remove: (id: string) =>
    axiosInstance.delete<CommonResponse<BlogPostActionDTO>>(
      ENDPOINTS.BLOG_ADMIN.DELETE(id),
    ),

  // ── Blog templates: write (Admin only) ──
  createTemplate: (payload: CreateBlogTemplatePayload) =>
    axiosInstance.post<CommonResponse<BlogTemplateDTO>>(
      ENDPOINTS.BLOG_TEMPLATES_ADMIN.CREATE,
      payload,
    ),

  updateTemplate: (id: string, payload: UpdateBlogTemplatePayload) =>
    axiosInstance.put<CommonResponse<BlogTemplateDTO>>(
      ENDPOINTS.BLOG_TEMPLATES_ADMIN.UPDATE(id),
      payload,
    ),

  removeTemplate: (id: string) =>
    axiosInstance.delete<CommonResponse<BlogTemplateDTO>>(
      ENDPOINTS.BLOG_TEMPLATES_ADMIN.DELETE(id),
    ),
};
