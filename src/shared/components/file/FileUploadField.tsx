import { useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2, X, Upload, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import AuthImage from "@/shared/components/media/AuthImage";
import { useUploadFile } from "@/shared/hooks/file/useUploadFile";
import { FilePurposeEnum } from "@/shared/types/file-storage.types";
import { HttpError, EntityError } from "@/shared/lib/errors";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { fileStorageService } from "@/shared/services/file-storage.service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MESSAGES } from "@/shared/constants/messages";

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
  /** Trigger icon-only tròn (cho thanh chat) thay vì khung dashed có chữ "Thêm". */
  compact?: boolean;
  /** Khung upload lớn, chiếm hết chiều rộng cột (cho form Ảnh trước / Ảnh sau). */
  large?: boolean;
  /** Ẩn thumbnail trong component này — dùng khi consumer tự hiển thị preview ở nơi khác. */
  hideThumbnails?: boolean;
  /** Danh sách file ID đã tồn tại trong ticket để tái sử dụng */
  existingFileIds?: string[];
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
  compact = false,
  large = false,
  hideThumbnails = false,
  existingFileIds = [],
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { mutateAsync } = useUploadFile();
  const [uploadingCount, setUploadingCount] = useState(0);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [dialogAttachments, setDialogAttachments] = useState<
    UploadedAttachment[]
  >([]);

  const items = value ?? [];
  const remaining = max - items.length;
  const dialogRemaining = max - dialogAttachments.length;

  const bumpUploading = (delta: number) =>
    setUploadingCount((c) => {
      const next = c + delta;
      onUploadingChange?.(next > 0);
      return next;
    });

  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      const targetRemaining = isLibraryOpen ? dialogRemaining : remaining;
      const accepted = files.slice(0, Math.max(0, targetRemaining));
      if (files.length > accepted.length) {
        toast.error(`Tối đa ${max} ảnh.`);
      }

      let current = isLibraryOpen ? [...dialogAttachments] : [...items];
      for (const file of accepted) {
        bumpUploading(1);
        try {
          const res = await mutateAsync({ file, purpose });
          if (res.isSuccess && res.data) {
            const newItem = {
              fileId: res.data.fileId,
              fileName: res.data.fileName,
              contentType: res.data.contentType,
              sizeBytes: res.data.size,
            };
            current = [...current, newItem];
            if (isLibraryOpen) {
              setDialogAttachments(current);
            } else {
              onChange(current);
            }
          } else {
            toast.error(res.message || `Tải "${file.name}" thất bại.`);
          }
        } catch (err) {
          if (err instanceof EntityError) {
            toast.error(
              err.errors[0]?.detail ?? `"${file.name}" không hợp lệ.`,
            );
          } else if (err instanceof HttpError) {
            toast.error(err.message);
          } else {
            toast.error(`Tải "${file.name}" thất bại.`);
          }
        } finally {
          bumpUploading(-1);
        }
      }
    }
  };

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // reset để chọn lại cùng 1 file vẫn trigger change
    if (files.length === 0) return;

    const targetRemaining = isLibraryOpen ? dialogRemaining : remaining;
    const accepted = files.slice(0, Math.max(0, targetRemaining));
    if (files.length > accepted.length) {
      toast.error(`Tối đa ${max} ảnh.`);
    }

    let current = isLibraryOpen ? [...dialogAttachments] : [...items];
    for (const file of accepted) {
      bumpUploading(1);
      try {
        const res = await mutateAsync({ file, purpose });
        if (res.isSuccess && res.data) {
          const newItem = {
            fileId: res.data.fileId,
            fileName: res.data.fileName,
            contentType: res.data.contentType,
            sizeBytes: res.data.size,
          };
          current = [...current, newItem];
          if (isLibraryOpen) {
            setDialogAttachments(current);
          } else {
            onChange(current);
          }
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

  const handleSelectExisting = async (fileId: string) => {
    const isSelected = dialogAttachments.some((i) => i.fileId === fileId);
    if (isSelected) {
      setDialogAttachments((prev) => prev.filter((i) => i.fileId !== fileId));
      return;
    }

    if (dialogRemaining <= 0) {
      toast.error(`Đã đạt giới hạn tối đa ${max} ảnh.`);
      return;
    }

    setFetchingMetadata(true);
    try {
      const res = await fileStorageService.getFileMetadata(fileId);
      if (res.data.isSuccess && res.data.data) {
        const metadata = res.data.data;
        setDialogAttachments((prev) => [
          ...prev,
          {
            fileId: metadata.fileId,
            fileName: metadata.fileName,
            contentType: metadata.contentType,
            sizeBytes: metadata.size,
          },
        ]);
      } else {
        toast.error(res.data.message || "Không thể lấy thông tin tệp tin.");
      }
    } catch {
      toast.error(MESSAGES.file.loadInfoFailed);
    } finally {
      setFetchingMetadata(false);
    }
  };

  const handleAddClick = () => {
    if (existingFileIds.length > 0) {
      setDialogAttachments([...items]);
      setIsLibraryOpen(true);
    } else {
      inputRef.current?.click();
    }
  };

  const handleConfirmDialog = () => {
    onChange(dialogAttachments);
    setIsLibraryOpen(false);
  };

  const uploading = uploadingCount > 0;
  const canAdd = !disabled && remaining > 0;

  return (
    <div className={cn(compact ? "flex shrink-0 items-center" : "space-y-2")}>
      {label && <p className="text-muted-foreground text-sm">{label}</p>}

      <div
        className={cn(
          "flex items-center gap-2",
          compact ? "shrink-0" : "flex-wrap",
          large && "gap-3",
        )}
      >
        {!hideThumbnails &&
          items.map((att) => (
            <div
              key={att.fileId}
              className={cn(
                "relative overflow-hidden rounded-md border",
                compact && "h-9 w-9",
                !compact && !large && "h-16 w-16",
                large && "aspect-square w-24",
              )}
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
                <X size={10} />
              </button>
            </div>
          ))}

        {canAdd && compact && (
          <button
            type="button"
            onClick={handleAddClick}
            disabled={uploading}
            aria-label="Thêm ảnh"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ImagePlus size={16} />
            )}
          </button>
        )}

        {canAdd && !compact && (
          <button
            type="button"
            onClick={handleAddClick}
            disabled={uploading}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-md border border-dashed text-muted-foreground hover:bg-muted/50 disabled:opacity-50",
              large ? "aspect-square w-24" : "h-16 w-16",
            )}
          >
            {uploading ? (
              <Loader2 size={large ? 24 : 18} className="animate-spin" />
            ) : (
              <>
                <ImagePlus size={large ? 24 : 18} />
                <span className={cn(large ? "text-xs" : "text-[10px]")}>
                  Thêm
                </span>
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

      <Dialog
        open={isLibraryOpen}
        onOpenChange={(open) =>
          !open && !fetchingMetadata && setIsLibraryOpen(false)
        }
      >
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-6">
          <DialogTitle className="text-lg font-semibold text-foreground">
            Thêm tệp tin đính kèm
          </DialogTitle>
          <div className="flex-1 min-h-0 mt-2 flex flex-col">
            <Tabs defaultValue="reuse" className="flex-1 flex flex-col min-h-0">
              <TabsList className="grid w-full grid-cols-2 mb-4 shrink-0">
                <TabsTrigger value="reuse" className="text-sm font-medium">
                  Thư viện
                </TabsTrigger>
                <TabsTrigger value="upload" className="text-sm font-medium">
                  Tải lên
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="reuse"
                className="flex-1 overflow-y-auto min-h-[220px] relative outline-none pr-1"
              >
                {fetchingMetadata && (
                  <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm rounded-lg">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-sm font-medium mt-2 text-muted-foreground">
                      Đang tải thông tin tệp...
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-4 gap-3">
                  {existingFileIds.map((fileId) => {
                    const isSelected = dialogAttachments.some(
                      (i) => i.fileId === fileId,
                    );
                    return (
                      <button
                        key={fileId}
                        type="button"
                        disabled={fetchingMetadata}
                        onClick={() => handleSelectExisting(fileId)}
                        className={cn(
                          "group relative aspect-square overflow-hidden rounded-md border-2 bg-muted transition-all duration-200 outline-none",
                          isSelected
                            ? "border-primary ring-2 ring-primary/20 shadow-sm"
                            : "border-border hover:border-muted-foreground/60",
                        )}
                      >
                        <AuthImage
                          fileId={fileId}
                          alt="Ảnh đính kèm"
                          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 bg-primary text-primary-foreground rounded-full p-0.5 shadow-sm scale-100 transition-transform">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent
                value="upload"
                className="flex-1 flex flex-col justify-start outline-none overflow-y-auto pr-1"
              >
                {/* Uploaded files in the current dialog session */}
                {dialogAttachments.some(
                  (att) => !existingFileIds.includes(att.fileId),
                ) && (
                  <div className="mb-4 pb-4 border-b border-border/60">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Ảnh đã tải lên (
                      {
                        dialogAttachments.filter(
                          (att) => !existingFileIds.includes(att.fileId),
                        ).length
                      }
                      )
                    </p>
                    <div className="grid grid-cols-4 gap-3">
                      {dialogAttachments
                        .filter((att) => !existingFileIds.includes(att.fileId))
                        .map((att) => (
                          <div
                            key={att.fileId}
                            className="relative aspect-square rounded-md border border-border overflow-hidden group/newthumb"
                          >
                            <AuthImage
                              fileId={att.fileId}
                              alt={att.fileName ?? "Ảnh mới"}
                              className="h-full w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setDialogAttachments((prev) =>
                                  prev.filter((x) => x.fileId !== att.fileId),
                                )
                              }
                              className="absolute inset-0 bg-black/60 opacity-0 group-hover/newthumb:opacity-100 flex items-center justify-center text-white transition-opacity duration-200"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => inputRef.current?.click()}
                  className={cn(
                    "flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 cursor-pointer transition-colors text-center min-h-[120px] shrink-0",
                    dragActive
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50",
                  )}
                >
                  <div className="rounded-full bg-muted p-2.5 mb-2 text-muted-foreground">
                    {uploading ? (
                      <Loader2
                        size={20}
                        className="animate-spin text-primary"
                      />
                    ) : (
                      <Upload size={20} />
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground mb-0.5">
                    Kéo thả tệp tin vào đây hoặc click để duyệt thiết bị
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Chấp nhận hình ảnh (.png, .jpg, .jpeg) tối đa {max} tệp
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Footer controls */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border mt-4 shrink-0">
            <Button
              type="button"
              variant="outline"
              disabled={fetchingMetadata || uploading}
              onClick={() => setIsLibraryOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              disabled={fetchingMetadata || uploading}
              onClick={handleConfirmDialog}
            >
              {fetchingMetadata || uploading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : null}
              Xác nhận ({dialogAttachments.length})
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
