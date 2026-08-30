import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EllipsisVertical, Plus, Search, X } from "lucide-react";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import DataPagination from "@/shared/components/ui/DataPagination";
import { ErrorState } from "@/shared/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { KEY } from "@/shared/utils/queryKeys";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { useDebouncedSearch } from "@/shared/hooks/useDebouncedSearch";
import {
  useBlogList,
  usePublishBlogPost,
  useArchiveBlogPost,
  useDeleteBlogPost,
  isBlogEditable,
} from "@/shared/hooks/blog/useBlog";
import type { BlogPostListItemDTO } from "@/shared/types/blog/blog.types";
import { BlogStatusBadge, BlogOriginBadge } from "./BlogStatusBadge";
import {
  BLOG_STATUS_OPTIONS,
  BLOG_ORIGIN_OPTIONS,
  // Value import, not `import type`: the card menu compares against Draft/Archived at
  // runtime to decide which actions to offer.
  BlogPostStatusEnum,
  type BlogPostOriginEnum,
} from "@/shared/enums/blog/blog.enum";
import { loadFailed, noData } from "@/shared/constants/emptyStates";
import { DEFAULT_PAGE_SIZE } from "@/shared/constants/pagination";
import { TABLE_COLUMNS } from "@/shared/constants/tableColumns";
import { Card } from "@/components/ui/card";

const PAGE_SIZE = DEFAULT_PAGE_SIZE;

// Base UI Select renders the raw VALUE if Root doesn't receive an `items` value→label map.
// Without this prop the filter shows "Draft"/"Published" instead of the display label.
const STATUS_ITEMS = [
  { value: null, label: "All statuses" },
  ...BLOG_STATUS_OPTIONS,
];
const ORIGIN_ITEMS = [
  { value: null, label: "All origins" },
  ...BLOG_ORIGIN_OPTIONS,
];

// Uses `pageNumber` (same as KB) — `setFilter` only auto-resets to page 1 for this exact
// key. Blog previously used the name `page`, so changing a filter did NOT reset the page,
// and the service also sent the wrong param `Page`, which the BE ignored → pagination broke.
const DEFAULTS = {
  keyword: "",
  status: "",
  origin: "",
  pageNumber: 1,
  pageSize: PAGE_SIZE,
};

interface BlogListViewProps {
  /** Role route prefix, e.g. "/staff". */
  basePath: string;
  /** Breadcrumb label, e.g. "Staff". */
  roleLabel: string;
  /**
   * Only Manager/Admin have publish · archive · delete — same flag the detail view takes,
   * so a card never offers an action the detail page would refuse.
   */
  canWorkflow?: boolean;
}

export function BlogListView({
  basePath,
  roleLabel,
  canWorkflow,
}: BlogListViewProps) {
  const navigate = useNavigate();
  const { mutate: publish, isPending: publishing } = usePublishBlogPost();
  const { mutate: archive, isPending: archiving } = useArchiveBlogPost();
  const { mutate: remove, isPending: removing } = useDeleteBlogPost();
  const [toDelete, setToDelete] = useState<BlogPostListItemDTO | null>(null);
  const { filters, setFilter, resetFilters, hasActiveFilter } =
    useUrlFilters(DEFAULTS);
  const search = useDebouncedSearch(filters.keyword ?? "", (kw) =>
    setFilter("keyword", kw),
  );

  // BE filters by `Q` (Title/Summary) — searches ACROSS ALL posts, not just the current page.
  const { data, isLoading, isError, refetch } = useBlogList({
    status: (filters.status || undefined) as BlogPostStatusEnum | undefined,
    origin: (filters.origin || undefined) as BlogPostOriginEnum | undefined,
    page: filters.pageNumber,
    pageSize: filters.pageSize,
    q: filters.keyword || undefined,
  });

  const items = data?.items ?? [];

  return (
    <PageContainer>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-muted-foreground mb-0.5 text-xs font-medium">
            {roleLabel} &middot; Blog
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Blog</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isLoading ? "..." : (data?.totalItems ?? 0)} posts
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => navigate(`${basePath}/blog/new`)}>
            <Plus className="size-3.5" /> Create post
          </Button>
          <RefreshButton queryKeys={[KEY.blog]} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-3.5 -translate-y-1/2" />
          <Input
            placeholder="Search by title or summary…"
            value={search.value}
            onChange={search.onChange}
            className="pr-8 pl-8"
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
              className="hover:bg-muted absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5"
              aria-label="Clear keyword"
            >
              <X className="text-muted-foreground size-3.5" />
            </button>
          )}
        </div>

        <Select
          value={filters.status || null}
          items={STATUS_ITEMS}
          onValueChange={(v: string | null) =>
            setFilter("status", v || undefined)
          }
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value={null}>All statuses</SelectItem>
            {BLOG_STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.origin || null}
          items={ORIGIN_ITEMS}
          onValueChange={(v: string | null) =>
            setFilter("origin", v || undefined)
          }
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All origins" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value={null}>All origins</SelectItem>
            {BLOG_ORIGIN_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilter && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Clear filters
          </Button>
        )}
      </div>

      {isError ? (
        <ErrorState message={loadFailed("blog posts")} onRetry={refetch} />
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center text-sm">
          {filters.keyword
            ? `No posts found matching "${filters.keyword}".`
            : noData("blog posts")}
        </p>
      ) : (
        <Card className="gap-0 py-0 overflow-hidden">
          {/* A table, not a card grid: a post list is a register - what is drafted, what
              is live, what came from a guide - and those are columns, not boxes. */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">
                  {TABLE_COLUMNS.index}
                </TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="w-36">Origin</TableHead>
                <TableHead className="w-16 text-right">Ver.</TableHead>
                <TableHead className="w-28 text-right">Created</TableHead>
                <TableHead className="text-right">
                  {TABLE_COLUMNS.actions}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((b, index) => (
                <TableRow
                  key={b.id}
                  onClick={() => navigate(`${basePath}/blog/${b.id}`)}
                  className="cursor-pointer"
                >
                  <TableCell className="text-center text-muted-foreground tabular-nums">
                    {(filters.pageNumber - 1) * filters.pageSize + index + 1}
                  </TableCell>
                  <TableCell className="max-w-0">
                    <p className="truncate font-medium" title={b.title}>
                      {b.title}
                    </p>
                    {/* The summary rides under the title rather than taking a column of
                        its own: it is a sentence, and a sentence in a cell either wraps
                        the row to three lines or gets cut to nothing. */}
                    <p className="truncate text-xs text-muted-foreground">
                      {b.summary}
                    </p>
                  </TableCell>
                  <TableCell>
                    <BlogStatusBadge status={b.status} />
                  </TableCell>
                  <TableCell>
                    <BlogOriginBadge origin={b.origin} />
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">
                    v{b.currentVersion}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right font-mono text-xs text-muted-foreground">
                    {format(new Date(b.createdAt), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="-mt-1 -mr-1 size-8"
                            />
                          }
                        >
                          <EllipsisVertical className="size-4.5" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            disabled={!isBlogEditable(b.status)}
                            onClick={() =>
                              navigate(`${basePath}/blog/${b.id}/edit`)
                            }
                          >
                            Edit
                          </DropdownMenuItem>
                          {canWorkflow && (
                            <>
                              {b.status === BlogPostStatusEnum.Draft && (
                                <DropdownMenuItem
                                  disabled={publishing}
                                  onClick={() => publish(b.id)}
                                >
                                  Publish
                                </DropdownMenuItem>
                              )}
                              {b.status !== BlogPostStatusEnum.Archived && (
                                <DropdownMenuItem
                                  disabled={archiving}
                                  onClick={() => archive(b.id)}
                                >
                                  Archive
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setToDelete(b)}
                              >
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {data && data.totalPages > 1 && (
        <DataPagination
          totalItems={data.totalItems}
          pageNumber={data.pageNumber}
          pageSize={data.pageSize}
          totalPages={data.totalPages}
          hasNextPage={data.hasNextPage}
          hasPreviousPage={data.hasPreviousPage}
          onPageChange={(p) => setFilter("pageNumber", p)}
          onPageSizeChange={(s) => setFilter("pageSize", s)}
        />
      )}

      <AlertDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete post?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete && (
                <>
                  <strong>{toDelete.title}</strong> will be removed. This cannot
                  be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setToDelete(null)} />
            <AlertDialogAction
              variant="destructive"
              disabled={removing}
              onClick={() => {
                if (toDelete) remove(toDelete.id);
                setToDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
