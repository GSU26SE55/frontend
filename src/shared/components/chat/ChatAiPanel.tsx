import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Sparkles, Text as TextIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useSuggestChat,
  useSummarizeChat,
} from "@/shared/hooks/ticket/useTicketChatActions";
import { ChatAiIntentEnum } from "@/shared/enums/ticket/chat.enum";

const INTENT_LABEL: Record<ChatAiIntentEnum, string> = {
  RequestInfo: "Request more information",
  TechnicalAnswer: "Technical answer",
  Resolution: "Suggest a resolution",
  FollowUp: "Follow up on progress",
};

interface Props {
  ticketId: string;
  /** GH-133 — suggestions, once fetched, are rendered as a bubble at the end of the chat thread (parent render). */
  onSuggestions?: (suggestions: string[]) => void;
}

/**
 * GH-133 C2 — AI toolbar for the chat thread (Staff/Manager/Admin).
 * Suggest · Summarize.
 * GH-866 — the BE removed sentiment-check and export-pdf; not restoring them.
 * Returned suggestions are pushed up to the parent (onSuggestions) to render as a bubble
 * at the end of the chat thread — clicking one fills the input box for the user to send.
 */
export default function ChatAiPanel({ ticketId, onSuggestions }: Props) {
  const suggestM = useSuggestChat();
  const summarizeM = useSummarizeChat();

  const [summary, setSummary] = useState("");
  const [summaryOpen, setSummaryOpen] = useState(false);

  const handleSuggest = async (intent: ChatAiIntentEnum) => {
    try {
      const res = await suggestM.mutateAsync({ ticketId, payload: { intent } });
      if (!res.isSuccess || !res.data) {
        toast.error(res.message ?? "AI couldn't generate suggestions.");
        return;
      }
      onSuggestions?.(res.data.suggestions);
    } catch {
      /* hook's onError already toasts */
    }
  };

  const handleSummarize = async () => {
    try {
      const res = await summarizeM.mutateAsync({ ticketId });
      if (!res.isSuccess || !res.data) {
        toast.error(res.message ?? "AI couldn't summarize the thread.");
        return;
      }
      setSummary(res.data.summary);
      setSummaryOpen(true);
    } catch {
      /* hook's onError already toasts */
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button type="button" variant="outline" size="sm" className="h-7" />
          }
        >
          {suggestM.isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Sparkles className="size-3.5" />
          )}
          AI Suggest
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {(Object.keys(INTENT_LABEL) as ChatAiIntentEnum[]).map((intent) => (
            <DropdownMenuItem
              key={intent}
              disabled={suggestM.isPending}
              onClick={() => void handleSuggest(intent)}
            >
              {INTENT_LABEL[intent]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7"
        disabled={summarizeM.isPending}
        onClick={() => void handleSummarize()}
      >
        {summarizeM.isPending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <TextIcon className="size-3.5" />
        )}
        Summarize
      </Button>

      {/* Summary dialog */}
      <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thread summary (AI)</DialogTitle>
          </DialogHeader>
          <p className="text-base whitespace-pre-wrap break-words">{summary}</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
