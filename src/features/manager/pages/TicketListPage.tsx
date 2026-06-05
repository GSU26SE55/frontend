import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import TicketTable from "@/features/manager/components/TicketTable";
import { useAdminTicketList } from "@/features/manager/hooks/useManagerTickets";
import {
  TicketStatusEnum,
  TicketPriorityEnum,
  TicketCategoryEnum,
} from "@/features/manager/types/ticket.types";
import type { AdminTicketListParams } from "@/features/manager/types/ticket.types";

const PAGE_SIZE = 20;

export default function TicketListPage() {
  const [params, setParams] = useState<AdminTicketListParams>({
    pageNumber: 1,
    pageSize: PAGE_SIZE,
  });
  const [keyword, setKeyword] = useState("");

  const { data, isLoading } = useAdminTicketList(params);
  const tickets = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  const applyFilter = (patch: Partial<AdminTicketListParams>) =>
    setParams((p) => ({ ...p, ...patch, pageNumber: 1 }));

  const handleSearch = () => applyFilter({ keyword: keyword || undefined });

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">Quản lý Ticket</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Tìm theo mã hoặc tiêu đề..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="w-64"
        />
        <Button variant="outline" onClick={handleSearch}>
          Tìm
        </Button>

        <Select
          onValueChange={(v) =>
            applyFilter({
              status: v === "_all" ? undefined : (v as TicketStatusEnum),
            })
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Tất cả</SelectItem>
            {Object.entries(TicketStatusEnum).map(([, v]) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          onValueChange={(v) =>
            applyFilter({
              priority: v === "_all" ? undefined : (v as TicketPriorityEnum),
            })
          }
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Tất cả</SelectItem>
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
          onValueChange={(v) =>
            applyFilter({
              category: v === "_all" ? undefined : (v as TicketCategoryEnum),
            })
          }
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Loại" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Tất cả</SelectItem>
            {Object.entries(TicketCategoryEnum).map(([, v]) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <TicketTable tickets={tickets} isLoading={isLoading} />

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
    </div>
  );
}
