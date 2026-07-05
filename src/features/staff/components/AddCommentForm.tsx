import { useState } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import FileUploadField from "@/features/file-storage/components/FileUploadField";
import { FilePurposeEnum } from "@/features/file-storage/types/file-storage.types";
import { AttachmentPreviewStrip } from "@/shared/components/common/AttachmentPreviewStrip";
import {
  addCommentSchema,
  type AddCommentFormValues,
} from "../schemas/staff-ticket.schema";

interface Props {
  onSubmit: (data: AddCommentFormValues) => void;
  isPending: boolean;
  onTyping?: () => void;
  /** Bình luận gửi ở chế độ nội bộ (theo tab đang mở của thread). */
  isInternal?: boolean;
}

export function AddCommentForm({
  onSubmit,
  isPending,
  onTyping,
  isInternal = false,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const form = useForm<AddCommentFormValues>({
    resolver: zodResolver(addCommentSchema),
    defaultValues: { body: "", isInternal: false },
  });

  const attachments =
    useWatch({ control: form.control, name: "attachments" }) ?? [];

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit({ ...data, isInternal });
    form.reset();
  });

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit}
        className={
          isInternal
            ? "flex flex-col gap-1.5 rounded-2xl border border-amber-500/40 bg-amber-500/5 p-1.5"
            : "flex flex-col gap-1.5 rounded-2xl border border-border bg-background p-1.5"
        }
      >
        <AttachmentPreviewStrip
          items={attachments}
          disabled={uploading}
          onRemove={(fileId) =>
            form.setValue(
              "attachments",
              attachments.filter((a) => a.fileId !== fileId),
            )
          }
        />

        <div className="flex items-center gap-1.5">
          <Controller
            control={form.control}
            name="attachments"
            render={({ field }) => (
              <FileUploadField
                compact
                hideThumbnails
                max={Infinity}
                purpose={FilePurposeEnum.TicketAttachment}
                value={field.value ?? []}
                onChange={field.onChange}
                onUploadingChange={setUploading}
              />
            )}
          />

          <FormField
            control={form.control}
            name="body"
            render={({ field }) => (
              <FormItem className="flex-1 space-y-0">
                <FormControl>
                  <Textarea
                    placeholder={
                      isInternal
                        ? "Ghi chú nội bộ (khách không thấy)..."
                        : "Thêm bình luận..."
                    }
                    rows={1}
                    className="flex h-9 min-h-9 resize-none items-center rounded-xl border-0 bg-transparent py-1.75 leading-4.5 shadow-none focus-visible:ring-0"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      onTyping?.();
                    }}
                  />
                </FormControl>
                <FormMessage className="px-2" />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            size="icon-lg"
            className="shrink-0 rounded-full"
            disabled={isPending || uploading}
            aria-label="Gửi bình luận"
          >
            <Send size={16} />
          </Button>
        </div>
      </form>
    </Form>
  );
}
