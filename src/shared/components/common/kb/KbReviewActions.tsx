import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface KbReviewActionsProps {
  onApprove: () => void;
  onReject: (reason: string) => void;
  isPending?: boolean;
}

// Hiển thị cho Manager/Admin khi bài viết ở trạng thái PendingReview.
export function KbReviewActions({
  onApprove,
  onReject,
  isPending,
}: KbReviewActionsProps) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");

  const submitReject = () => {
    if (!reason.trim()) return;
    onReject(reason.trim());
    setReason("");
    setRejectOpen(false);
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5 text-destructive"
        disabled={isPending}
        onClick={() => setRejectOpen(true)}
      >
        <X className="size-3.5" />
        Từ chối
      </Button>
      <Button
        size="sm"
        className="gap-1.5"
        disabled={isPending}
        onClick={onApprove}
      >
        <Check className="size-3.5" />
        Phê duyệt
      </Button>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối thay đổi</DialogTitle>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="Lý do từ chối (bắt buộc)..."
            className="text-sm"
          />
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRejectOpen(false)}
            >
              Hủy
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={!reason.trim() || isPending}
              onClick={submitReject}
            >
              Từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
