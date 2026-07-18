import { useState } from "react";
import { BatteryCharging, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useBatteryTypes } from "@/features/admin/hooks/useBatteryTypes";
import {
  useDeleteBatteryType,
  useRestoreBatteryType,
} from "@/features/admin/hooks/useBatteryTypesMutation";
import BatteryTypeTable from "@/features/admin/components/BatteryTypeTable";
import BatteryTypeFormDialog from "@/features/admin/components/BatteryTypeFormDialog";
import ThresholdConfigDialog from "@/features/admin/components/ThresholdConfigDialog";
import type { BatteryTypeDto } from "@/features/admin/types/battery-type.types";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { useDebouncedSearch } from "@/shared/hooks/useDebouncedSearch";
import DataPagination from "@/shared/components/ui/DataPagination";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";

const DEFAULTS = {
  keyword: "",
  includeDeleted: false,
  pageNumber: 1,
  pageSize: 10,
};

type ConfirmState =
  | { type: "none" }
  | { type: "delete"; item: BatteryTypeDto }
  | { type: "restore"; item: BatteryTypeDto };

export default function BatteryTypesPage() {
  const { filters, setFilter, resetFilters, hasActiveFilter } =
    useUrlFilters(DEFAULTS);
  const search = useDebouncedSearch(filters.keyword ?? "", (kw) =>
    setFilter("keyword", kw),
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState<BatteryTypeDto | null>(null);
  const [thresholdTarget, setThresholdTarget] = useState<BatteryTypeDto | null>(
    null,
  );
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    type: "none",
  });

  const { data, isLoading } = useBatteryTypes({
    pageNumber: filters.pageNumber,
    pageSize: filters.pageSize,
    keyword: filters.keyword || undefined,
    includeDeleted: filters.includeDeleted || undefined,
  });
  const { mutate: deleteType } = useDeleteBatteryType();
  const { mutate: restoreType } = useRestoreBatteryType();
  const items = data?.items ?? [];
  const totalItems = data?.totalItems ?? 0;

  const handleCreate = () => {
    setEditData(null);
    setDialogOpen(true);
  };

  const handleEdit = (item: BatteryTypeDto) => {
    setEditData(item);
    setDialogOpen(true);
  };

  const closeConfirm = () => setConfirmState({ type: "none" });

  return (
    <div className="p-6 space-y-6 max-w-360 mx-auto">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            Admin &middot; Hạ tầng pin
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Loại pin &amp; Ngưỡng cảnh báo
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? "..." : totalItems} loại pin &mdash; quản lý loại pin
            và ngưỡng cảnh báo.
          </p>
        </div>
        <div className="flex gap-2">
          <RefreshButton queryKeys={[KEY.batteryTypes]} />
          <Button size="sm" onClick={handleCreate}>
            <Plus className="size-3.5" /> Tạo loại pin
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên loại pin..."
            value={search.value}
            onChange={search.onChange}
            className="pl-8"
          />
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox
            checked={!!filters.includeDeleted}
            onCheckedChange={(checked) =>
              setFilter("includeDeleted", checked === true || undefined)
            }
          />
          <span className="text-muted-foreground">
            {filters.includeDeleted ? "Ẩn đã xoá" : "Hiển thị đã xoá"}
          </span>
        </label>
        {hasActiveFilter && (
          <Button size="sm" variant="ghost" onClick={resetFilters}>
            Xóa bộ lọc
          </Button>
        )}
      </div>

      <Card className="gap-0 py-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
            <BatteryCharging className="size-8 opacity-30" />
            <span className="text-sm">Chưa có loại pin nào.</span>
          </div>
        ) : (
          <BatteryTypeTable
            data={items}
            pageNumber={filters.pageNumber}
            pageSize={filters.pageSize}
            showRestore={!!filters.includeDeleted}
            onEdit={handleEdit}
            onDelete={(item) => setConfirmState({ type: "delete", item })}
            onRestore={(item) => setConfirmState({ type: "restore", item })}
            onConfigThreshold={setThresholdTarget}
          />
        )}
      </Card>

      <DataPagination
        totalItems={totalItems}
        totalPages={data?.totalPages ?? 1}
        hasNextPage={data?.hasNextPage ?? false}
        hasPreviousPage={data?.hasPreviousPage ?? false}
        pageNumber={filters.pageNumber}
        pageSize={filters.pageSize}
        onPageChange={(p) => setFilter("pageNumber", p)}
        onPageSizeChange={(s) => setFilter("pageSize", s)}
      />

      <BatteryTypeFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editData={editData}
      />

      <ThresholdConfigDialog
        open={!!thresholdTarget}
        onOpenChange={(open) => !open && setThresholdTarget(null)}
        batteryType={thresholdTarget}
      />

      <AlertDialog
        open={confirmState.type === "delete"}
        onOpenChange={(open) => !open && closeConfirm()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa loại pin?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmState.type === "delete" && (
                <>
                  Bạn có chắc muốn xóa loại pin{" "}
                  <strong>{confirmState.item.name}</strong>?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeConfirm} />
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (confirmState.type === "delete") {
                  deleteType(confirmState.item.id);
                }
                closeConfirm();
              }}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={confirmState.type === "restore"}
        onOpenChange={(open) => !open && closeConfirm()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Khôi phục loại pin?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmState.type === "restore" && (
                <>
                  Bạn có chắc muốn khôi phục loại pin{" "}
                  <strong>{confirmState.item.name}</strong>?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeConfirm} />
            <AlertDialogAction
              onClick={() => {
                if (confirmState.type === "restore") {
                  restoreType(confirmState.item.id);
                }
                closeConfirm();
              }}
            >
              Khôi phục
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
