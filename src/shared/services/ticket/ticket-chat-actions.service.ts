import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import type {
  UpdateChatPayload,
  ChatMarkReadPayload,
  ChatTranslateDTO,
  ChatVoiceActionDTO,
  ChatSuggestPayload,
  ChatSuggestDTO,
  ChatSentimentCheckDTO,
  ChatSummarizeDTO,
} from "@/shared/types/chat/chat.types";
import { fileStorageService } from "@/shared/services/file/file-storage.service";
import { FilePurposeEnum } from "@/shared/types/file/file-storage.types";

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
  // Số chat CHƯA ĐỌC của chính user trong 1 ticket (badge tab "Bình luận").
  // BE loại chat do chính mình viết + lọc chat internal theo quyền.
  getUnreadCount: (ticketId: string) =>
    axiosInstance.get<CommonResponse<number>>(
      ENDPOINTS.TICKETS.CHAT_UNREAD_COUNT(ticketId),
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
  // Voice chat (2 bước): 1) upload file audio lên FileStorage → lấy metadata,
  // 2) POST metadata (ChatAttachmentInput) xuống /chats/voice → BE tạo chat placeholder
  // rồi transcribe async. Endpoint KHÔNG còn nhận multipart audio trực tiếp.
  transcribeVoice: async (ticketId: string, audioFile: File) => {
    const upload = await fileStorageService.uploadFile({
      file: audioFile,
      purpose: FilePurposeEnum.TicketAttachment,
    });
    const meta = upload.data.data;
    if (!meta?.fileId || !meta.publicUrl) {
      // BE ChatVoiceTranscribeCommand validate `Url` là bắt buộc — thiếu publicUrl thì bước 2
      // chắc chắn 400. Chặn sớm với thông báo rõ thay vì để lỗi mơ hồ từ /chats/voice.
      throw new Error("Upload audio thất bại — vui lòng ghi âm và gửi lại.");
    }
    // Body khớp ChatVoiceTranscribeCommand của BE (Swagger): metadata + `url` = publicUrl file
    // vừa upload để BE fetch audio khi transcribe async.
    return axiosInstance.post<CommonResponse<ChatVoiceActionDTO>>(
      ENDPOINTS.TICKETS.CHAT_VOICE(ticketId),
      {
        fileId: meta.fileId,
        fileName: meta.fileName,
        contentType: meta.contentType,
        sizeBytes: meta.size,
        url: meta.publicUrl,
      },
    );
  },
  // Retry transcribe cho chat thoại đã Failed — không upload lại, BE dùng audio cũ.
  // 202 Accepted; không body.
  retryVoice: (ticketId: string, chatId: string) =>
    axiosInstance.post<CommonResponse<void>>(
      ENDPOINTS.TICKETS.CHAT_VOICE_RETRY(ticketId, chatId),
      null,
    ),

  // ── GH-133 Nhóm C ──────────────────────────────────────────────────────
  // C2 (AI) — Staff/Manager/Admin. Gemini 429 → BE trả isSuccess:false (không throw).
  suggest: (ticketId: string, payload: ChatSuggestPayload) =>
    axiosInstance.post<CommonResponse<ChatSuggestDTO>>(
      ENDPOINTS.TICKETS.CHAT_SUGGEST(ticketId),
      payload,
    ),
  sentimentCheck: (ticketId: string) =>
    axiosInstance.post<CommonResponse<ChatSentimentCheckDTO>>(
      ENDPOINTS.TICKETS.CHAT_SENTIMENT(ticketId),
      null,
    ),
  summarize: (ticketId: string) =>
    axiosInstance.post<CommonResponse<ChatSummarizeDTO>>(
      ENDPOINTS.TICKETS.CHAT_SUMMARIZE(ticketId),
      null,
    ),
  // C2 — export PDF: BE trả application/pdf (blob), không phải CommonResponse.
  exportPdf: (ticketId: string) =>
    axiosInstance.get<Blob>(ENDPOINTS.TICKETS.CHAT_EXPORT_PDF(ticketId), {
      responseType: "blob",
    }),
  // C3 — download attachment: 200 (url) · 202 (đang scan) · 451 (nhiễm virus).
  // Trả nguyên AxiosResponse để hook đọc status; 451 (4xx) axios sẽ throw → hook catch.
  downloadAttachment: (
    ticketId: string,
    chatId: string,
    attachmentId: string,
  ) =>
    axiosInstance.get<CommonResponse<string>>(
      ENDPOINTS.TICKETS.CHAT_ATTACHMENT_DOWNLOAD(
        ticketId,
        chatId,
        attachmentId,
      ),
    ),
};
