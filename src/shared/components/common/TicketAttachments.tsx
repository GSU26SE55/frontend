import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import AuthImage from "@/shared/components/common/AuthImage";

interface TicketAttachmentsProps {
  // BE trả về mảng FileId (string[]) — không kèm metadata (fileName/contentType).
  fileIds?: string[] | null;
}

/**
 * Hiển thị ảnh đính kèm của ticket (do Customer cung cấp khi tạo ticket).
 * Ảnh tải qua AuthImage (kèm Bearer). BE chỉ trả FileId nên hiển thị tất cả dạng ảnh;
 * AuthImage tự xử lý trường hợp file không phải ảnh (hiển thị fallback của nó).
 */
export default function TicketAttachments({ fileIds }: TicketAttachmentsProps) {
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);

  if (!fileIds || fileIds.length === 0) return null;

  return (
    <div>
      <p className="text-muted-foreground text-sm mb-2">Ảnh đính kèm</p>
      <div className="flex flex-wrap gap-2">
        {fileIds.map((fileId) => (
          <button
            key={fileId}
            type="button"
            onClick={() => setPreviewFileId(fileId)}
            className="h-24 w-24 overflow-hidden rounded-md border hover:opacity-80 transition-opacity"
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
