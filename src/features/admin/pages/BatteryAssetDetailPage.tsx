import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Battery,
  Pencil,
  ArrowRightLeft,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useBatteryAsset } from "@/features/admin/hooks/useBatteryAsset";
import { useDeleteBatteryAsset } from "@/features/admin/hooks/useDeleteBatteryAsset";
import { useBatteryAssetRealtime } from "@/features/admin/hooks/useBatteryAssetRealtime";
import BatteryAssetForm from "@/features/admin/components/BatteryAssetForm";
import TransferOwnerDialog from "@/features/admin/components/TransferOwnerDialog";
import SensorChart from "@/features/admin/components/SensorChart";
import SensorHistoryTable from "@/features/admin/components/SensorHistoryTable";
import CascadeRiskCard from "@/features/admin/components/CascadeRiskCard";
import {
  BatteryStatusEnum,
  ChargingStateEnum,
} from "@/features/admin/types/battery-asset.types";
import { RefreshButton } from "@/shared/components/common/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  BatteryStatusEnum,
  { label: string; dot: string; badge: string }
> = {
  [BatteryStatusEnum.Active]: {
    label: "Hoạt động",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  [BatteryStatusEnum.Inactive]: {
    label: "Không hoạt động",
    dot: "bg-muted-foreground",
    badge: "bg-muted text-muted-foreground border-border",
  },
  [BatteryStatusEnum.Decommissioned]: {
    label: "Ngừng sử dụng",
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-600 border-red-200",
  },
};

const CHARGING_LABELS: Record<ChargingStateEnum, string> = {
  [ChargingStateEnum.IDLE]: "Nghỉ",
  [ChargingStateEnum.CHARGING]: "Đang nạp",
  [ChargingStateEnum.DISCHARGING]: "Đang xả",
  [ChargingStateEnum.FLOAT]: "Float",
  [ChargingStateEnum.BYPASS]: "Bypass",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtDate = (s: string) =>
  format(new Date(s), "dd/MM/yyyy", { locale: vi });
const fmtNum = (v: number | null | undefined, dec = 1) =>
  v != null ? v.toFixed(dec) : "—";

// ── Sub-components ────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-xs font-medium text-right leading-relaxed">
        {value ?? <span className="text-muted-foreground/50">—</span>}
      </span>
    </div>
  );
}

function StatTile({
  label,
  value,
  unit,
  className,
}: {
  label: string;
  value: string;
  unit: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg p-3 flex flex-col gap-1", className)}>
      <div className="flex items-baseline gap-1 leading-none">
        <span className="text-2xl font-bold tabular-nums tracking-tight">
          {value}
        </span>
        {unit && <span className="text-xs font-medium opacity-60">{unit}</span>}
      </div>
      <span className="text-[11px] opacity-60">{label}</span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BatteryAssetDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: asset, isLoading } = useBatteryAsset(id);
  const { data: rt } = useBatteryAssetRealtime(id);
  const { mutate: deleteAsset } = useDeleteBatteryAsset();

  const handleDelete = () => {
    deleteAsset(id, {
      onSuccess: () => {
        toast.success("Đã xóa battery asset");
        navigate("/admin/battery-assets");
      },
    });
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-6 h-[calc(100vh-65px)]">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="flex-1 rounded-xl" />
      </div>
    );
  }

  // Not found
  if (!asset) {
    return (
      <div className="p-6 flex flex-col items-center gap-3 text-muted-foreground pt-20">
        <Battery className="size-8 opacity-30" />
        <span className="text-sm">Không tìm thấy battery asset.</span>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} /> Quay lại
        </Button>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[asset.status];

  // Realtime color logic
  const sohCls =
    rt?.sohPercent == null
      ? "bg-muted/60 text-foreground"
      : rt.sohPercent >= 80
        ? "bg-emerald-50 text-emerald-800"
        : rt.sohPercent >= 60
          ? "bg-amber-50 text-amber-800"
          : "bg-red-50 text-red-700";

  const socCls =
    rt?.socPercent == null
      ? "bg-muted/60 text-foreground"
      : rt.socPercent >= 50
        ? "bg-blue-50 text-blue-800"
        : rt.socPercent >= 20
          ? "bg-amber-50 text-amber-800"
          : "bg-red-50 text-red-700";

  const tempCls =
    rt?.temperature == null
      ? "bg-muted/60 text-foreground"
      : rt.temperature < 40
        ? "bg-sky-50 text-sky-800"
        : rt.temperature < 50
          ? "bg-amber-50 text-amber-800"
          : "bg-red-50 text-red-700";

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] overflow-hidden">
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="px-6 py-3 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon-sm"
            className="-ml-1"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={16} />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold font-mono tracking-tight leading-none">
                {asset.serialNumber}
              </h1>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border",
                  statusCfg.badge,
                )}
              >
                <span className={cn("size-1.5 rounded-full", statusCfg.dot)} />
                {statusCfg.label}
              </span>
              {rt && rt.activeAlerts > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-red-50 text-red-600 border-red-200">
                  {rt.activeAlerts} cảnh báo
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {asset.batteryTypeName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <RefreshButton queryKeys={[KEY.batteryAssets]} size="icon" />
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil size={13} /> Sửa
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTransferOpen(true)}
          >
            <ArrowRightLeft size={13} /> Transfer
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 size={13} /> Xóa
          </Button>
        </div>
      </div>

      {/* ── Main panel ──────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 px-6 pb-6">
        <div className="flex h-full border border-border rounded-xl overflow-hidden bg-card">
          {/* Left sidebar */}
          <div className="w-[260px] shrink-0 border-r border-border flex flex-col overflow-y-auto">
            {/* Info */}
            <div className="px-4 pt-4 pb-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Thông tin
              </p>
              <div className="divide-y divide-border/50">
                <InfoRow label="Khách hàng" value={asset.customerName} />
                <InfoRow label="Site" value={asset.siteName} />
                <InfoRow label="Vị trí" value={asset.location} />
                <InfoRow
                  label="Ngày lắp đặt"
                  value={asset.installDate ? fmtDate(asset.installDate) : null}
                />
                <InfoRow
                  label="Hết bảo hành"
                  value={
                    asset.warrantyEndDate
                      ? fmtDate(asset.warrantyEndDate)
                      : null
                  }
                />
                <InfoRow
                  label="Đọc cuối"
                  value={
                    asset.lastSensorReadingAt
                      ? new Date(asset.lastSensorReadingAt).toLocaleString(
                          "vi-VN",
                        )
                      : null
                  }
                />
              </div>
            </div>

            <Separator />

            {/* Realtime */}
            <div className="px-4 py-4 flex-1">
              <div className="flex items-center gap-2 mb-4">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Realtime
                </p>
                {rt && (
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                )}
              </div>

              {!rt ? (
                <p className="text-xs text-muted-foreground">
                  Chưa có dữ liệu sensor
                </p>
              ) : (
                <div className="space-y-2">
                  {rt.time && (
                    <p className="text-[10.5px] text-muted-foreground -mt-1 mb-2">
                      {new Date(rt.time).toLocaleString("vi-VN")}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <StatTile
                      label="Điện áp"
                      value={fmtNum(rt.voltage)}
                      unit="V"
                      className="bg-muted/50 text-foreground"
                    />
                    <StatTile
                      label="Dòng điện"
                      value={fmtNum(rt.current)}
                      unit="A"
                      className="bg-muted/50 text-foreground"
                    />
                    <StatTile
                      label="Nhiệt độ"
                      value={fmtNum(rt.temperature)}
                      unit="°C"
                      className={tempCls}
                    />
                    <StatTile
                      label="SOC"
                      value={fmtNum(rt.socPercent, 0)}
                      unit="%"
                      className={socCls}
                    />
                    <StatTile
                      label="SOH"
                      value={fmtNum(rt.sohPercent, 0)}
                      unit="%"
                      className={sohCls}
                    />
                    <StatTile
                      label="Chu kỳ"
                      value={
                        rt.cycleCount != null ? String(rt.cycleCount) : "—"
                      }
                      unit=""
                      className="bg-muted/50 text-foreground"
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 mt-1">
                    <span className="text-[10.5px] text-muted-foreground">
                      Nạp / Xả
                    </span>
                    <span className="text-[10.5px] font-medium">
                      {rt.chargingState != null
                        ? (CHARGING_LABELS[
                            rt.chargingState as ChargingStateEnum
                          ] ?? `#${rt.chargingState}`)
                        : "—"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: chart / history tabs */}
          <div className="flex-1 flex flex-col min-w-0">
            <Tabs defaultValue="chart" className="h-full gap-0">
              <div className="px-5 py-3 border-b border-border shrink-0">
                <TabsList>
                  <TabsTrigger value="chart">Biểu đồ</TabsTrigger>
                  <TabsTrigger value="history">Lịch sử cảm biến</TabsTrigger>
                  <TabsTrigger value="cascade">Rủi ro lan truyền</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent
                value="chart"
                className="min-h-0 overflow-hidden m-0"
              >
                <SensorChart assetId={id} fillHeight />
              </TabsContent>
              <TabsContent
                value="history"
                className="min-h-0 overflow-hidden m-0"
              >
                <SensorHistoryTable assetId={id} fillHeight />
              </TabsContent>
              <TabsContent
                value="cascade"
                className="min-h-0 overflow-y-auto m-0 p-5"
              >
                <CascadeRiskCard assetId={id} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* ── Dialogs ─────────────────────────────────────────────────────────── */}
      <BatteryAssetForm
        open={editOpen}
        onOpenChange={setEditOpen}
        editData={asset}
      />
      <TransferOwnerDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        assetId={id}
        currentCustomerId={asset.customerId}
      />
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa battery asset?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa <strong>{asset.serialNumber}</strong>? Hành
              động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel />
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
