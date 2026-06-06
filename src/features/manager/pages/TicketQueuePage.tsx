import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import TicketTable from "@/features/manager/components/TicketTable";
import TriageDialog from "@/features/manager/components/TriageDialog";
import { useAdminTicketQueue } from "@/features/manager/hooks/useManagerTickets";
import {
  TicketPriorityEnum,
  TicketCategoryEnum,
} from "@/shared/types/ticket.types";
import type {
  TicketDTO,
  AdminTicketQueueParams,
} from "@/shared/types/ticket.types";

const PAGE_SIZE = 20;

const PRIORITY_ITEMS: Record<string, string> = {
  "": "Tất cả priority",
  [TicketPriorityEnum.P1Critical]: "P1 Critical",
  [TicketPriorityEnum.P2High]: "P2 High",
  [TicketPriorityEnum.P3Normal]: "P3 Normal",
};
const CATEGORY_ITEMS: Record<string, string> = {
  "": "Tất cả loại",
  ...Object.fromEntries(
    Object.entries(TicketCategoryEnum).map(([, v]) => [v, v]),
  ),
};

export default function TicketQueuePage() {
  const [params, setParams] = useState<AdminTicketQueueParams>({
    pageNumber: 1,
    pageSize: PAGE_SIZE,
  });
  const [triageTarget, setTriageTarget] = useState<TicketDTO | null>(null);

  const { data, isLoading } = useAdminTicketQueue(params);
  const tickets = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hàng chờ Triage</h1>
          <p className="text-sm text-muted-foreground">
            Ticket ở trạng thái Open, P1 ưu tiên trước.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Select
          value={params.priority ?? ""}
          items={PRIORITY_ITEMS}
          onValueChange={(v: string | null) =>
            setParams((p) => ({
              ...p,
              priority: (v as TicketPriorityEnum) || undefined,
              pageNumber: 1,
            }))
          }
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value="">Tất cả priority</SelectItem>
            <SelectItem value={TicketPriorityEnum.P1Critical}>
              P1 Critical
            </SelectItem>
            <SelectItem value={TicketPriorityEnum.P2High}>P2 High</SelectItem>
            <SelectItem value={TicketPriorityEnum.P3Normal}>
              P3 Normal
            </SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={params.category ?? ""}
          items={CATEGORY_ITEMS}
          onValueChange={(v: string | null) =>
            setParams((p) => ({
              ...p,
              category: (v as TicketCategoryEnum) || undefined,
              pageNumber: 1,
            }))
          }
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value="">Tất cả loại</SelectItem>
            {Object.entries(TicketCategoryEnum).map(([, v]) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <TicketTable
        tickets={tickets}
        isLoading={isLoading}
        showTriage
        onTriage={setTriageTarget}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            disabled={params.pageNumber === 1}
            onClick={() =>
              setParams((p) => ({ ...p, pageNumber: (p.pageNumber ?? 1) - 1 }))
            }
          >
            Trước
          </Button>
          <span className="text-sm text-muted-foreground">
            Trang {params.pageNumber} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={params.pageNumber === totalPages}
            onClick={() =>
              setParams((p) => ({ ...p, pageNumber: (p.pageNumber ?? 1) + 1 }))
            }
          >
            Sau
          </Button>
        </div>
      )}

      {triageTarget && (
        <TriageDialog
          ticketId={triageTarget.id}
          open={!!triageTarget}
          onClose={() => setTriageTarget(null)}
        />
      )}
    </div>
  );
}
