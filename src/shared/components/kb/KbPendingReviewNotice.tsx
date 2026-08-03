import { Clock, History, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KbArticleStatusEnum } from "@/shared/enums/kb/kb.enum";
import type { KbArticleDTO } from "@/shared/types/kb/kb.types";

interface KbPendingReviewNoticeProps {
  article: KbArticleDTO;
  /** Mở dialog lịch sử phiên bản để xem nội dung bản chờ duyệt. */
  onViewVersions?: () => void;
}

// Báo cho người xem biết bài viết có bản thay đổi mới đang chờ phê duyệt —
// nội dung hiển thị bên dưới vẫn là bản đã duyệt gần nhất.
export function KbPendingReviewNotice({
  article,
  onViewVersions,
}: KbPendingReviewNoticeProps) {
  const isPendingReview =
    article.status === KbArticleStatusEnum.PendingReview ||
    article.reviewRequired;

  if (!isPendingReview) {
    // Bản thay đổi trước đó bị từ chối — cho tác giả biết lý do để sửa lại.
    if (!article.managerRejectReason) return null;

    return (
      <div className="flex items-start gap-2.5 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2.5">
        <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
        <div className="space-y-0.5 text-sm">
          <p className="font-medium text-destructive">
            Thay đổi gần nhất đã bị từ chối
          </p>
          <p className="text-muted-foreground">
            Lý do: {article.managerRejectReason}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-start gap-2.5 rounded-md border border-amber-500/40 bg-amber-500/5 px-3 py-2.5">
      <Clock className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-500" />
      <div className="min-w-0 flex-1 space-y-0.5 text-sm">
        <p className="font-medium text-amber-700 dark:text-amber-500">
          Có bản thay đổi mới đang chờ phê duyệt
        </p>
        <p className="text-muted-foreground">
          {article.version > 0
            ? `Nội dung bên dưới là phiên bản ${article.version} đã duyệt. Bản thay đổi chỉ hiển thị sau khi được phê duyệt.`
            : "Bài viết chưa có phiên bản nào được duyệt. Nội dung chỉ hiển thị sau khi được phê duyệt."}
        </p>
      </div>
      {onViewVersions && (
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={onViewVersions}
        >
          <History className="size-3.5" />
          Xem bản chờ duyệt
        </Button>
      )}
    </div>
  );
}
