import { useState } from "react";
import { MapPin, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/shared/components/ui/ErrorState";
import { EmptyState } from "@/shared/components/ui/EmptyState";
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
import {
  useSiteList,
  useDeleteSite,
  useRestoreSite,
} from "@/features/admin/hooks/site/useSites";
import SiteTable from "@/features/admin/components/site/SiteTable";
import SiteFormDialog from "@/features/admin/components/site/SiteFormDialog";
import type { SiteDto } from "@/shared/types/site/site.types";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { useUrlSort } from "@/shared/hooks/useUrlSort";
import { useDebouncedSearch } from "@/shared/hooks/useDebouncedSearch";
import DataPagination from "@/shared/components/ui/DataPagination";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";
import { loadFailed, noData } from "@/shared/constants/emptyStates";

const DEFAULTS = {
  keyword: "",
  includeDeleted: false,
  sortBy: "",
  sortDir: "",
  pageNumber: 1,
  pageSize: 10,
};

type ConfirmState =
  | { type: "none" }
  | { type: "delete"; site: SiteDto }
  | { type: "restore"; site: SiteDto };

export default function SiteListPage() {
  const { filters, setFilter, resetFilters, hasActiveFilter } =
    useUrlFilters(DEFAULTS);
  const search = useDebouncedSearch(filters.keyword ?? "", (kw) =>
    setFilter("keyword", kw),
  );
  const sort = useUrlSort(filters.sortBy, filters.sortDir, setFilter);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState<SiteDto | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    type: "none",
  });

  const { data, isLoading, isError, refetch } = useSiteList({
    pageNumber: filters.pageNumber,
    pageSize: filters.pageSize,
    keyword: filters.keyword || undefined,
    includeDeleted: filters.includeDeleted || undefined,
    sortBy: filters.sortBy || undefined,
    sortDir: filters.sortDir || undefined,
  });
  const { mutate: deleteSite } = useDeleteSite();
  const { mutate: restoreSite } = useRestoreSite();
  const items = data?.items ?? [];
  const totalItems = data?.totalItems ?? 0;

  const handleEdit = (site: SiteDto) => {
    setEditData(site);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditData(null);
    setDialogOpen(true);
  };

  const handleDelete = (site: SiteDto) => {
    setConfirmState({ type: "delete", site });
  };

  const handleRestore = (site: SiteDto) => {
    setConfirmState({ type: "restore", site });
  };

  const closeConfirm = () => setConfirmState({ type: "none" });

  return (
    <div className="p-6 space-y-6 max-w-360 mx-auto">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            Admin &middot; Tài sản
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Quản lý Site
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? "..." : totalItems} site &mdash; quản lý site khách
            hàng.
          </p>
        </div>
        <div className="flex gap-2">
          <RefreshButton queryKeys={[KEY.sites]} />
          <Button size="sm" onClick={handleCreate}>
            <Plus className="size-3.5" /> Tạo site
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên site..."
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
        ) : isError ? (
          <ErrorState message={loadFailed("site")} onRetry={() => refetch()} />
        ) : items.length === 0 ? (
          <EmptyState icon={MapPin} title={noData("site")} />
        ) : (
          <SiteTable
            data={items}
            pageNumber={filters.pageNumber}
            pageSize={filters.pageSize}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onRestore={handleRestore}
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

      <SiteFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editData={editData}
      />

      <AlertDialog
        open={confirmState.type === "delete"}
        onOpenChange={(open) => !open && closeConfirm()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa site?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmState.type === "delete" && (
                <>
                  Bạn có chắc muốn xóa site{" "}
                  <strong>{confirmState.site.name}</strong>?
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
                  deleteSite(confirmState.site.id);
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
            <AlertDialogTitle>Khôi phục site?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmState.type === "restore" && (
                <>
                  Bạn có chắc muốn khôi phục site{" "}
                  <strong>{confirmState.site.name}</strong>?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeConfirm} />
            <AlertDialogAction
              onClick={() => {
                if (confirmState.type === "restore") {
                  restoreSite(confirmState.site.id);
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
