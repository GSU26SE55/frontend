// TODO: Replace mock with real API when BE is ready
// import axiosInstance from "@/shared/lib/axios";
// import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type {
  KbArticleDTO,
  KbArticleSummaryDTO,
  KbArticleListParams,
  CreateKbArticlePayload,
  UpdateKbArticlePayload,
} from "@/shared/types/kb.types";
import { MOCK_KB_ARTICLES } from "@/shared/mocks/kb.mock";
import { KbArticleStatusEnum } from "@/shared/enums/kb.enum";

let mockArticles = [...MOCK_KB_ARTICLES];

function delay<T>(data: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

function ok<T>(data: T): CommonResponse<T> {
  return { isSuccess: true, data, listErrors: [] };
}

export const adminKbService = {
  getList: (params?: KbArticleListParams) => {
    let items = mockArticles.map(
      ({ id, code, title, category, status, tags, viewCount, helpfulCount }) =>
        ({ id, code, title, category, status, tags, viewCount, helpfulCount }) as KbArticleSummaryDTO,
    );

    if (params?.status !== undefined) items = items.filter((a) => a.status === params.status);
    if (params?.keyword) {
      const kw = params.keyword.toLowerCase();
      items = items.filter(
        (a) => a.title.toLowerCase().includes(kw) || a.code.toLowerCase().includes(kw),
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
    const article = mockArticles.find((a) => a.id === id) ?? null;
    return delay(ok(article as KbArticleDTO));
  },

  create: (payload: CreateKbArticlePayload) => {
    const newArticle: KbArticleDTO = {
      id: `kb-${Date.now()}`,
      code: `KB-${String(mockArticles.length + 1).padStart(4, "0")}`,
      ...payload,
      recommendedParts: payload.recommendedParts ?? null,
      tags: payload.tags ?? [],
      status: KbArticleStatusEnum.Draft,
      version: 1,
      viewCount: 0,
      helpfulCount: 0,
      createdByUserId: "current-user",
      createdByFullName: "Current User",
      createdAt: new Date().toISOString(),
      updatedAt: null,
    };
    mockArticles.unshift(newArticle);
    return delay(ok(newArticle));
  },

  update: (id: string, payload: UpdateKbArticlePayload) => {
    const idx = mockArticles.findIndex((a) => a.id === id);
    if (idx >= 0) {
      mockArticles[idx] = {
        ...mockArticles[idx],
        ...payload,
        updatedAt: new Date().toISOString(),
      };
    }
    return delay(ok(mockArticles[idx] ?? null as unknown as KbArticleDTO));
  },

  delete: (id: string) => {
    mockArticles = mockArticles.filter((a) => a.id !== id);
    return delay(ok(null));
  },

  publish: (id: string) => {
    const article = mockArticles.find((a) => a.id === id);
    if (article) article.status = KbArticleStatusEnum.Published;
    return delay(ok(article as KbArticleDTO));
  },

  archive: (id: string) => {
    const article = mockArticles.find((a) => a.id === id);
    if (article) article.status = KbArticleStatusEnum.Archived;
    return delay(ok(article as KbArticleDTO));
  },
};
