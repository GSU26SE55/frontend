/** Khớp `TicketAttachmentDTO` của TicketService. */
export interface TicketAttachmentDTO {
  id: string;
  ticketId: string;
  chatId?: string | null;
  uploadedByUserId: string;
  fileId: string;
  fileName: string;
  /** MIME — lọc ảnh bằng tiền tố "image/". */
  contentType: string;
  sizeBytes: number;
  source: string;
  thumbnailUrl?: string | null;
  isInline: boolean;
  downloadCount: number;
  createdAt?: string;
}

export function isImageAttachment(a: TicketAttachmentDTO): boolean {
  return a.contentType?.toLowerCase().startsWith("image/") ?? false;
}
