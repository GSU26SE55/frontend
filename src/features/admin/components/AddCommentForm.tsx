import { useEffect, useRef, useState } from "react";
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
} from "../schemas/ticket-comment.schema";
import { useAdminAddComment } from "../hooks/useAdminTickets";

const MAX_TEXTAREA_HEIGHT = 120;

interface Props {
  ticketId: string;
  onTyping?: () => void;
  isInternal?: boolean;
  existingFileIds?: string[];
  prefillText?: string;
  prefillVersion?: number;
}

export default function AddCommentForm({
  ticketId,
  onTyping,
  isInternal = false,
  existingFileIds = [],
  prefillText,
  prefillVersion = 0,
}: Props) {
  const { mutateAsync, isPending } = useAdminAddComment(ticketId);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const form = useForm<AddCommentFormValues>({
    resolver: zodResolver(addCommentSchema),
    defaultValues: { body: "", isInternal },
  });

  const attachments =
    useWatch({ control: form.control, name: "attachments" }) ?? [];
  const body = useWatch({ control: form.control, name: "body" }) ?? "";
  const isEmpty = !body.trim() && attachments.length === 0;

  const [resetCount, setResetCount] = useState(0);
  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  };

  useEffect(() => {
    if (!prefillText?.trim()) return;
    form.setValue("body", prefillText, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      autoResize(el);
      el.focus();
      const end = el.value.length;
      el.setSelectionRange(end, end);
    });
  }, [form, prefillText, prefillVersion]);

  const onSubmit = async (values: AddCommentFormValues) => {
    await mutateAsync({ ...values, isInternal });
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
      toast.error("Khong the truy cap micro. Vui long cap quyen va thu lai.");
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
                render={({ field }) => {
                  const { ref: fieldRef, ...fieldProps } = field;
                  return (
                    <FormItem className="flex-1 self-center">
                      <FormControl>
                        <Textarea
                          key={resetCount}
                          ref={(el) => {
                            fieldRef(el);
                            textareaRef.current = el;
                          }}
                          placeholder={
                            isInternal
                              ? "Ghi chu noi bo (khach khong thay)..."
                              : "Nhap binh luan..."
                          }
                          rows={1}
                          className="min-h-9 resize-none overflow-y-auto rounded-xl border-0 bg-transparent py-2 leading-4.5 shadow-none focus-visible:ring-0"
                          style={{ maxHeight: MAX_TEXTAREA_HEIGHT }}
                          {...fieldProps}
                          onChange={(e) => {
                            field.onChange(e);
                            onTyping?.();
                          }}
                          onInput={(e) => autoResize(e.currentTarget)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <button
                type="button"
                disabled={isInternal || uploading || transcribing}
                title={
                  isInternal ? "Ghi am luon duoc gui cong khai" : "Ghi am tin nhan"
                }
                aria-label="Ghi am tin nhan"
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
            aria-label="Gui binh luan"
          >
            <Send size={16} />
          </Button>
        </div>
      </form>
    </Form>
  );
}
