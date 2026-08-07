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

// Map params FE → query BE.
// `GetBlogPostListQuery` kế thừa `PaginationRequest` → param đúng là `PageNumber`,
// giống KB. Trước đây gửi `Page` nên BE không bind được, luôn rơi về mặc định
// trang 1 (phân trang blog thực chất không hoạt động).
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
 * Service Blog dùng chung cho cả 3 role — KHÔNG chứa logic phân quyền.
 * Quyền gọi endpoint nào do hook per-role quyết định; BE vẫn chặn bằng [Authorize].
 */
export const blogService = {
  // ── Public (chỉ bài Published) ──
  getPublicList: (params?: BlogPostListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<BlogPostListItemDTO>>>(
      ENDPOINTS.BLOG.LIST,
      { params: toListQuery(params) },
    ),

  getPublicDetail: (id: string) =>
    axiosInstance.get<CommonResponse<BlogPostDTO>>(ENDPOINTS.BLOG.DETAIL(id)),

  // ── Internal (Staff/Manager/Admin — mọi trạng thái) ──
  getList: (params?: BlogPostListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<BlogPostListItemDTO>>>(
      ENDPOINTS.BLOG_INTERNAL.LIST,
      { params: toListQuery(params) },
    ),

  /** Dùng để POLL trạng thái Generating — public detail trả 404 khi chưa publish. */
  getDetail: (id: string) =>
    axiosInstance.get<CommonResponse<BlogPostDTO>>(
      ENDPOINTS.BLOG_INTERNAL.DETAIL(id),
    ),

  create: (payload: CreateBlogPostPayload) =>
    axiosInstance.post<CommonResponse<BlogPostActionDTO>>(
      ENDPOINTS.BLOG_INTERNAL.CREATE,
      payload,
    ),

  /** `currentVersion` phải khớp giá trị trong DB, lệch → 409. */
  update: (id: string, payload: UpdateBlogPostPayload) =>
    axiosInstance.put<CommonResponse<BlogPostActionDTO>>(
      ENDPOINTS.BLOG_INTERNAL.UPDATE(id),
      payload,
    ),

  getVersions: (id: string) =>
    axiosInstance.get<CommonResponse<BlogPostVersionDTO[]>>(
      ENDPOINTS.BLOG_INTERNAL.VERSIONS(id),
    ),

  /** ⚠️ Compare dùng SỐ version (KB dùng Guid versionId). */
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

  // ── Blog templates: đọc (Staff+) ──
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
  /** Async — trả 202, bài ở trạng thái Generating. Poll bằng getDetail(). */
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

  // ── Blog templates: ghi (chỉ Admin) ──
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
