import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import AuthImage from "@/shared/components/common/AuthImage";

interface TicketAttachmentsProps {
  // BE trả về mảng FileId (string[]) — không kèm metadata (fileName/contentType).
  fileIds?: string[] | null;
  // Nhãn hiển thị phía trên lưới ảnh; truyền null/"" để ẩn nhãn. Mặc định "Ảnh đính kèm".
  label?: string | null;
  // Thumbnail nhỏ hơn cho ngữ cảnh inline (comment, nhật ký bảo trì).
  compact?: boolean;
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
}: TicketAttachmentsProps) {
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);

  if (!fileIds || fileIds.length === 0) return null;

  const thumbCls = compact ? "h-16 w-16" : "h-24 w-24";

  return (
    <div>
      {label && <p className="text-muted-foreground text-sm mb-2">{label}</p>}
      <div className="flex flex-wrap gap-2">
        {fileIds.map((fileId) => (
          <button
            key={fileId}
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
