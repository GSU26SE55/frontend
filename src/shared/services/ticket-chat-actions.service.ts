import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import type {
  UpdateChatPayload,
  ChatMarkReadPayload,
  ChatTranslateDTO,
  ChatVoiceActionDTO,
} from "@/shared/types/chat.types";

// Edit/Delete/Mark-read/Translate/Voice cho ticket chat — dùng chung staff & manager.
// Cùng endpoint /api/tickets/{id}/chats mà staff/manager đã gọi để list/add comment.
export const ticketChatActionsService = {
  update: (ticketId: string, chatId: string, payload: UpdateChatPayload) =>
    axiosInstance.put<CommonResponse<void>>(
      ENDPOINTS.TICKETS.CHAT_DETAIL(ticketId, chatId),
      payload,
    ),
  remove: (ticketId: string, chatId: string, reason?: string) =>
    axiosInstance.delete<CommonResponse<void>>(
      ENDPOINTS.TICKETS.CHAT_DETAIL(ticketId, chatId),
      { data: reason ? { reason } : undefined },
    ),
  markRead: (ticketId: string, payload: ChatMarkReadPayload) =>
    axiosInstance.post<CommonResponse<void>>(
      ENDPOINTS.TICKETS.CHAT_MARK_READ(ticketId),
      payload,
    ),
  translate: (ticketId: string, chatId: string, targetLanguage: string) =>
    axiosInstance.post<CommonResponse<ChatTranslateDTO>>(
      ENDPOINTS.TICKETS.CHAT_TRANSLATE(ticketId, chatId),
      null,
      { params: { to: targetLanguage } },
    ),
  transcribeVoice: (ticketId: string, audioFile: File) => {
    const form = new FormData();
    form.append("AudioFile", audioFile);
    return axiosInstance.post<CommonResponse<ChatVoiceActionDTO>>(
      ENDPOINTS.TICKETS.CHAT_VOICE(ticketId),
      form,
      { headers: { "Content-Type": undefined } },
    );
  },
};
