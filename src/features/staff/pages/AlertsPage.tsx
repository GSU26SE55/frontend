import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Bell, CheckCircle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { KpiCard } from "@/shared/components/dashboard/KpiCard";
import { useStaffNotifications } from "@/features/staff/hooks/notification/useStaffNotifications";
import {
  toneClass,
  NOTIFICATION_STATUS_TONE,
} from "@/shared/theme/statusColors";
import {
  NotificationStatusEnum,
  NotificationTypeEnum,
} from "@/features/staff/types/notification/notification.types";
import type { NotificationDto } from "@/features/staff/types/notification/notification.types";
import { TABLE_COLUMNS } from "@/shared/constants/tableColumns";

const PAGE_SIZE = 10;

const TYPE_LABEL: Record<number, string> = {
  [NotificationTypeEnum.TicketCreated]: "Ticket mới",
  [NotificationTypeEnum.TicketAssigned]: "Ticket được giao",
  [NotificationTypeEnum.TicketStatusChanged]: "Đổi trạng thái",
  [NotificationTypeEnum.TicketResolved]: "Ticket đã xử lý",
  [NotificationTypeEnum.TicketClosed]: "Ticket đã đóng",
  [NotificationTypeEnum.TicketEscalated]: "Chuyển cấp",
  [NotificationTypeEnum.SlaWarning]: "SLA cảnh báo",
  [NotificationTypeEnum.SlaBreached]: "SLA quá hạn",
  [NotificationTypeEnum.BatteryAnomalyDetected]: "Bất thường pin",
  [NotificationTypeEnum.EnvironmentalIncidentDetected]: "Sự cố môi trường",
  [NotificationTypeEnum.EnvironmentalIncidentResolved]: "Đã xử lý môi trường",
  [NotificationTypeEnum.AccountActivated]: "Tài khoản",
  [NotificationTypeEnum.AdminInvite]: "Lời mời",
  [NotificationTypeEnum.IncidentDeclared]: "Incident",
  [NotificationTypeEnum.System]: "Hệ thống",
};

function getStatusClass(status: number) {
  return toneClass(NOTIFICATION_STATUS_TONE[status] ?? "muted");
}

function getStatusLabel(status: number) {
  if (status === NotificationStatusEnum.Read) return "Đã đọc";
  if (status === NotificationStatusEnum.Sent) return "Đã gửi";
  if (status === NotificationStatusEnum.Failed) return "Lỗi";
  return "Đang chờ";
}

function canOpenTicket(notification: NotificationDto) {
  return (
    notification.entityId &&
    notification.entityType?.toLowerCase().includes("ticket")
  );
}

export default function AlertsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const { data, isLoading, isError, refetch, isFetching } =
    useStaffNotifications({
      pageNumber: page,
      pageSize: PAGE_SIZE,
      unreadOnly: unreadOnly || undefined,
    });

  const notifications = data?.items ?? [];
  const totalItems = data?.totalItems ?? 0;
  const totalPages =
    data?.totalPages ?? Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const unreadCount = notifications.filter(
    (item) => item.status !== NotificationStatusEnum.Read,
  ).length;
  const slaCount = notifications.filter(
    (item) =>
      item.type === NotificationTypeEnum.SlaWarning ||
      item.type === NotificationTypeEnum.SlaBreached,
  ).length;

  return (
    <div className="p-6 space-y-6 max-w-360 mx-auto">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            Staff &middot; Alerts
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Alerts & Báo cáo
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Thông báo từ ticket, SLA và hệ thống.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant={unreadOnly ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setUnreadOnly((value) => !value);
              setPage(1);
            }}
          >
            Chưa đọc
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={isFetching ? "size-3.5 animate-spin" : "size-3.5"}
            />
            Làm mới
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiCard
          label="Tổng thông báo"
          value={isLoading ? "--" : totalItems}
          sub="items"
          icon={<Bell className="size-4" />}
        />
        <KpiCard
          label="Chưa đọc trang này"
          value={isLoading ? "--" : unreadCount}
          sub="items"
          icon={<AlertTriangle className="size-4" />}
          iconBg="bg-amber-500/10"
          iconColor="text-amber-600 dark:text-amber-300"
        />
        <KpiCard
          label="SLA alerts"
          value={isLoading ? "--" : slaCount}
          sub="items"
          icon={<CheckCircle className="size-4" />}
          iconBg="bg-destructive/10"
          iconColor="text-destructive"
        />
      </div>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b border-border py-4">
          <CardTitle>Danh sách thông báo</CardTitle>
        </CardHeader>
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : isError ? (
          <CardContent className="py-10 text-center text-destructive">
            Không thể tải thông báo.
          </CardContent>
        ) : notifications.length === 0 ? (
          <CardContent className="py-10 text-center text-muted-foreground">
            Không có thông báo phù hợp.
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">
                  {TABLE_COLUMNS.index}
                </TableHead>
                <TableHead>Nội dung</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>{TABLE_COLUMNS.status}</TableHead>
                <TableHead>{TABLE_COLUMNS.time}</TableHead>
                <TableHead className="text-right">Liên kết</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell className="text-center text-muted-foreground tabular-nums">
                    {(page - 1) * PAGE_SIZE + index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xl">
                      <p className="font-medium">{item.title}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {item.body}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {TYPE_LABEL[item.type] ?? `Type ${item.type}`}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getStatusClass(item.status)}
                    >
                      {getStatusLabel(item.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString("vi-VN")}
                  </TableCell>
                  <TableCell className="text-right">
                    {canOpenTicket(item) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          navigate(`/staff/tickets/${item.entityId}`)
                        }
                      >
                        Mở ticket
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((value) => value - 1)}
          >
            Trước
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((value) => value + 1)}
          >
            Sau
          </Button>
        </div>
      )}
    </div>
  );
}
