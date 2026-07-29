import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import { KbArticleStatusCode } from "@/shared/enums/kb/kb.enum";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type {
  KbArticleDTO,
  KbArticleSummaryDTO,
  KbArticleVersionDTO,
  KbArticleDiffDTO,
  KbArticleActionDTO,
  KbArticleListParams,
  KbCompareParams,
  KbSuggestItemDTO,
  CreateKbArticlePayload,
  UpdateKbArticlePayload,
  RejectReviewPayload,
  RollbackPayload,
} from "@/shared/types/kb/kb.types";

// Map params FE → query BE (Status enum string → int)
function toListQuery(params?: KbArticleListParams) {
  if (!params) return undefined;
  return {
    PageNumber: params.pageNumber,
    PageSize: params.pageSize,
    Q: params.q,
    Category: params.category,
    Status:
      params.status !== undefined
        ? KbArticleStatusCode[params.status]
        : undefined,
    Tag: params.tag,
    SortBy: params.sortBy,
    SortDir: params.sortDir,
  };
}

export const managerKbService = {
  // ── Read (mọi role đã đăng nhập) ──
  getList: (params?: KbArticleListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<KbArticleSummaryDTO>>>(
      ENDPOINTS.KNOWLEDGE_BASE.LIST,
      { params: toListQuery(params) },
    ),
  getDetail: (id: string) =>
    axiosInstance.get<CommonResponse<KbArticleDTO>>(
      ENDPOINTS.KNOWLEDGE_BASE.DETAIL(id),
    ),
  markHelpful: (id: string) =>
    axiosInstance.post<CommonResponse<void>>(
      ENDPOINTS.KNOWLEDGE_BASE.HELPFUL(id),
    ),
  suggest: (ticketId: string) =>
    axiosInstance.get<CommonResponse<KbSuggestItemDTO[]>>(
      ENDPOINTS.KNOWLEDGE_BASE.SUGGEST,
      { params: { TicketId: ticketId } },
    ),

  // ── Authoring (Staff/Manager/Admin) ──
  create: (payload: CreateKbArticlePayload) =>
    axiosInstance.post<CommonResponse<KbArticleActionDTO>>(
      ENDPOINTS.KB_INTERNAL.CREATE,
      payload,
    ),
  update: (id: string, payload: UpdateKbArticlePayload) =>
    axiosInstance.put<CommonResponse<KbArticleDTO>>(
      ENDPOINTS.KB_INTERNAL.UPDATE(id),
      payload,
    ),
  getVersions: (id: string) =>
    axiosInstance.get<CommonResponse<KbArticleVersionDTO[]>>(
      ENDPOINTS.KB_INTERNAL.VERSIONS(id),
    ),
  getVersionById: (id: string, versionId: string) =>
    axiosInstance.get<CommonResponse<KbArticleVersionDTO>>(
      ENDPOINTS.KB_INTERNAL.VERSION_DETAIL(id, versionId),
    ),
  compare: (id: string, params: KbCompareParams) =>
    axiosInstance.get<CommonResponse<KbArticleDiffDTO>>(
      ENDPOINTS.KB_INTERNAL.COMPARE(id),
      {
        params: {
          FromVersionId: params.fromVersionId,
          ToVersionId: params.toVersionId,
        },
      },
    ),
  // Sao chép bài KB có sẵn → tạo bản mới (title "_copy", Draft), trả Id.
  duplicate: (id: string) =>
    axiosInstance.post<CommonResponse<KbArticleActionDTO>>(
      ENDPOINTS.KB_INTERNAL.DUPLICATE(id),
    ),

  // ── Workflow (Manager/Admin) ──
  approveReview: (id: string) =>
    axiosInstance.post<CommonResponse<KbArticleActionDTO>>(
      ENDPOINTS.KB_ADMIN.APPROVE_REVIEW(id),
    ),
  rejectReview: (id: string, payload: RejectReviewPayload) =>
    axiosInstance.post<CommonResponse<KbArticleActionDTO>>(
      ENDPOINTS.KB_ADMIN.REJECT_REVIEW(id),
      payload,
    ),
  publish: (id: string) =>
    axiosInstance.post<CommonResponse<KbArticleActionDTO>>(
      ENDPOINTS.KB_ADMIN.PUBLISH(id),
    ),
  archive: (id: string) =>
    axiosInstance.post<CommonResponse<KbArticleActionDTO>>(
      ENDPOINTS.KB_ADMIN.ARCHIVE(id),
    ),
  rollback: (id: string, payload: RollbackPayload) =>
    axiosInstance.post<CommonResponse<KbArticleActionDTO>>(
      ENDPOINTS.KB_ADMIN.ROLLBACK(id),
      payload,
    ),
};
