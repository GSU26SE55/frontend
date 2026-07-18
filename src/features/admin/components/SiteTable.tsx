import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { EllipsisVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SiteStatusEnum, type SiteDto } from "@/shared/types/site.types";
import { DataTable, type ColumnDef } from "@/shared/components/ui/DataTable";
import { TABLE_COLUMNS } from "@/shared/constants/tableColumns";

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
  pageNumber: number;
  pageSize: number;
  isLoading?: boolean;
  onEdit: (site: SiteDto) => void;
  onDelete: (site: SiteDto) => void;
  onRestore?: (site: SiteDto) => void;
}

export default function SiteTable({
  data,
  pageNumber,
  pageSize,
  isLoading,
  onEdit,
  onDelete,
  onRestore,
}: SiteTableProps) {
  const navigate = useNavigate();

  const columns: ColumnDef<SiteDto>[] = [
    {
      id: "name",
      header: "Tên site",
      sortKey: "name",
      sortValue: (site) => site.name,
      cellClassName: "font-medium",
      cell: (site) => site.name,
    },
    {
      id: "customerName",
      header: "Khách hàng",
      sortKey: "customerName",
      sortValue: (site) => site.customerName,
      cell: (site) => site.customerName,
    },
    {
      id: "status",
      header: "Trạng thái",
      sortKey: "status",
      sortValue: (site) => STATUS_LABEL[site.status],
      cell: (site) => (
        <Badge variant={STATUS_VARIANT[site.status]}>
          {STATUS_LABEL[site.status]}
        </Badge>
      ),
    },
    {
      id: "batteryAssetCount",
      header: "Số pin",
      sortKey: "batteryAssetCount",
      sortValue: (site) => site.batteryAssetCount,
      cell: (site) => site.batteryAssetCount,
    },
    {
      id: "installDate",
      header: "Ngày lắp",
      sortKey: "installDate",
      sortValue: (site) => new Date(site.installDate).getTime(),
      cell: (site) => format(new Date(site.installDate), "dd/MM/yyyy"),
    },
    {
      id: "actions",
      header: TABLE_COLUMNS.actions,
      headClassName: "text-right",
      cellClassName: "text-right",
      stopRowClick: true,
      cell: (site) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon" className="size-7" />}
          >
            <EllipsisVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            {site.status !== SiteStatusEnum.Decommissioned ? (
              <>
                <DropdownMenuItem onClick={() => onEdit(site)}>
                  Chỉnh sửa
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(site)}
                >
                  Xóa
                </DropdownMenuItem>
              </>
            ) : (
              onRestore && (
                <DropdownMenuItem onClick={() => onRestore(site)}>
                  Khôi phục
                </DropdownMenuItem>
              )
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-8">
        Chưa có site nào.
      </p>
    );
  }

  return (
    <DataTable
      data={data}
      columns={columns}
      rowKey={(site) => site.id}
      showIndex
      pageNumber={pageNumber}
      pageSize={pageSize}
      onRowClick={(site) => navigate(`/admin/sites/${site.id}`)}
    />
  );
}
