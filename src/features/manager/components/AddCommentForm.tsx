import { useState } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Mic, Send } from "lucide-react";
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
import { VoiceRecordingBar } from "@/shared/components/common/VoiceRecordingBar";
import { useVoiceRecorder } from "@/shared/hooks/useVoiceRecorder";
import { useTranscribeVoiceChat } from "@/shared/hooks/useTicketChatActions";
import {
  addCommentSchema,
  type AddCommentFormValues,
} from "@/features/manager/schemas/ticket.schema";
import { useAddComment } from "@/features/manager/hooks/useManagerTickets";

const MAX_TEXTAREA_HEIGHT = 120; // ~5 dòng trước khi cuộn nội bộ

interface Props {
  ticketId: string;
  onTyping?: () => void;
  /** Bình luận gửi ở chế độ nội bộ (theo tab đang mở của thread). */
  isInternal?: boolean;
  existingFileIds?: string[];
}

export default function AddCommentForm({
  ticketId,
  onTyping,
  isInternal = false,
  existingFileIds = [],
}: Props) {
  const { mutateAsync, isPending } = useAddComment();
  const [uploading, setUploading] = useState(false);

  const form = useForm<AddCommentFormValues>({
    resolver: zodResolver(addCommentSchema),
    defaultValues: { body: "", isInternal },
  });

  const attachments =
    useWatch({ control: form.control, name: "attachments" }) ?? [];
  const body = useWatch({ control: form.control, name: "body" }) ?? "";
  // Không còn báo lỗi "để trống" — chỉ disable nút gửi khi rỗng (không text và không ảnh).
  const isEmpty = !body.trim() && attachments.length === 0;

  // Ô nhập tự giãn theo nội dung gõ (giống WhatsApp/Messenger) thay vì cố định 1 dòng.
  // resetCount đổi key của Textarea sau submit → remount, tự về chiều cao ban đầu
  // (không đọc/ghi ref trong callback truyền vào handleSubmit — vi phạm rules-of-refs).
  const [resetCount, setResetCount] = useState(0);
  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  };

  const onSubmit = async (values: AddCommentFormValues) => {
    await mutateAsync({ ticketId, payload: { ...values, isInternal } });
    form.reset();
    setResetCount((c) => c + 1);
  };

  // Ghi âm — BE luôn tạo chat với IsInternal=false, nên khoá khi đang ở sub-tab Nội bộ.
  const { isRecording, elapsedSeconds, waveform, start, stop, cancel } =
    useVoiceRecorder();
  const { mutateAsync: transcribeVoice, isPending: transcribing } =
    useTranscribeVoiceChat();

  const handleStartRecording = async () => {
    try {
      await start();
    } catch {
      toast.error("Không thể truy cập micro. Vui lòng cấp quyền và thử lại.");
    }
  };
  const handleStopRecording = async () => {
    const file = await stop();
    if (!file) return;
    await transcribeVoice({ ticketId, audioFile: file }).catch(() => {});
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
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

        <div className="flex items-end gap-1.5">
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
                existingFileIds={existingFileIds}
              />
            )}
          />

          {isRecording ? (
            <VoiceRecordingBar
              elapsedSeconds={elapsedSeconds}
              waveform={waveform}
              onStop={handleStopRecording}
              onCancel={cancel}
            />
          ) : (
            <>
              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem className="flex-1 self-center">
                    <FormControl>
                      <Textarea
                        key={resetCount}
                        placeholder={
                          isInternal
                            ? "Ghi chú nội bộ (khách không thấy)..."
                            : "Nhập bình luận..."
                        }
                        rows={1}
                        className="min-h-9 resize-none overflow-y-auto rounded-xl border-0 bg-transparent py-2 leading-4.5 shadow-none focus-visible:ring-0"
                        style={{ maxHeight: MAX_TEXTAREA_HEIGHT }}
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          onTyping?.();
                        }}
                        onInput={(e) => autoResize(e.currentTarget)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <button
                type="button"
                disabled={isInternal || uploading || transcribing}
                title={
                  isInternal
                    ? "Ghi âm luôn được gửi công khai"
                    : "Ghi âm tin nhắn"
                }
                aria-label="Ghi âm tin nhắn"
                onClick={handleStartRecording}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
              >
                {transcribing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Mic size={16} />
                )}
              </button>
            </>
          )}

          <Button
            type="submit"
            size="icon-lg"
            className="shrink-0 rounded-full"
            disabled={isPending || uploading || isRecording || isEmpty}
            aria-label="Gửi bình luận"
          >
            <Send size={16} />
          </Button>
        </div>
      </form>
    </Form>
  );
}
