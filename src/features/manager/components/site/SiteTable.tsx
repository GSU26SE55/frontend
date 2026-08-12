import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SiteStatusEnum, type SiteDto } from "@/shared/types/site/site.types";
import { DataTable, type ColumnDef } from "@/shared/components/ui/DataTable";
import type { ServerSortState } from "@/shared/hooks/useServerSort";

const STATUS_LABEL: Record<SiteStatusEnum, string> = {
  [SiteStatusEnum.Active]: "Active",
  [SiteStatusEnum.UnderMaintenance]: "Under maintenance",
  [SiteStatusEnum.Decommissioned]: "Decommissioned",
};

const STATUS_VARIANT: Record<
  SiteStatusEnum,
  "default" | "secondary" | "destructive"
> = {
  [SiteStatusEnum.Active]: "default",
  [SiteStatusEnum.UnderMaintenance]: "secondary",
  [SiteStatusEnum.Decommissioned]: "destructive",
};

interface SiteTableProps {
  data: SiteDto[];
  pageNumber?: number;
  pageSize?: number;
  /** Server-side sort — state from useUrlSort. */
  sort: ServerSortState;
}

export default function SiteTable({
  data,
  pageNumber = 1,
  pageSize = 0,
  sort,
}: SiteTableProps) {
  const navigate = useNavigate();

  const columns: ColumnDef<SiteDto>[] = [
    {
      id: "name",
      header: "Site name",
      sortKey: "name",
      sortValue: (s) => s.name,
      cellClassName: "font-medium",
      cell: (s) => s.name,
    },
    {
      id: "customerName",
      header: "Customer",
      sortKey: "customerName",
      sortValue: (s) => s.customerName,
      cell: (s) => s.customerName,
    },
    {
      id: "status",
      header: "Status",
      sortKey: "status",
      sortValue: (s) => STATUS_LABEL[s.status],
      cell: (s) => (
        <Badge variant={STATUS_VARIANT[s.status]}>
          {STATUS_LABEL[s.status]}
        </Badge>
      ),
    },
    {
      id: "batteryAssetCount",
      header: "Batteries",
      sortKey: "batteryAssetCount",
      sortValue: (s) => s.batteryAssetCount,
      cell: (s) => s.batteryAssetCount,
    },
    {
      id: "installDate",
      header: "Install date",
      sortKey: "installDate",
      sortValue: (s) => new Date(s.installDate).getTime(),
      cell: (s) => format(new Date(s.installDate), "MM/dd/yyyy"),
    },
    {
      id: "chevron",
      header: "",
      headClassName: "w-8",
      cellClassName: "text-muted-foreground",
      cell: () => <ChevronRight className="size-4" />,
    },
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      rowKey={(s) => s.id}
      showIndex
      pageNumber={pageNumber}
      pageSize={pageSize}
      onRowClick={(s) => navigate(`/manager/sites/${s.id}`)}
      serverSort={sort}
    />
  );
}
