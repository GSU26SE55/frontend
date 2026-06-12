import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, RotateCcw } from "lucide-react";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import {
  useAdminKbList,
  usePublishKbArticle,
  useArchiveKbArticle,
  useDeleteKbArticle,
} from "../hooks/useAdminKb";
import KbArticleTable from "../components/KbArticleTable";
import DataPagination from "@/shared/components/common/DataPagination";
import {
  KbArticleStatusEnum,
  KbArticleStatusLabel,
} from "@/shared/enums/kb.enum";
import type { KbArticleStatusEnum as KbStatus } from "@/shared/enums/kb.enum";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = Object.values(KbArticleStatusEnum).filter(
  (v): v is KbStatus => typeof v === "number",
);

const DEFAULTS = {
  keyword: "",
  status: "",
  pageNumber: 1,
  pageSize: PAGE_SIZE,
};

export default function KbListPage() {
  const navigate = useNavigate();
  const { filters, setFilter, resetFilters, hasActiveFilter } =
    useUrlFilters(DEFAULTS);

  const params = {
    keyword: filters.keyword || undefined,
    status: filters.status ? (Number(filters.status) as KbStatus) : undefined,
    pageNumber: filters.pageNumber,
    pageSize: filters.pageSize,
  };

  const { data, isLoading } = useAdminKbList(params);
  const { mutate: publish } = usePublishKbArticle();
  const { mutate: archive } = useArchiveKbArticle();
  const { mutate: deleteArticle } = useDeleteKbArticle();

  return (
    <div className="p-6 space-y-6 max-w-[1440px] mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            Admin &middot; Knowledge Base
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Knowledge Base
          </h1>
        </div>
        <Button onClick={() => navigate("/admin/kb/new")} className="gap-1.5">
          <Plus className="size-4" />
          Tạo bài viết
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <Input
          placeholder="Tìm theo tiêu đề, mã..."
          value={filters.keyword ?? ""}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFilter("keyword", e.target.value || undefined)
          }
          className="w-64"
        />

        <Select
          value={filters.status || null}
          onValueChange={(v: string | null) =>
            setFilter("status", v || undefined)
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Tất cả trạng thái" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value={null}>Tất cả trạng thái</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={String(s)}>
                {KbArticleStatusLabel[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilter && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <RotateCcw className="size-3.5 mr-1" />
            Xóa bộ lọc
          </Button>
        )}
      </div>

      <KbArticleTable
        data={data?.items ?? []}
        isLoading={isLoading}
        onPublish={(a) => publish(a.id)}
        onArchive={(a) => archive(a.id)}
        onDelete={(a) => deleteArticle(a.id)}
      />

      {data && (
        <DataPagination
          totalItems={data.totalItems}
          pageNumber={data.pageNumber}
          pageSize={data.pageSize}
          totalPages={data.totalPages}
          hasNextPage={data.hasNextPage}
          hasPreviousPage={data.hasPreviousPage}
          onPageChange={(p) => setFilter("pageNumber", p)}
        />
      )}
    </div>
  );
}
