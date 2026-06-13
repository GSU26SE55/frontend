import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import AuthImage from "@/shared/components/common/AuthImage";
import type { TicketAttachmentDTO } from "@/shared/types/ticket.types";

interface TicketAttachmentsProps {
  attachments?: TicketAttachmentDTO[] | null;
}

const isImage = (contentType: string) => contentType.startsWith("image/");

/**
 * Hiển thị ảnh đính kèm của ticket (do Customer cung cấp khi tạo ticket).
 * Ảnh tải qua AuthImage (kèm Bearer). File không phải ảnh hiển thị dạng link tải.
 */
export default function TicketAttachments({
  attachments,
}: TicketAttachmentsProps) {
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);

  if (!attachments || attachments.length === 0) return null;

  return (
    <div>
      <p className="text-muted-foreground text-sm mb-2">Ảnh đính kèm</p>
      <div className="flex flex-wrap gap-2">
        {attachments.map((att) =>
          isImage(att.contentType) ? (
            <button
              key={att.id}
              type="button"
              onClick={() => setPreviewFileId(att.fileId)}
              className="h-24 w-24 overflow-hidden rounded-md border hover:opacity-80 transition-opacity"
            >
              <AuthImage
                fileId={att.fileId}
                alt={att.fileName}
                className="h-full w-full object-cover"
              />
            </button>
          ) : (
            <span
              key={att.id}
              className="flex h-24 w-24 items-center justify-center rounded-md border bg-muted px-2 text-center text-xs text-muted-foreground"
            >
              {att.fileName}
            </span>
          ),
        )}
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
