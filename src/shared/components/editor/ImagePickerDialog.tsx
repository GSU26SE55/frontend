import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import AuthImage from "@/shared/components/media/AuthImage";
import { CameraCapture } from "./CameraCapture";
import { useTicketChatImages } from "@/shared/hooks/ticket/useTicketChatFiles";
import { useUploadFile } from "@/shared/hooks/file/useUploadFile";
import { FilePurposeEnum } from "@/shared/enums/file/file-storage.enum";
import { cn } from "@/lib/utils";
import { Upload, Loader2 } from "lucide-react";

export const IMAGE_MIME = /^image\/(png|jpe?g|gif|webp)$/i;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

interface ImagePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Inserts the image into the content — receives a fileId already on the server. */
  onPick: (fileId: string, alt?: string) => void;
  /** Has a value → enables the "Images from chat" tab for this ticket. */
  ticketId?: string;
}

export function ImagePickerDialog({
  open,
  onOpenChange,
  onPick,
  ticketId,
}: ImagePickerDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const { data: chatImages, isLoading } = useTicketChatImages(
    open ? ticketId : undefined,
  );
  const { mutateAsync: uploadFile, isPending: uploading } = useUploadFile();

  const upload = async (files: File[]) => {
    for (const file of files) {
      if (!IMAGE_MIME.test(file.type)) {
        toast.error(`"${file.name}" is not a valid image (png/jpg/gif/webp)`);
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        toast.error(`"${file.name}" exceeds 5MB`);
        continue;
      }
      try {
        const res = await uploadFile({
          file,
          folderName: "kb-blog",
          purpose: FilePurposeEnum.KbImage,
        });
        const fileId = res.data?.fileId;
        if (!fileId) throw new Error("no fileId");
        onPick(fileId, file.name);
        onOpenChange(false);
      } catch {
        toast.error(`Failed to upload "${file.name}"`);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Insert image</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={ticketId ? "chat" : "upload"}>
          <TabsList className="w-full">
            {ticketId && (
              <TabsTrigger value="chat" className="flex-1">
                Images from chat
              </TabsTrigger>
            )}
            <TabsTrigger value="upload" className="flex-1">
              Upload
            </TabsTrigger>
            <TabsTrigger value="camera" className="flex-1">
              Take photo
            </TabsTrigger>
          </TabsList>

          {ticketId && (
            <TabsContent value="chat" className="mt-3">
              {isLoading ? (
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square rounded-md" />
                  ))}
                </div>
              ) : !chatImages || chatImages.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center text-sm">
                  This chat has no images yet.
                </p>
              ) : (
                <div className="grid max-h-[50vh] grid-cols-3 gap-2 overflow-auto">
                  {chatImages.map((img) => (
                    <button
                      key={img.id}
                      type="button"
                      title={img.fileName}
                      onClick={() => {
                        // Image already on the server — insert the fileId directly, no re-upload
                        onPick(img.fileId, img.fileName);
                        onOpenChange(false);
                      }}
                      className="hover:ring-ring focus:ring-ring overflow-hidden rounded-md border hover:ring-2 focus:ring-2 focus:outline-none"
                    >
                      <AuthImage
                        fileId={img.fileId}
                        alt={img.fileName}
                        className="aspect-square w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          <TabsContent value="upload" className="mt-3">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const files = Array.from(e.dataTransfer.files);
                if (files.length) void upload(files);
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-8 text-center",
                dragOver ? "border-primary bg-accent/50" : "border-input",
              )}
            >
              {uploading ? (
                <Loader2 className="text-muted-foreground size-6 animate-spin" />
              ) : (
                <Upload className="text-muted-foreground size-6" />
              )}
              <p className="text-sm">Drag and drop images here</p>
              <p className="text-muted-foreground text-xs">
                PNG, JPG, GIF, WEBP — max 5MB
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                Choose from device
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  e.target.value = "";
                  if (files.length) void upload(files);
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="camera" className="mt-3">
            <CameraCapture
              disabled={uploading}
              onCapture={(file) => void upload([file])}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
