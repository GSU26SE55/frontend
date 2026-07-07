import { X } from "lucide-react";
import AuthImage from "@/shared/components/common/AuthImage";

interface AttachmentPreviewItem {
  fileId: string;
  fileName?: string;
}

interface AttachmentPreviewStripProps {
  items: AttachmentPreviewItem[];
  onRemove: (fileId: string) => void;
  disabled?: boolean;
}

/** Dải xem trước ảnh đã chọn, hiển thị phía trên thanh chat — tự xuống dòng khi nhiều ảnh, không giới hạn số lượng. */
export function AttachmentPreviewStrip({
  items,
  onRemove,
  disabled = false,
}: AttachmentPreviewStripProps) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-1 pt-1">
      {items.map((att) => (
        <div
          key={att.fileId}
          className="relative h-16 w-16 overflow-hidden rounded-lg border border-border"
        >
          <AuthImage
            fileId={att.fileId}
            alt={att.fileName ?? "Ảnh đính kèm"}
            className="h-full w-full object-cover"
          />
          <button
            type="button"
            onClick={() => onRemove(att.fileId)}
            disabled={disabled}
            aria-label="Xóa ảnh"
            className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80 disabled:opacity-50"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
