import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  useSiteList,
  useDeleteSite,
  useRestoreSite,
} from "@/features/admin/hooks/useSites";
import SiteTable from "@/features/admin/components/SiteTable";
import SiteFormDialog from "@/features/admin/components/SiteFormDialog";
import type { SiteDto } from "@/shared/types/site.types";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";

const DEFAULTS = {
  keyword: "",
  includeDeleted: false,
  pageNumber: 1,
  pageSize: 10,
};

export default function SiteListPage() {
  const { filters, setFilter, resetFilters, hasActiveFilter } =
    useUrlFilters(DEFAULTS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState<SiteDto | null>(null);

  const { data, isLoading } = useSiteList({
    pageNumber: filters.pageNumber,
    pageSize: filters.pageSize,
    keyword: filters.keyword || undefined,
    includeDeleted: filters.includeDeleted || undefined,
  });
  const { mutate: deleteSite } = useDeleteSite();
  const { mutate: restoreSite } = useRestoreSite();

  const handleEdit = (site: SiteDto) => {
    setEditData(site);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditData(null);
    setDialogOpen(true);
  };

  const handleDelete = (site: SiteDto) => {
    if (confirm(`Xoá site "${site.name}"?`)) deleteSite(site.id);
  };

  const handleRestore = (site: SiteDto) => {
    if (confirm(`Khôi phục site "${site.name}"?`)) restoreSite(site.id);
  };

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý Site</h1>
        <Button onClick={handleCreate}>Tạo site</Button>
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Tìm theo tên site..."
          value={filters.keyword}
          onChange={(e) => setFilter("keyword", e.target.value || undefined)}
          className="max-w-sm"
        />
        <Button
          variant={filters.includeDeleted ? "default" : "outline"}
          onClick={() =>
            setFilter("includeDeleted", !filters.includeDeleted || undefined)
          }
        >
          {filters.includeDeleted ? "Ẩn đã xoá" : "Hiện đã xoá"}
        </Button>
        {hasActiveFilter && (
          <Button variant="ghost" onClick={resetFilters}>
            Xóa bộ lọc
          </Button>
        )}
      </div>

      <SiteTable
        data={data?.items ?? []}
        totalItems={data?.totalItems ?? 0}
        totalPages={data?.totalPages ?? 1}
        hasNextPage={data?.hasNextPage ?? false}
        hasPreviousPage={data?.hasPreviousPage ?? false}
        pageNumber={filters.pageNumber}
        pageSize={filters.pageSize}
        isLoading={isLoading}
        onPageChange={(p) => setFilter("pageNumber", p)}
        onPageSizeChange={(s) => setFilter("pageSize", s)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRestore={handleRestore}
      />

      <SiteFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editData={editData}
      />
    </div>
  );
}
