import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { SiteStatusEnum, type SiteDto } from "@/shared/types/site/site.types";
import { DataTable, type ColumnDef } from "@/shared/components/ui/DataTable";
import type { ServerSortState } from "@/shared/hooks/useServerSort";

const STATUS_LABEL: Record<SiteStatusEnum, string> = {
  [SiteStatusEnum.Active]: "Hoạt động",
  [SiteStatusEnum.UnderMaintenance]: "Bảo trì",
  [SiteStatusEnum.Decommissioned]: "Đã ngừng",
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
  /** Sort server-side — state từ useUrlSort. */
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
      header: "Tên site",
      sortKey: "name",
      sortValue: (s) => s.name,
      cellClassName: "font-medium",
      cell: (s) => s.name,
    },
    {
      id: "customerName",
      header: "Khách hàng",
      sortKey: "customerName",
      sortValue: (s) => s.customerName,
      cell: (s) => s.customerName,
    },
    {
      id: "status",
      header: "Trạng thái",
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
      header: "Số pin",
      sortKey: "batteryAssetCount",
      sortValue: (s) => s.batteryAssetCount,
      cell: (s) => s.batteryAssetCount,
    },
    {
      id: "installDate",
      header: "Ngày lắp đặt",
      sortKey: "installDate",
      sortValue: (s) => new Date(s.installDate).getTime(),
      cell: (s) => format(new Date(s.installDate), "dd/MM/yyyy"),
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
