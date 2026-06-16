import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { useDebouncedSearch } from "@/shared/hooks/useDebouncedSearch";
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
  const search = useDebouncedSearch(filters.keyword ?? "", (kw) =>
    setFilter("keyword", kw),
  );

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
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            Admin &middot; Knowledge Base
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Knowledge Base
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? "..." : (data?.totalItems ?? 0)} bài viết &mdash; quản
            lý kho tri thức
          </p>
        </div>
        <Button size="sm" onClick={() => navigate("/admin/kb/new")}>
          <Plus className="size-3.5" /> Tạo bài viết
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tiêu đề, mã..."
            value={search.value}
            onChange={search.onChange}
            className="pl-8"
          />
        </div>

        <Select
          value={filters.status || null}
          items={[
            { value: null, label: "Tất cả trạng thái" },
            ...STATUS_OPTIONS.map((s) => ({
              value: String(s),
              label: KbArticleStatusLabel[s],
            })),
          ]}
          onValueChange={(v: string | null) =>
            setFilter("status", v || undefined)
          }
        >
          <SelectTrigger size="sm" className="w-44">
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
          <Button size="sm" variant="ghost" onClick={resetFilters}>
            Xóa bộ lọc
          </Button>
        )}
      </div>

      <Card className="gap-0 py-0 overflow-hidden">
        <KbArticleTable
          data={data?.items ?? []}
          isLoading={isLoading}
          pageNumber={data?.pageNumber ?? 1}
          pageSize={data?.pageSize ?? 10}
          onPublish={(a) => publish(a.id)}
          onArchive={(a) => archive(a.id)}
          onDelete={(a) => deleteArticle(a.id)}
        />
      </Card>

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
