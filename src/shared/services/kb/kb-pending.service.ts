import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import {
  KbArticleStatusCode,
  type KbArticleStatusEnum,
} from "@/shared/enums/kb/kb.enum";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type { KbArticleSummaryDTO } from "@/shared/types/kb/kb.types";

/**
 * Count-only read of the KB list, for the sidebar badges. Lives in shared/ rather than in
 * each role's kb.service because GET /api/knowledge-base is open to Staff, Manager and
 * Admin alike — three copies of one query would drift.
 *
 * `Status` goes out as an int (KbArticleStatusCode), matching the BE filter; the response
 * carries it back as a string. Sending the string name instead makes the BE fail to bind
 * it and silently return EVERY article, so the count would be wrong rather than empty.
 *
 * PageSize 1 keeps the payload to a single row — only `totalItems` is read.
 */
export const kbPendingService = {
  countByStatus: (status: KbArticleStatusEnum) =>
    axiosInstance.get<CommonResponse<PaginationResponse<KbArticleSummaryDTO>>>(
      ENDPOINTS.KNOWLEDGE_BASE.LIST,
      {
        params: {
          PageNumber: 1,
          PageSize: 1,
          Status: KbArticleStatusCode[status],
        },
      },
    ),
};
