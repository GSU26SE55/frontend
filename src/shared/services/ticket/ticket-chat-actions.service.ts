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
  ChatSummarizeDTO,
} from "@/shared/types/chat/chat.types";
import { fileStorageService } from "@/shared/services/file/file-storage.service";
import { FilePurposeEnum } from "@/shared/types/file/file-storage.types";

// Edit/Delete/Mark-read/Translate/Voice for ticket chat — shared by staff & manager.
// Same endpoint /api/tickets/{id}/chats that staff/manager already call to list/add comments.
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
  // Number of UNREAD chats for the current user in 1 ticket (the "Comments" tab badge).
  // The BE excludes chats written by the user themself + filters internal chats by permission.
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
  // Voice chat (2 steps): 1) upload the audio file to FileStorage → get metadata,
  // 2) POST the metadata (ChatAttachmentInput) to /chats/voice → BE creates a chat placeholder
  // then transcribes async. The endpoint no longer accepts multipart audio directly.
  transcribeVoice: async (ticketId: string, audioFile: File) => {
    const upload = await fileStorageService.uploadFile({
      file: audioFile,
      purpose: FilePurposeEnum.TicketAttachment,
    });
    const meta = upload.data.data;
    if (!meta?.fileId) {
      throw new Error("Audio upload failed — please record again and resend.");
    }
    // Body matches the BE's ChatVoiceTranscribeCommand (Swagger). `url` is REQUIRED by the
    // BE's validation, but is only stored as metadata on TicketAttachment.Url — the actual
    // transcription is done by VoiceTranscriptionRequestedConsumer, which fetches the audio
    // over internal gRPC by `fileId`, not through this string.
    //
    // GH-788 — so this must NOT be blocked when publicUrl is null. The object bucket is
    // private and PublicBaseUrl is left empty in every environment ⇒ publicUrl is always
    // null ⇒ the old code threw right here and the voice recording feature never worked at
    // all. Falling back to the permission-checked download path, matching the convention
    // mobile already uses for regular attachments.
    return axiosInstance.post<CommonResponse<ChatVoiceActionDTO>>(
      ENDPOINTS.TICKETS.CHAT_VOICE(ticketId),
      {
        fileId: meta.fileId,
        fileName: meta.fileName,
        contentType: meta.contentType,
        sizeBytes: meta.size,
        url: meta.publicUrl ?? ENDPOINTS.FILES.DOWNLOAD(meta.fileId),
      },
    );
  },
  // Retry transcribe for a voice chat that already Failed — no re-upload, the BE reuses the old audio.
  // 202 Accepted; no body.
  retryVoice: (ticketId: string, chatId: string) =>
    axiosInstance.post<CommonResponse<void>>(
      ENDPOINTS.TICKETS.CHAT_VOICE_RETRY(ticketId, chatId),
      null,
    ),

  // ── GH-133 Group C ─────────────────────────────────────────────────────
  // C2 (AI) — Staff/Manager/Admin. Gemini 429 → BE returns isSuccess:false (doesn't throw).
  suggest: (ticketId: string, payload: ChatSuggestPayload) =>
    axiosInstance.post<CommonResponse<ChatSuggestDTO>>(
      ENDPOINTS.TICKETS.CHAT_SUGGEST(ticketId),
      payload,
    ),
  summarize: (ticketId: string) =>
    axiosInstance.post<CommonResponse<ChatSummarizeDTO>>(
      ENDPOINTS.TICKETS.CHAT_SUMMARIZE(ticketId),
      null,
    ),
  // C3 — download attachment: 200 (url) · 202 (scanning) · 451 (infected).
  // Returns the raw AxiosResponse so the hook can read the status; 451 (4xx) axios will throw → hook catches it.
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
