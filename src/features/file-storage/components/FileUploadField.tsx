import { useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2, X } from "lucide-react";
import AuthImage from "@/shared/components/common/AuthImage";
import { useUploadFile } from "@/features/file-storage/hooks/useUploadFile";
import { FilePurposeEnum } from "@/features/file-storage/types/file-storage.types";
import { HttpError, EntityError } from "@/shared/lib/errors";

export interface UploadedAttachment {
  fileId: string;
  fileName?: string;
  contentType?: string;
  sizeBytes?: number;
}

interface FileUploadFieldProps {
  /** Avatar(1) | TicketAttachment(2) | MaintenancePhoto(3) — quyết định whitelist BE. */
  purpose: FilePurposeEnum;
  /** Controlled: danh sách ảnh đã upload. */
  value: UploadedAttachment[];
  onChange: (next: UploadedAttachment[]) => void;
  /** Báo cho form biết còn ảnh đang upload để disable submit. */
  onUploadingChange?: (uploading: boolean) => void;
  /** Số ảnh tối đa (mặc định 5). */
  max?: number;
  label?: string;
  disabled?: boolean;
}

/**
 * Widget upload ảnh tái dùng. Upload xảy ra ngay khi chọn file (qua `useUploadFile`),
 * form chỉ submit mảng `fileId`. Preview qua `AuthImage` (fetch kèm Bearer). Nút X chỉ
 * bỏ ảnh khỏi danh sách — không xóa khỏi storage (file orphan để cleanup job xử lý).
 */
export default function FileUploadField({
  purpose,
  value,
  onChange,
  onUploadingChange,
  max = 5,
  label,
  disabled = false,
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { mutateAsync } = useUploadFile();
  const [uploadingCount, setUploadingCount] = useState(0);

  const items = value ?? [];
  const remaining = max - items.length;

  const bumpUploading = (delta: number) =>
    setUploadingCount((c) => {
      const next = c + delta;
      onUploadingChange?.(next > 0);
      return next;
    });

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // reset để chọn lại cùng 1 file vẫn trigger change
    if (files.length === 0) return;

    const accepted = files.slice(0, Math.max(0, remaining));
    if (files.length > accepted.length) {
      toast.error(`Tối đa ${max} ảnh.`);
    }

    // Tích lũy cục bộ — tránh đọc `value` cũ qua mỗi await khi upload tuần tự.
    let current = [...items];
    for (const file of accepted) {
      bumpUploading(1);
      try {
        const res = await mutateAsync({ file, purpose });
        if (res.isSuccess && res.data) {
          current = [
            ...current,
            {
              fileId: res.data.fileId,
              fileName: res.data.fileName,
              contentType: res.data.contentType,
              sizeBytes: res.data.size,
            },
          ];
          onChange(current);
        } else {
          toast.error(res.message || `Tải "${file.name}" thất bại.`);
        }
      } catch (err) {
        if (err instanceof EntityError) {
          toast.error(err.errors[0]?.detail ?? `"${file.name}" không hợp lệ.`);
        } else if (err instanceof HttpError) {
          toast.error(err.message);
        } else {
          toast.error(`Tải "${file.name}" thất bại.`);
        }
      } finally {
        bumpUploading(-1);
      }
    }
  };

  const handleRemove = (fileId: string) =>
    onChange(items.filter((a) => a.fileId !== fileId));

  const uploading = uploadingCount > 0;
  const canAdd = !disabled && remaining > 0;

  return (
    <div className="space-y-2">
      {label && <p className="text-muted-foreground text-sm">{label}</p>}

      <div className="flex flex-wrap gap-2">
        {items.map((att) => (
          <div
            key={att.fileId}
            className="relative h-16 w-16 overflow-hidden rounded-md border"
          >
            <AuthImage
              fileId={att.fileId}
              alt={att.fileName ?? "Ảnh đính kèm"}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => handleRemove(att.fileId)}
              disabled={disabled}
              aria-label="Xóa ảnh"
              className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80 disabled:opacity-50"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        {canAdd && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-md border border-dashed text-muted-foreground hover:bg-muted/50 disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <ImagePlus size={18} />
                <span className="text-[10px]">Thêm</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handlePick}
      />
    </div>
  );
}
