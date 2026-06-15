// TODO: Replace mock with real API when BE is ready
import type { CommonResponse } from "@/shared/types/api.types";
import type {
  TicketKbReferenceDTO,
  AddTicketKbReferencePayload,
} from "@/shared/types/kb.types";
import { MOCK_TICKET_KB_REFS, MOCK_KB_ARTICLES } from "@/shared/mocks/kb.mock";

let mockRefs = [...MOCK_TICKET_KB_REFS];

function delay<T>(data: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

function ok<T>(data: T): CommonResponse<T> {
  return { isSuccess: true, data, listErrors: [] };
}

export const ticketKbService = {
  list: (ticketId: string) => {
    const refs = mockRefs.filter((r) => r.ticketId === ticketId);
    return delay(ok(refs));
  },

  add: (ticketId: string, payload: AddTicketKbReferencePayload) => {
    const article = MOCK_KB_ARTICLES.find((a) => a.id === payload.kbArticleId);
    const newRef: TicketKbReferenceDTO = {
      id: `ref-${Date.now()}`,
      ticketId,
      kbArticleId: payload.kbArticleId,
      kbArticleCode: article?.code ?? "KB-????",
      kbArticleTitle: article?.title ?? null,
      referencedByUserId: "current-user",
      referenceType: payload.referenceType,
      note: payload.note ?? null,
      createdAt: new Date().toISOString(),
    };
    mockRefs.push(newRef);
    return delay(ok(newRef));
  },

  remove: (_ticketId: string, refId: string) => {
    mockRefs = mockRefs.filter((r) => r.id !== refId);
    return delay(ok(null));
  },
};
