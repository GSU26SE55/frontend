import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  notificationTypeLabel,
  notificationChannelLabel,
  notificationBatchSourceLabel,
  notificationBatchStatusLabel,
} from "@/shared/constants/notificationLabels";
import { useNotificationBatchDetail } from "@/features/admin/hooks/notification/useNotificationGroups";
import { NotificationBatchTargetKindEnum } from "@/features/admin/types/notification/notification-group.types";

interface Props {
  batchId: string;
  onOpenChange: (open: boolean) => void;
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "ok" | "warn" | "bad";
}) {
  const color =
    tone === "ok"
      ? "text-emerald-600"
      : tone === "warn"
        ? "text-amber-600"
        : tone === "bad"
          ? "text-red-500"
          : "";
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

export default function NotificationBatchDetailDialog({
  batchId,
  onOpenChange,
}: Props) {
  const { data, isLoading } = useNotificationBatchDetail(batchId);

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chi tiết lần gửi</DialogTitle>
          <DialogDescription>
            Thống kê tự làm mới mỗi 15 giây trong lúc cửa sổ này còn mở — worker
            giao dần nên các con số còn thay đổi.
          </DialogDescription>
        </DialogHeader>

        {isLoading || !data ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Đang tải…
          </p>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-border p-3">
              <p className="font-medium">{data.title}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                {data.body}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-[10px]">
                  {notificationTypeLabel(data.type)}
                </Badge>
                {data.channels.map((c) => (
                  <Badge key={c} variant="outline" className="text-[10px]">
                    {notificationChannelLabel(c)}
                  </Badge>
                ))}
                <Badge variant="outline" className="text-[10px]">
                  {notificationBatchSourceLabel(data.source)}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {notificationBatchStatusLabel(data.status)}
                </Badge>
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium">Đã gửi tới</p>
              <div className="flex flex-wrap gap-1">
                {data.targets.map((t, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px]">
                    {t.targetKind === NotificationBatchTargetKindEnum.Group
                      ? // Nhóm đã xoá vẫn hiện KÈM TÊN — backend cố ý không lọc dòng đã xoá mềm.
                        // Nhánh fallback chỉ chạm tới nếu dòng nhóm bị xoá CỨNG khỏi DB.
                        (t.groupName ?? "Nhóm không còn tồn tại")
                      : "Cá nhân được chọn"}
                  </Badge>
                ))}
                {data.targets.length === 0 && (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Stat label="Người nhận" value={data.distinctRecipients} />
              <Stat label="Tổng dòng" value={data.totalRows} />
              <Stat label="Đang chờ giao" value={data.pendingCount} />
              <Stat label="Đã giao" value={data.sentCount} tone="ok" />
              <Stat label="Đã đọc" value={data.readCount} tone="ok" />
              <Stat label="Thất bại" value={data.failedCount} tone="bad" />
            </div>

            {data.failedCount > 0 && (
              <p className="text-xs text-muted-foreground">
                Dòng thất bại thường do người nhận đã tắt kênh đó trong tuỳ
                chọn, hoặc thiếu email / số điện thoại / thiết bị đã đăng ký
                push.
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
