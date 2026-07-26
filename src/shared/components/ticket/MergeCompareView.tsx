import { useState } from "react";
import { AlertTriangleIcon, ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import TicketStatusBadge from "@/shared/components/ticket/TicketStatusBadge";
import CompareFieldTable from "@/shared/components/ticket/CompareFieldTable";
import { buildCompareRows } from "@/shared/utils/ticket/compareRows";
import CompareEvidencePanel from "@/shared/components/ticket/CompareEvidencePanel";
import { useMergeCandidates } from "@/shared/hooks/ticket/useMergeCandidates";
import { useBatteryAsset } from "@/shared/hooks/battery/useBatteryAsset";
import type {
  TicketDTO,
  TicketDetailDTO,
} from "@/shared/types/ticket/ticket.types";

export interface MergeCompareViewProps {
  /** Ticket sẽ bị gộp (đóng lại). */
  source: TicketDetailDTO | undefined;
  isLoadingSource: boolean;
  /** Ticket đích đang chọn (giữ lại) — undefined khi chưa chọn. */
  target: TicketDetailDTO | undefined;
  isLoadingTarget: boolean;
  /** Danh sách ticket thô để lọc ứng viên. */
  tickets: TicketDTO[] | undefined;
  isLoadingTickets: boolean;
  targetId: string;
  onTargetIdChange: (id: string) => void;
  onBack: () => void;
  onMerge: () => void;
  isMerging: boolean;
}

/**
 * Trang so sánh 2 ticket trước khi gộp. Gộp là thao tác KHÔNG hoàn tác được
 * (ticket nguồn đóng vĩnh viễn) nên Manager phải đối chiếu đủ dữ kiện trước khi xác nhận.
 *
 * Component thuần UI — data đến qua props để `shared/` không phụ thuộc `features/`
 * (admin và manager có hook riêng, cùng dùng lại view này).
 */
export default function MergeCompareView({
  source,
  isLoadingSource,
  target,
  isLoadingTarget,
  tickets,
  isLoadingTickets,
  targetId,
  onTargetIdChange,
  onBack,
  onMerge,
  isMerging,
}: MergeCompareViewProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const candidates = useMergeCandidates(
    tickets,
    source?.id ?? "",
    source?.suspectedDuplicateOfTicketId,
  );

  // Ticket chỉ có customerId (GUID) — tên khách hàng lấy từ battery asset.
  // Hook tự disable khi thiếu id, và 2 ticket cùng pin sẽ dùng chung cache.
  const { data: sourceAsset } = useBatteryAsset(source?.batteryAssetId);
  const { data: targetAsset } = useBatteryAsset(target?.batteryAssetId);

  if (isLoadingSource || !source) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const rows = target
    ? buildCompareRows(source, target, {
        source: sourceAsset?.customerName,
        target: targetAsset?.customerName,
      })
    : [];
  const diffBattery =
    !!target && (source.batteryAssetId ?? "") !== (target.batteryAssetId ?? "");
  const diffCustomer = !!target && source.customerId !== target.customerId;
  const hasCriticalDiff = diffBattery || diffCustomer;

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeftIcon className="size-4" />
          Quay lại
        </Button>
        <div>
          <h1 className="text-lg font-semibold">
            So sánh trước khi gộp ticket
          </h1>
          <p className="text-sm text-muted-foreground">
            Đối chiếu kỹ 2 ticket — thao tác gộp không thể hoàn tác.
          </p>
        </div>
      </div>

      {/* ── Chọn ticket đích ───────────────────────────────────────────── */}
      <Card>
        <CardContent className="space-y-2 pt-6">
          <Label>Chọn ticket đích (được giữ lại)</Label>
          <Select
            value={targetId || undefined}
            onValueChange={(v) => onTargetIdChange(v ?? "")}
            items={candidates.map((t) => ({
              value: t.id,
              label: `${t.id === source.suspectedDuplicateOfTicketId ? "⭐ " : ""}${t.code} — ${t.title}`,
            }))}
          >
            <SelectTrigger className="w-full min-w-0">
              <SelectValue
                className="min-w-0 truncate"
                placeholder={
                  isLoadingTickets
                    ? "Đang tải ticket…"
                    : "Chọn ticket để gộp vào…"
                }
              />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              {candidates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.id === source.suspectedDuplicateOfTicketId ? "⭐ " : ""}
                  {t.code} — {t.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {source.suspectedDuplicateOfTicketId && (
            <p className="text-xs text-amber-600">
              ⭐ AI gợi ý: ticket nghi trùng đã được chọn sẵn.
            </p>
          )}
        </CardContent>
      </Card>

      {!targetId ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Chọn một ticket đích ở trên để bắt đầu so sánh.
          </CardContent>
        </Card>
      ) : isLoadingTarget || !target ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <>
          {/* ── Cảnh báo gộp nhầm (chỉ cảnh báo, không chặn) ───────────── */}
          {hasCriticalDiff && (
            <div className="flex gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
              <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
              <div>
                <p className="font-medium text-destructive">
                  Cảnh báo: 2 ticket có dấu hiệu KHÔNG cùng một sự cố
                </p>
                <ul className="mt-1 list-inside list-disc text-muted-foreground">
                  {diffBattery && <li>Khác cục pin</li>}
                  {diffCustomer && <li>Khác khách hàng</li>}
                </ul>
              </div>
            </div>
          )}

          {/* ── Tiêu đề 2 cột ──────────────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Card className="border-muted-foreground/30">
              <CardHeader className="pb-3">
                <p className="text-xs font-medium text-muted-foreground">
                  SẼ BỊ GỘP (đóng lại)
                </p>
                <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                  {source.code}
                  <TicketStatusBadge status={source.status} />
                </CardTitle>
                <p className="text-sm text-muted-foreground">{source.title}</p>
              </CardHeader>
            </Card>
            <Card className="border-primary/40">
              <CardHeader className="pb-3">
                <p className="text-xs font-medium text-primary">ĐƯỢC GIỮ LẠI</p>
                <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                  {target.code}
                  <TicketStatusBadge status={target.status} />
                </CardTitle>
                <p className="text-sm text-muted-foreground">{target.title}</p>
              </CardHeader>
            </Card>
          </div>

          {/* ── 1. Bảng đối chiếu trường cơ bản ────────────────────────── */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Đối chiếu thông tin</CardTitle>
            </CardHeader>
            <CardContent>
              <CompareFieldTable rows={rows} />
            </CardContent>
          </Card>

          {/* ── 2. Nhận định AI ────────────────────────────────────────── */}
          {(source.duplicateReason ||
            source.aiVerifyReason ||
            target.aiVerifyReason) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Nhận định của AI</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {source.duplicateReason && (
                  <div className="rounded-md bg-amber-50 p-3 text-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
                    <p className="text-xs font-medium">Lý do nghi trùng</p>
                    <p className="mt-0.5">{source.duplicateReason}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      {source.code} — AI kiểm tra
                    </p>
                    <p className="mt-0.5">
                      {source.aiVerifyReason ?? "Không có nhận định."}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      {target.code} — AI kiểm tra
                    </p>
                    <p className="mt-0.5">
                      {target.aiVerifyReason ?? "Không có nhận định."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── 3. Mô tả đầy đủ ────────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Mô tả sự cố</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {source.code}
                </p>
                <p className="mt-1 whitespace-pre-wrap">
                  {source.description || "Không có mô tả."}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {target.code}
                </p>
                <p className="mt-1 whitespace-pre-wrap">
                  {target.description || "Không có mô tả."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* ── 4. Bằng chứng cảm biến ─────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                Bằng chứng cảm biến (±15 phút quanh lúc phát hiện)
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <CompareEvidencePanel
                assetId={source.batteryAssetId}
                detectedAt={source.detectedAt}
                title={source.code}
              />
              <CompareEvidencePanel
                assetId={target.batteryAssetId}
                detectedAt={target.detectedAt}
                title={target.code}
              />
            </CardContent>
          </Card>

          {/* ── Xác nhận ───────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-end gap-2 pb-4">
            <Button variant="outline" onClick={onBack}>
              Hủy
            </Button>
            <Button onClick={() => setConfirmOpen(true)} disabled={isMerging}>
              Gộp {source.code}
              <ArrowRightIcon className="size-4" />
              {target.code}
            </Button>
          </div>

          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xác nhận gộp ticket?</AlertDialogTitle>
                <AlertDialogDescription>
                  Ticket <strong>{source.code}</strong> sẽ bị{" "}
                  <strong>đóng vĩnh viễn</strong> và gộp vào{" "}
                  <strong>{target.code}</strong>. Thao tác này không thể hoàn
                  tác.
                  {hasCriticalDiff && (
                    <>
                      {" "}
                      Lưu ý: 2 ticket này {diffBattery && "khác cục pin"}
                      {diffBattery && diffCustomer && " và "}
                      {diffCustomer && "khác khách hàng"}.
                    </>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmOpen(false)}>
                  Hủy
                </AlertDialogCancel>
                <AlertDialogAction
                  variant={hasCriticalDiff ? "destructive" : "default"}
                  disabled={isMerging}
                  onClick={() => {
                    setConfirmOpen(false);
                    onMerge();
                  }}
                >
                  {isMerging ? "Đang gộp…" : "Gộp ticket"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
