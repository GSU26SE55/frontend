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
import { Button } from "@/components/ui/button";
import {
  MentionTextarea,
  type MentionCandidate,
} from "@/shared/components/chat/MentionTextarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import FileUploadField from "@/shared/components/file/FileUploadField";
import { FilePurposeEnum } from "@/shared/types/file/file-storage.types";
import { AttachmentPreviewStrip } from "@/shared/components/chat/AttachmentPreviewStrip";
import { VoiceRecordingBar } from "@/shared/components/chat/VoiceRecordingBar";
import { useVoiceRecorder } from "@/shared/hooks/ticket/useVoiceRecorder";
import { useTranscribeVoiceChat } from "@/shared/hooks/ticket/useTicketChatActions";
import {
  addCommentSchema,
  type AddCommentFormValues,
} from "@/features/staff/schemas/ticket/staff-ticket.schema";
import { MESSAGES } from "@/shared/constants/messages";

const MAX_TEXTAREA_HEIGHT = 120;

interface Props {
  ticketId: string;
  onSubmit: (data: AddCommentFormValues) => void;
  isPending: boolean;
  onTyping?: () => void;
  isInternal?: boolean;
  existingFileIds?: string[];
  prefillText?: string;
  prefillVersion?: number;
  /** People who can be @-tagged — usually built from the participants in the conversation. */
  mentionCandidates?: MentionCandidate[];
}

export function AddCommentForm({
  ticketId,
  onSubmit,
  isPending,
  onTyping,
  isInternal = false,
  existingFileIds = [],
  prefillText,
  prefillVersion = 0,
  mentionCandidates = [],
}: Props) {
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

  // Return focus to the composer after sending so the next message can be typed straight
  // away — form.reset() clears the value but leaves the textarea blurred, forcing a click
  // back into it after every send. rAF waits for the reset to be painted first.
  // Return focus to the composer after a send so the next message can be typed straight away.
  // form.reset() clears the value but leaves the textarea blurred, which forced a click back
  // into it after every message. Keyed on resetCount (bumped on each successful send) rather
  // than called inline from the submit handler, so the ref is only touched from an effect.
  useEffect(() => {
    if (resetCount === 0) return;
    const raf = requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      autoResize(el);
      el.focus();
    });
    return () => cancelAnimationFrame(raf);
  }, [resetCount]);

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit({ ...data, isInternal });
    form.reset();
    setResetCount((c) => c + 1);
  });

  const { isRecording, elapsedSeconds, waveform, start, stop, cancel } =
    useVoiceRecorder();
  const { mutateAsync: transcribeVoice, isPending: transcribing } =
    useTranscribeVoiceChat();

  const handleStartRecording = async () => {
    try {
      await start();
    } catch {
      toast.error(MESSAGES.micPermission);
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
                  const { ref: fieldRef, value } = field;
                  return (
                    <FormItem className="flex-1 space-y-0">
                      <FormControl>
                        <MentionTextarea
                          key={resetCount}
                          ref={(el) => {
                            fieldRef(el);
                            textareaRef.current = el;
                          }}
                          candidates={mentionCandidates}
                          isInternal={isInternal}
                          value={value ?? ""}
                          onChange={(v) => {
                            field.onChange(v);
                            onTyping?.();
                            const el = textareaRef.current;
                            if (el) autoResize(el);
                          }}
                          onMentionsChange={(mentions) =>
                            form.setValue("mentions", mentions)
                          }
                          // Enter sends / Shift+Enter for a new line. The guard must match the
                          // send button below exactly, otherwise Enter could bypass a condition
                          // the button is blocking on (uploading, recording, empty…).
                          onSubmitKey={() => {
                            if (
                              isPending ||
                              uploading ||
                              isRecording ||
                              isEmpty
                            )
                              return;
                            handleSubmit();
                          }}
                          placeholder={
                            isInternal
                              ? "Internal note (not visible to customer)..."
                              : "Add a comment... (type @ to tag)"
                          }
                          rows={1}
                          className="flex min-h-9 resize-none items-center overflow-y-auto rounded-xl border-0 bg-transparent py-1.75 leading-4.5 shadow-none focus-visible:ring-0"
                          style={{ maxHeight: MAX_TEXTAREA_HEIGHT }}
                        />
                      </FormControl>
                      <FormMessage className="px-2" />
                    </FormItem>
                  );
                }}
              />
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={isInternal || uploading || transcribing}
                      aria-label="Record voice message"
                      onClick={handleStartRecording}
                      className="h-9 w-9 shrink-0 rounded-full p-0 text-muted-foreground"
                    />
                  }
                >
                  {transcribing ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Mic size={16} />
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  {isInternal
                    ? "Voice messages are always sent publicly"
                    : "Record voice message"}
                </TooltipContent>
              </Tooltip>
            </>
          )}

          <Button
            type="submit"
            size="icon-lg"
            className="shrink-0 rounded-full"
            disabled={isPending || uploading || isRecording || isEmpty}
            aria-label="Send comment"
          >
            <Send size={16} />
          </Button>
        </div>
      </form>
    </Form>
  );
}
