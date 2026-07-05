import { useEffect, useState } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Lock, Loader2, Mic, Send } from "lucide-react";
import { cn } from "@/lib/utils";
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
} from "../schemas/ticket-comment.schema";
import { useAdminAddComment } from "../hooks/useAdminTickets";

const MAX_TEXTAREA_HEIGHT = 120; // ~5 dòng trước khi cuộn nội bộ

interface Props {
  ticketId: string;
  onTyping?: () => void;
  /** Giá trị mặc định cho toggle nội bộ/công khai — đồng bộ theo sub-tab đang mở */
  defaultIsInternal?: boolean;
}

export default function AddCommentForm({
  ticketId,
  onTyping,
  defaultIsInternal = false,
}: Props) {
  const { mutateAsync, isPending } = useAdminAddComment(ticketId);
  const [uploading, setUploading] = useState(false);

  const form = useForm<AddCommentFormValues>({
    resolver: zodResolver(addCommentSchema),
    defaultValues: { body: "", isInternal: defaultIsInternal },
  });

  useEffect(() => {
    form.setValue("isInternal", defaultIsInternal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultIsInternal]);

  const attachments =
    useWatch({ control: form.control, name: "attachments" }) ?? [];

  // resetCount đổi key của Textarea sau submit → remount, tự về chiều cao ban đầu
  // (không đọc/ghi ref trong callback truyền vào handleSubmit — vi phạm rules-of-refs).
  const [resetCount, setResetCount] = useState(0);
  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  };

  const onSubmit = async (values: AddCommentFormValues) => {
    await mutateAsync(values);
    form.reset();
    setResetCount((c) => c + 1);
  };

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
        className="flex flex-col gap-1.5 rounded-2xl border border-border bg-background p-1.5"
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
              />
            )}
          />

          <FormField
            control={form.control}
            name="isInternal"
            render={({ field }) => (
              <div className="group relative shrink-0">
                <button
                  type="button"
                  aria-pressed={field.value}
                  aria-label="Đánh dấu bình luận nội bộ"
                  onClick={() => field.onChange(!field.value)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                    field.value
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Lock size={16} />
                </button>
                <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[10px] text-background opacity-0 transition-opacity group-hover:opacity-100">
                  Nội bộ
                </span>
              </div>
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
                        placeholder="Nhập bình luận..."
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
                disabled={defaultIsInternal || uploading || transcribing}
                title={
                  defaultIsInternal
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
            disabled={isPending || uploading || isRecording}
            aria-label="Gửi bình luận"
          >
            <Send size={16} />
          </Button>
        </div>
      </form>
    </Form>
  );
}
