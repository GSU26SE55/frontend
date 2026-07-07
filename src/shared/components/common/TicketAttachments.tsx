import { useState } from "react";
import { Download } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import AuthImage from "@/shared/components/common/AuthImage";
import { useDownloadChatAttachment } from "@/shared/hooks/useTicketChatActions";

interface TicketAttachmentsProps {
  // BE trả về mảng FileId (string[]) — không kèm metadata (fileName/contentType).
  fileIds?: string[] | null;
  // Nhãn hiển thị phía trên lưới ảnh; truyền null/"" để ẩn nhãn. Mặc định "Ảnh đính kèm".
  label?: string | null;
  // Thumbnail nhỏ hơn cho ngữ cảnh inline (comment, nhật ký bảo trì).
  compact?: boolean;
  // GH-133 C3 — khi có đủ ticketId + chatId, hiện nút download qua endpoint chat-attachment
  // có virus-scan gating (200 url · 202 đang scan · 451 nhiễm). BE khớp {attachmentId} theo FileId.
  ticketId?: string;
  chatId?: string;
}

/**
 * Hiển thị ảnh đính kèm (ticket attachment, ảnh trong comment, ảnh bảo trì...).
 * Ảnh tải qua AuthImage (kèm Bearer). BE chỉ trả FileId nên hiển thị tất cả dạng ảnh;
 * AuthImage tự xử lý trường hợp file không phải ảnh (hiển thị fallback của nó).
 */
export default function TicketAttachments({
  fileIds,
  label = "Ảnh đính kèm",
  compact = false,
  ticketId,
  chatId,
}: TicketAttachmentsProps) {
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);
  const downloadM = useDownloadChatAttachment();
  // Narrow ticketId/chatId trong closure — tránh non-null assertion (eslint no-non-null-assertion).
  const handleDownload =
    ticketId && chatId
      ? (fileId: string) =>
          downloadM.mutate({ ticketId, chatId, attachmentId: fileId })
      : undefined;

  if (!fileIds || fileIds.length === 0) return null;

  const thumbCls = compact ? "h-16 w-16" : "h-24 w-24";

  return (
    <div>
      {label && <p className="text-muted-foreground text-sm mb-2">{label}</p>}
      <div className="flex flex-wrap gap-2">
        {fileIds.map((fileId) => (
          <div key={fileId} className="group/att relative">
            <button
              type="button"
              onClick={() => setPreviewFileId(fileId)}
              className={`${thumbCls} overflow-hidden rounded-md border hover:opacity-80 transition-opacity`}
            >
              <AuthImage
                fileId={fileId}
                alt="Ảnh đính kèm"
                className="h-full w-full object-cover"
              />
            </button>
            {handleDownload && (
              <button
                type="button"
                aria-label="Tải xuống"
                title="Tải xuống (quét virus)"
                disabled={downloadM.isPending}
                onClick={() => handleDownload(fileId)}
                className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-md bg-background/80 text-foreground opacity-0 shadow-sm transition-opacity group-hover/att:opacity-100 hover:bg-background disabled:opacity-40"
              >
                <Download className="size-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      <Dialog
        open={!!previewFileId}
        onOpenChange={(open) => !open && setPreviewFileId(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogTitle className="sr-only">Xem ảnh đính kèm</DialogTitle>
          {previewFileId && (
            <AuthImage
              fileId={previewFileId}
              alt="Ảnh đính kèm"
              className="max-h-[80vh] w-full object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
