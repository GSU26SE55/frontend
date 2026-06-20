import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
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
import { Plus, Search, X } from "lucide-react";
import { RefreshButton } from "@/shared/components/common/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { useDebouncedSearch } from "@/shared/hooks/useDebouncedSearch";
import {
  useAdminKbList,
  useAdminKbDetail,
  usePublishKbArticle,
  useArchiveKbArticle,
  useMarkKbHelpful,
  useUpdateKbArticle,
} from "../hooks/useAdminKb";
import KbArticleTable from "../components/KbArticleTable";
import DataPagination from "@/shared/components/common/DataPagination";
import { KbEditorPanel } from "@/shared/components/common/kb/KbEditorPanel";
import {
  KbArticleStatusEnum,
  KbArticleStatusLabel,
  KbCategoryCode,
  KB_CATEGORY_OPTIONS,
} from "@/shared/enums/kb.enum";
import type { TicketCategoryEnum } from "@/shared/enums/ticket.enum";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = Object.values(KbArticleStatusEnum);

const STATUS_DOT: Record<KbArticleStatusEnum, string> = {
  [KbArticleStatusEnum.Draft]: "bg-slate-400",
  [KbArticleStatusEnum.PendingReview]: "bg-amber-500",
  [KbArticleStatusEnum.Published]: "bg-emerald-500",
  [KbArticleStatusEnum.Archived]: "bg-zinc-500",
};

const DEFAULTS = {
  keyword: "",
  status: "",
  category: "",
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

  const categoryValue = filters.category
    ? (filters.category as TicketCategoryEnum)
    : undefined;
  const statusValue = filters.status
    ? (filters.status as KbArticleStatusEnum)
    : undefined;

  const params = {
    q: filters.keyword || undefined,
    status: statusValue,
    category: categoryValue ? KbCategoryCode[categoryValue] : undefined,
    pageNumber: filters.pageNumber,
    pageSize: filters.pageSize,
  };

  const { data, isLoading } = useAdminKbList(params);
  const { mutate: publish } = usePublishKbArticle();
  const { mutate: archive } = useArchiveKbArticle();
  const { mutate: markHelpful } = useMarkKbHelpful();
  const { mutateAsync: update, isPending: updating } = useUpdateKbArticle();

  const [editArticleId, setEditArticleId] = useState<string | null>(null);
  const { data: editArticle } = useAdminKbDetail(editArticleId ?? "");

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
        <div className="flex gap-2">
          <RefreshButton queryKeys={[KEY.kb]} />
          <Button size="sm" onClick={() => navigate("/admin/kb/new")}>
            <Plus className="size-3.5" /> Tạo bài viết
          </Button>
        </div>
      </div>

      <div className="sticky top-0 z-10 -mx-6 px-6 py-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tiêu đề, mã hoặc tag…"
              value={search.value}
              onChange={search.onChange}
              className="pl-8 pr-8"
            />
            {search.value && (
              <button
                type="button"
                onClick={() => {
                  search.onChange({
                    target: { value: "" },
                  } as React.ChangeEvent<HTMLInputElement>);
                  setFilter("keyword", undefined);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 hover:bg-muted"
                aria-label="Xóa từ khóa"
              >
                <X className="size-3.5 text-muted-foreground" />
              </button>
            )}
          </div>

          <Select
            value={filters.category || null}
            onValueChange={(v: string | null) =>
              setFilter("category", v || undefined)
            }
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Tất cả danh mục" />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectItem value={null}>Tất cả danh mục</SelectItem>
              {KB_CATEGORY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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
                <SelectItem key={s} value={s}>
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className={cn(
                        "size-1.5 rounded-full shrink-0",
                        STATUS_DOT[s],
                      )}
                    />
                    {KbArticleStatusLabel[s]}
                  </span>
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

        {search.value.length === 1 && (
          <p className="text-[11px] text-muted-foreground -mt-1.5">
            Nhập ít nhất 2 ký tự để tìm
          </p>
        )}
      </div>

      <Card className="gap-0 py-0 overflow-hidden">
        <KbArticleTable
          data={data?.items ?? []}
          isLoading={isLoading}
          pageNumber={data?.pageNumber ?? 1}
          pageSize={data?.pageSize ?? 10}
          hasFilter={hasActiveFilter}
          onResetFilter={resetFilters}
          onPublish={(a) => publish(a.id)}
          onArchive={(a) => archive(a.id)}
          onMarkHelpful={(a) => markHelpful(a.id)}
          onEdit={(a) => setEditArticleId(a.id)}
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

      <AnimatePresence>
        {editArticleId && editArticle && (
          <>
            <motion.div
              key="kb-list-edit-backdrop"
              className="fixed inset-0 z-50 bg-black/20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setEditArticleId(null)}
            />
            <motion.div
              key="kb-list-edit-panel"
              className="fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col bg-popover text-popover-foreground shadow-2xl sm:max-w-[560px]"
              initial={{ x: "100%", opacity: 0.5 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 340,
                damping: 32,
                mass: 0.9,
              }}
            >
              <KbEditorPanel
                article={editArticle}
                onClose={() => setEditArticleId(null)}
                isPending={updating}
                onSave={async (payload) => {
                  await update({ id: editArticle.id, payload });
                  setEditArticleId(null);
                }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
