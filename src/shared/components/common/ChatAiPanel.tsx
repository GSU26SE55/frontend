import { useState } from "react";
import { toast } from "sonner";
import {
  Copy,
  FileDown,
  Loader2,
  Smile,
  Sparkles,
  Text as TextIcon,
} from "lucide-react";
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
  useSentimentCheck,
  useExportChatPdf,
} from "@/shared/hooks/useTicketChatActions";
import { ChatAiIntentEnum } from "@/shared/enums/chat.enum";
import type { ChatSentimentLabel } from "@/shared/types/chat.types";

const SENTIMENT_VI: Record<ChatSentimentLabel, string> = {
  Positive: "Tích cực 🙂",
  Neutral: "Trung lập 😐",
  Negative: "Tiêu cực 🙁",
  Critical: "Nghiêm trọng 🚨",
};

const INTENT_LABEL: Record<ChatAiIntentEnum, string> = {
  RequestInfo: "Yêu cầu thêm thông tin",
  TechnicalAnswer: "Trả lời kỹ thuật",
  Resolution: "Đề xuất giải pháp",
  FollowUp: "Theo dõi tiến độ",
};

interface Props {
  ticketId: string;
}

/**
 * GH-133 C2 — thanh công cụ AI cho chat thread (Staff/Manager/Admin).
 * Gợi ý (suggest) · Tóm tắt (summarize) · Xuất PDF (export-pdf).
 * Gợi ý được sao chép vào clipboard để dán vào ô soạn (composer là form riêng theo role).
 */
export default function ChatAiPanel({ ticketId }: Props) {
  const suggestM = useSuggestChat();
  const summarizeM = useSummarizeChat();
  const sentimentM = useSentimentCheck();
  const exportM = useExportChatPdf();

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [sentiment, setSentiment] = useState<{
    label: ChatSentimentLabel;
    score: number;
    isAlertSent: boolean;
  } | null>(null);
  const [sentimentOpen, setSentimentOpen] = useState(false);

  const handleSuggest = async (intent: ChatAiIntentEnum) => {
    try {
      const res = await suggestM.mutateAsync({ ticketId, payload: { intent } });
      if (!res.isSuccess || !res.data) {
        toast.error(res.message ?? "AI không tạo được gợi ý.");
        return;
      }
      setSuggestions(res.data.suggestions);
      setSuggestOpen(true);
    } catch {
      /* hook onError đã toast */
    }
  };

  const handleSummarize = async () => {
    try {
      const res = await summarizeM.mutateAsync({ ticketId });
      if (!res.isSuccess || !res.data) {
        toast.error(res.message ?? "AI không tóm tắt được.");
        return;
      }
      setSummary(res.data.summary);
      setSummaryOpen(true);
    } catch {
      /* hook onError đã toast */
    }
  };

  const handleSentiment = async () => {
    try {
      const res = await sentimentM.mutateAsync({ ticketId });
      if (!res.isSuccess || !res.data) {
        toast.error(res.message ?? "AI không phân tích được cảm xúc.");
        return;
      }
      setSentiment(res.data);
      setSentimentOpen(true);
    } catch {
      /* hook onError đã toast */
    }
  };

  const copySuggestion = (text: string) => {
    void navigator.clipboard
      .writeText(text)
      .then(() => toast.success("Đã sao chép gợi ý — dán vào ô soạn tin."))
      .catch(() => toast.error("Không sao chép được."));
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
          Gợi ý AI
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
        Tóm tắt
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7"
        disabled={sentimentM.isPending}
        onClick={() => void handleSentiment()}
      >
        {sentimentM.isPending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Smile className="size-3.5" />
        )}
        Cảm xúc
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7"
        disabled={exportM.isPending}
        onClick={() => exportM.mutate({ ticketId })}
      >
        {exportM.isPending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <FileDown className="size-3.5" />
        )}
        Xuất PDF
      </Button>

      {/* Dialog gợi ý */}
      <Dialog open={suggestOpen} onOpenChange={setSuggestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gợi ý trả lời (AI)</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {suggestions.map((s, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-lg border border-border p-2.5 text-sm"
              >
                <p className="flex-1 whitespace-pre-wrap break-words">{s}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0"
                  aria-label="Sao chép gợi ý"
                  onClick={() => copySuggestion(s)}
                >
                  <Copy className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog tóm tắt */}
      <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tóm tắt thread (AI)</DialogTitle>
          </DialogHeader>
          <p className="text-sm whitespace-pre-wrap break-words">{summary}</p>
        </DialogContent>
      </Dialog>

      {/* Dialog cảm xúc */}
      <Dialog open={sentimentOpen} onOpenChange={setSentimentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cảm xúc khách hàng (AI)</DialogTitle>
          </DialogHeader>
          {sentiment && (
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">
                  {SENTIMENT_VI[sentiment.label] ?? sentiment.label}
                </span>{" "}
                · score {sentiment.score.toFixed(2)}
              </p>
              {sentiment.isAlertSent && (
                <p className="text-red-600 dark:text-red-400">
                  ⚠️ Đã gửi cảnh báo tới Manager.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
