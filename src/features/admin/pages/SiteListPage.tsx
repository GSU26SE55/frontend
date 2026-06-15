import { useState } from "react";
import { MapPin, Plus, Search } from "lucide-react";
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
import {
  useSiteList,
  useDeleteSite,
  useRestoreSite,
} from "@/features/admin/hooks/useSites";
import SiteTable from "@/features/admin/components/SiteTable";
import SiteFormDialog from "@/features/admin/components/SiteFormDialog";
import type { SiteDto } from "@/shared/types/site.types";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import DataPagination from "@/shared/components/common/DataPagination";

const DEFAULTS = {
  keyword: "",
  includeDeleted: false,
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState<SiteDto | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    type: "none",
  });

  const { data, isLoading } = useSiteList({
    pageNumber: filters.pageNumber,
    pageSize: filters.pageSize,
    keyword: filters.keyword || undefined,
    includeDeleted: filters.includeDeleted || undefined,
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
    <div className="p-6 space-y-6 max-w-[1440px] mx-auto">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            Admin &middot; Tài sản
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Quản lý Site
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? "..." : totalItems} site.
          </p>
        </div>
        <Button size="sm" onClick={handleCreate}>
          <Plus className="size-3.5" /> Tạo site
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên site..."
            value={filters.keyword}
            onChange={(e) => setFilter("keyword", e.target.value || undefined)}
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
            <MapPin className="size-8 opacity-30" />
            <span className="text-sm">Chưa có site nào.</span>
          </div>
        ) : (
          <SiteTable
            data={items}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onRestore={handleRestore}
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
