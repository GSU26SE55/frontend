import { useState } from "react";
import { CalendarOff, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { ErrorState } from "@/shared/components/ui/ErrorState";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import DataPagination from "@/shared/components/ui/DataPagination";
import SlaNonWorkingPeriodTable from "@/shared/components/sla/SlaNonWorkingPeriodTable";
import SlaNonWorkingPeriodDialog from "@/shared/components/sla/SlaNonWorkingPeriodDialog";
import {
  useDeleteSlaNonWorkingPeriod,
  useSlaNonWorkingPeriods,
} from "@/shared/hooks/sla/useSlaCalendar";
import { KEY } from "@/shared/utils/queryKeys";
import { DEFAULT_PAGE_SIZE } from "@/shared/constants/pagination";
import { loadFailed, noData } from "@/shared/constants/emptyStates";
import type { SlaNonWorkingPeriodDto } from "@/shared/types/sla/sla-calendar.types";

interface Props {
  /** Breadcrumb eyebrow — "Admin" or "Manager"; the rest of the page is role-agnostic. */
  roleLabel: string;
}

/**
 * SLA business calendar — the days that do NOT count towards a ticket's SLA.
 *
 * Shared by the Admin and Manager portals: the BE authorises both roles identically
 * (SlaCalendarController is `[Authorize(Roles = "Manager,Admin")]`) and there is no
 * behavioural difference between them here, so both routes render this one view.
 */
export default function SlaCalendarView({ roleLabel }: Props) {
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SlaNonWorkingPeriodDto | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<SlaNonWorkingPeriodDto | null>(null);

  const { data, isLoading, isError, refetch } = useSlaNonWorkingPeriods({
    pageNumber: page,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const { mutate: removePeriod, isPending: isRemoving } =
    useDeleteSlaNonWorkingPeriod();

  const items = data?.items ?? [];
  const totalItems = data?.totalItems ?? 0;

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (period: SlaNonWorkingPeriodDto) => {
    setEditing(period);
    setFormOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    removePeriod(deleteTarget.id, {
      onSettled: () => setDeleteTarget(null),
    });
  };

  return (
    <PageContainer>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            {roleLabel} &middot; System
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            SLA calendar
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? "..." : totalItems} non-working periods &mdash; days
            excluded when a ticket&apos;s SLA deadline is calculated.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-3.5" /> Add period
          </Button>
          <RefreshButton queryKeys={[KEY.slaCalendar]} />
        </div>
      </div>

      <Card className="gap-0 py-0 overflow-hidden">
        {isLoading ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : isError ? (
          <ErrorState
            message={loadFailed("non-working periods")}
            onRetry={() => refetch()}
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={CalendarOff}
            title={noData("non-working periods")}
            description="Every day currently counts towards SLA — including Tết, public holidays and maintenance windows."
            action={{ label: "Add period", onClick: openCreate }}
          />
        ) : (
          <SlaNonWorkingPeriodTable
            items={items}
            pageNumber={data?.pageNumber}
            pageSize={data?.pageSize}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
          />
        )}
      </Card>

      {!!data && totalItems > 0 && (
        <DataPagination
          totalItems={totalItems}
          pageNumber={data.pageNumber}
          pageSize={data.pageSize}
          totalPages={data.totalPages}
          hasNextPage={data.hasNextPage}
          hasPreviousPage={data.hasPreviousPage}
          onPageChange={setPage}
        />
      )}

      <SlaNonWorkingPeriodDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        period={editing}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this period?</AlertDialogTitle>
            <AlertDialogDescription>
              These days start counting towards SLA again, and the deadline of
              every ticket still running is re-calculated — some may move
              closer, or breach.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isRemoving}
              onClick={confirmDelete}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
