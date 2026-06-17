import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import { KbArticleStatusCode } from "@/shared/enums/kb.enum";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type {
  KbArticleDTO,
  KbArticleSummaryDTO,
  KbArticleVersionDTO,
  KbArticleDiffDTO,
  KbArticleTemplateDTO,
  KbArticleActionDTO,
  KbArticleListParams,
  KbCompareParams,
  CreateKbArticlePayload,
  UpdateKbArticlePayload,
} from "@/shared/types/kb.types";

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
  };
}

// Staff: read + authoring (KHÔNG có workflow approve/publish/archive/rollback)
export const staffKbService = {
  getList: (params?: KbArticleListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<KbArticleSummaryDTO>>>(
      ENDPOINTS.KNOWLEDGE_BASE.LIST,
      { params: toListQuery(params) },
    ),
  getDetail: (id: string) =>
    axiosInstance.get<CommonResponse<KbArticleDTO>>(
      ENDPOINTS.KNOWLEDGE_BASE.DETAIL(id),
    ),
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
  copyTemplate: (id: string) =>
    axiosInstance.get<CommonResponse<KbArticleTemplateDTO>>(
      ENDPOINTS.KB_INTERNAL.COPY_TEMPLATE(id),
    ),
};
