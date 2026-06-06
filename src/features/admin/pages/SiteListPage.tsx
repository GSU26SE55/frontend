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
import type { SiteDto, SiteFilterParams } from "@/shared/types/site.types";

export default function SiteListPage() {
  const [params, setParams] = useState<SiteFilterParams>({
    pageNumber: 1,
    pageSize: 10,
  });
  const [keyword, setKeyword] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState<SiteDto | null>(null);
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const { data, isLoading } = useSiteList(params);
  const { mutate: deleteSite } = useDeleteSite();
  const { mutate: restoreSite } = useRestoreSite();

  const handleSearch = () => {
    setParams((p) => ({ ...p, pageNumber: 1, keyword: keyword || undefined }));
  };

  const handleEdit = (site: SiteDto) => {
    setEditData(site);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditData(null);
    setDialogOpen(true);
  };

  const handleDelete = (site: SiteDto) => {
    if (confirm(`Xoá site "${site.name}"?`)) {
      deleteSite(site.id);
    }
  };

  const handleRestore = (site: SiteDto) => {
    if (confirm(`Khôi phục site "${site.name}"?`)) {
      restoreSite(site.id);
    }
  };

  const toggleDeleted = () => {
    setIncludeDeleted((v) => {
      const next = !v;
      setParams((p) => ({
        ...p,
        pageNumber: 1,
        includeDeleted: next || undefined,
      }));
      return next;
    });
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
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={handleSearch}>
          Tìm
        </Button>
        <Button
          variant={includeDeleted ? "default" : "outline"}
          onClick={toggleDeleted}
        >
          {includeDeleted ? "Ẩn đã xoá" : "Hiện đã xoá"}
        </Button>
      </div>

      <SiteTable
        data={data?.items ?? []}
        totalCount={data?.totalItems ?? 0}
        pageNumber={params.pageNumber ?? 1}
        pageSize={params.pageSize ?? 10}
        isLoading={isLoading}
        onPageChange={(page) => setParams((p) => ({ ...p, pageNumber: page }))}
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
