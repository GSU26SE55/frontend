import { useState } from "react";
import { BatteryCharging, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { RevealInline } from "@/shared/motion/RevealInline";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useBatteryTypes } from "@/features/admin/hooks/battery/useBatteryTypes";
import {
  useDeleteBatteryType,
  useRestoreBatteryType,
} from "@/features/admin/hooks/battery/useBatteryTypesMutation";
import BatteryTypeTable from "@/features/admin/components/battery/BatteryTypeTable";
import BatteryTypeFormDialog from "@/features/admin/components/battery/BatteryTypeFormDialog";
import ThresholdConfigDialog from "@/features/admin/components/battery/ThresholdConfigDialog";
import {
  BatteryChemistryEnum,
  type BatteryTypeDto,
} from "@/features/admin/types/battery/battery-type.types";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { useUrlSort } from "@/shared/hooks/useUrlSort";
import { useDebouncedSearch } from "@/shared/hooks/useDebouncedSearch";
import DataPagination from "@/shared/components/ui/DataPagination";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";
import { DEFAULT_PAGE_SIZE } from "@/shared/constants/pagination";
import { noData, notFound } from "@/shared/constants/emptyStates";

const CHEMISTRY_LABELS: Record<BatteryChemistryEnum, string> = {
  [BatteryChemistryEnum.LI_FE_PO4]: "LiFePO4",
  [BatteryChemistryEnum.NMC]: "NMC",
  [BatteryChemistryEnum.NCA]: "NCA",
  [BatteryChemistryEnum.LCO]: "LCO",
  [BatteryChemistryEnum.OTHER]: "Other",
};

const DEFAULTS = {
  keyword: "",
  chemistry: "",
  includeDeleted: false,
  sortBy: "",
  sortDir: "",
  pageNumber: 1,
  pageSize: DEFAULT_PAGE_SIZE,
};

type ConfirmState =
  | { type: "none" }
  | { type: "delete"; item: BatteryTypeDto }
  | { type: "restore"; item: BatteryTypeDto };

export default function BatteryTypesPage() {
  const { filters, setFilter, setFilters, resetFilters, hasActiveFilter } =
    useUrlFilters(DEFAULTS);
  const search = useDebouncedSearch(filters.keyword ?? "", (kw) =>
    setFilter("keyword", kw),
  );
  const sort = useUrlSort(filters.sortBy, filters.sortDir, setFilters);
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
    chemistry: filters.chemistry
      ? (Number(filters.chemistry) as BatteryChemistryEnum)
      : undefined,
    includeDeleted: filters.includeDeleted || undefined,
    sortBy: filters.sortBy || undefined,
    sortDir: filters.sortDir || undefined,
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
    <PageContainer>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            Admin &middot; Configure
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Battery types &amp; Alert thresholds
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? "..." : totalItems} battery types &mdash; manage
            battery types and alert thresholds.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleCreate}>
            <Plus className="size-3.5" /> Create battery type
          </Button>
          <RefreshButton queryKeys={[KEY.batteryTypes]} />
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by battery type name..."
            value={search.value}
            onChange={search.onChange}
            className="pl-8"
          />
        </div>
        <Select
          value={filters.chemistry || null}
          items={[
            { value: null, label: "All chemistries" },
            ...Object.entries(CHEMISTRY_LABELS).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
          onValueChange={(v) => setFilter("chemistry", v || undefined)}
        >
          <SelectTrigger size="sm" className="w-40">
            <SelectValue placeholder="Chemistry" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value={null}>All chemistries</SelectItem>
            {Object.entries(CHEMISTRY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox
            checked={!!filters.includeDeleted}
            onCheckedChange={(checked) =>
              setFilter("includeDeleted", checked === true || undefined)
            }
          />
          <span className="text-muted-foreground">
            {filters.includeDeleted ? "Hide deleted" : "Show deleted"}
          </span>
        </label>
        <RevealInline show={hasActiveFilter}>
          <Button size="sm" variant="ghost" onClick={resetFilters}>
            Clear filters
          </Button>
        </RevealInline>
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
            <span className="text-sm">
              {hasActiveFilter
                ? notFound("battery types")
                : noData("battery types")}
            </span>
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
            sort={sort}
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
            <AlertDialogTitle>Delete battery type?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmState.type === "delete" && (
                <>
                  Are you sure you want to delete battery type{" "}
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
              Delete
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
            <AlertDialogTitle>Restore battery type?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmState.type === "restore" && (
                <>
                  Are you sure you want to restore battery type{" "}
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
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
