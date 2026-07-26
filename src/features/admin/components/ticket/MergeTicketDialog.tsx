import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useMergeTicket } from "@/features/admin/hooks/ticket/useAdminTickets";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Ticket hiện tại (sẽ bị gộp vào ticket đích). */
  ticketId: string;
  ticketCode: string;
  /** Ticket đích gợi ý (từ suspectedDuplicateOfTicketId) — pre-fill. */
  suggestedTargetId?: string | null;
}

// Manager gộp ticket NÀY (nghi trùng) vào ticket đích → ticket này đóng lại.
export default function MergeTicketDialog({
  open,
  onOpenChange,
  ticketId,
  ticketCode,
  suggestedTargetId,
}: Props) {
  // Init từ prop (parent chỉ mount khi mở qua điều kiện `open &&` → không cần effect;
  // eslint cấm setState-in-effect).
  const [targetId, setTargetId] = useState(suggestedTargetId ?? "");
  const merge = useMergeTicket();

  const handleMerge = async () => {
    const trimmed = targetId.trim();
    if (!trimmed) return;
    try {
      await merge.mutateAsync({ id: ticketId, targetTicketId: trimmed });
      onOpenChange(false);
    } catch {
      // lỗi đã toast trong hook onError
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gộp ticket trùng</DialogTitle>
          <DialogDescription>
            Ticket <strong>{ticketCode}</strong> sẽ được gộp (đóng lại) vào
            ticket đích. Chỉ gộp khi chắc chắn 2 ticket là cùng 1 sự cố trên
            cùng cục pin.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="merge-target">ID ticket đích (giữ lại)</Label>
          <Input
            id="merge-target"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            placeholder="Nhập ID ticket đích..."
          />
          {suggestedTargetId && (
            <p className="text-xs text-muted-foreground">
              Gợi ý từ AI: đã điền sẵn ticket nghi trùng.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleMerge}
            disabled={!targetId.trim() || merge.isPending}
          >
            {merge.isPending ? "Đang gộp..." : "Gộp ticket"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
