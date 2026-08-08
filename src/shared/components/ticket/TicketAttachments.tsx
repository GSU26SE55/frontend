import { useState } from "react";
import { Download } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import AuthImage from "@/shared/components/media/AuthImage";
import { useDownloadChatAttachment } from "@/shared/hooks/ticket/useTicketChatActions";

interface TicketAttachmentsProps {
  // BE returns an array of FileId (string[]) — no metadata (fileName/contentType) included.
  fileIds?: string[] | null;
  // Label shown above the image grid; pass null/"" to hide it. Defaults to "Attachments".
  label?: string | null;
  // Smaller thumbnail for inline contexts (comment, maintenance log).
  compact?: boolean;
  // GH-133 C3 — when both ticketId + chatId are present, shows a download button via the
  // chat-attachment endpoint with virus-scan gating (200 url · 202 scanning · 451 infected).
  // The BE matches {attachmentId} by FileId.
  ticketId?: string;
  chatId?: string;
}

/**
 * Displays attached images (ticket attachment, image in a comment, maintenance photo...).
 * Images load via AuthImage (with Bearer). The BE only returns FileId so it renders
 * everything as an image; AuthImage handles the case where the file isn't an image
 * (shows its own fallback).
 */
export default function TicketAttachments({
  fileIds,
  label = "Attachments",
  compact = false,
  ticketId,
  chatId,
}: TicketAttachmentsProps) {
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);
  const downloadM = useDownloadChatAttachment();
  // Narrow ticketId/chatId inside the closure — avoids a non-null assertion (eslint no-non-null-assertion).
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
                alt="Attachment"
                className="h-full w-full object-cover"
              />
            </button>
            {handleDownload && (
              <button
                type="button"
                aria-label="Download"
                title="Download (virus scan)"
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
          <DialogTitle className="sr-only">View attachment</DialogTitle>
          {previewFileId && (
            <AuthImage
              fileId={previewFileId}
              alt="Attachment"
              className="max-h-[80vh] w-full object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
