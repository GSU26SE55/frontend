// TODO: Replace mock with real API when BE is ready
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type {
  KbArticleDTO,
  KbArticleSummaryDTO,
  KbArticleListParams,
} from "@/shared/types/kb.types";
import { MOCK_KB_ARTICLES } from "@/shared/mocks/kb.mock";

function delay<T>(data: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

function ok<T>(data: T): CommonResponse<T> {
  return { isSuccess: true, data, listErrors: [] };
}

export const staffKbService = {
  getList: (params?: KbArticleListParams) => {
    let items = MOCK_KB_ARTICLES.map(
      ({ id, code, title, category, status, tags, viewCount, helpfulCount }) =>
        ({
          id,
          code,
          title,
          category,
          status,
          tags,
          viewCount,
          helpfulCount,
        }) as KbArticleSummaryDTO,
    );

    if (params?.status !== undefined)
      items = items.filter((a) => a.status === params.status);
    if (params?.keyword) {
      const kw = params.keyword.toLowerCase();
      items = items.filter(
        (a) =>
          a.title.toLowerCase().includes(kw) ||
          a.code.toLowerCase().includes(kw),
      );
    }

    const pageNumber = params?.pageNumber ?? 1;
    const pageSize = params?.pageSize ?? 10;
    const totalItems = items.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const start = (pageNumber - 1) * pageSize;
    const paged = items.slice(start, start + pageSize);

    return delay(
      ok<PaginationResponse<KbArticleSummaryDTO>>({
        items: paged,
        totalItems,
        pageNumber,
        pageSize,
        totalPages,
        hasNextPage: pageNumber < totalPages,
        hasPreviousPage: pageNumber > 1,
      }),
    );
  },

  getDetail: (id: string) => {
    const article = MOCK_KB_ARTICLES.find((a) => a.id === id) ?? null;
    return delay(ok(article as KbArticleDTO));
  },
};
