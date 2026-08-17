import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, HardDrive } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// IOT3-69 — DÙNG LẠI badge sẵn có thay vì viết bảng nhãn/màu thứ hai. Hai bảng màu cho cùng
// một enum sẽ lệch nhau ngay lần thêm trạng thái đầu tiên, và người dùng sẽ thấy cùng một
// thiết bị hiện hai kiểu ở hai trang.
import IoTDeviceStatusBadge from "@/shared/components/iot/IoTDeviceStatusBadge";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";
import { useIotDevicesForStaff } from "@/shared/hooks/iot/useIotDeviceRead";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { IotDeviceStatusEnum } from "@/shared/enums/iot/iot.enum";
import { formatRelativeTime } from "@/shared/utils/iotDeviceHealth";

/**
 * IOT3-66 — danh sách thiết bị IoT cho Staff.
 *
 * Trước sprint này, liệt kê thiết bị chỉ có ở trang admin (`[Authorize(Roles = "Admin")]`).
 * Staff trực ca không trả lời được câu hỏi thường gặp nhất — "thiết bị nào đang mất kết nối?" —
 * mà phải nhờ Admin mở máy lên xem hộ.
 *
 * ⚠️ Backend CỐ Ý không lọc theo site của người gọi (quyết định #7 của sprint): Staff hay bị
 * điều sang site khác giữa ca.
 */

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: String(IotDeviceStatusEnum.Active), label: "Active" },
  { value: String(IotDeviceStatusEnum.Offline), label: "Offline" },
  { value: String(IotDeviceStatusEnum.Pending), label: "Pending provision" },
  { value: String(IotDeviceStatusEnum.Disabled), label: "Disabled" },
];

export default function IoTDevicesPage() {
  const [keywordInput, setKeywordInput] = useState("");
  const [status, setStatus] = useState("all");

  // Gõ tới đâu gọi API tới đó là một request mỗi ký tự.
  const keyword = useDebounce(keywordInput, 400);

  const params = useMemo(
    () => ({
      keyword: keyword.trim() || undefined,
      status:
        status === "all" ? undefined : (Number(status) as IotDeviceStatusEnum),
      pageSize: 50,
      sortBy: "lastSeenAt",
      sortDir: "desc" as const,
    }),
    [keyword, status],
  );

  const { data, isLoading, isError, refetch } = useIotDevicesForStaff(params);
  const items = data?.items ?? [];

  return (
    <div className="p-6 space-y-6 max-w-360 mx-auto">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            Staff &middot; IoT
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">IoT Devices</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Status, firmware and last-seen time of the gateways in the field.
          </p>
        </div>
        <RefreshButton queryKeys={[KEY.iotDevices]} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-64 max-w-md">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by device code or name"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            className="pl-8"
          />
        </div>
        {/* onValueChange của shadcn Select trả `string | null` (null khi bỏ chọn);
            `setStatus` chỉ nhận string. Quy null về "all" thay vì ép kiểu — bỏ chọn
            nghĩa là không lọc nữa, đúng bằng "All statuses". */}
        <Select value={status} onValueChange={(v) => setStatus(v ?? "all")}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : isError ? (
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">
            Could not load the device list.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => refetch()}
          >
            Retry
          </Button>
        </Card>
      ) : items.length === 0 ? (
        <Card className="p-10 flex flex-col items-center gap-3">
          <HardDrive className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {keyword || status !== "all"
              ? "No device matches the filter."
              : "No devices yet."}
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Firmware</TableHead>
                <TableHead>Last seen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((d) => {
                // Firmware đích khác bản đang chạy ⇒ đang chờ OTA. Không nói ra thì người trực
                // sẽ tưởng thiết bị đã lên bản mới vì admin "đã bấm cập nhật rồi".
                const otaPending =
                  !!d.targetFirmwareVersion &&
                  d.targetFirmwareVersion !== d.currentFirmwareVersion;
                return (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono text-xs">
                      <Link
                        to={`/staff/iot-devices/${d.id}`}
                        className="text-primary hover:underline"
                      >
                        {d.deviceCode}
                      </Link>
                    </TableCell>
                    <TableCell>{d.displayName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {d.siteName ?? "—"}
                    </TableCell>
                    <TableCell>
                      <IoTDeviceStatusBadge status={d.status} />
                    </TableCell>
                    <TableCell className="text-xs">
                      {d.currentFirmwareVersion ?? "—"}
                      {otaPending && (
                        <span className="ml-1 text-amber-600">
                          → {d.targetFirmwareVersion}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatRelativeTime(d.lastSeenAt)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
