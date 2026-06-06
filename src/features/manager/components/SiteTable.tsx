import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SiteStatusEnum, type SiteDto } from "@/shared/types/site.types";
import DataPagination from "@/shared/components/common/DataPagination";

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
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  pageNumber: number;
  pageSize: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export default function SiteTable({
  data,
  totalItems,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  pageNumber,
  pageSize,
  isLoading,
  onPageChange,
  onPageSizeChange,
}: SiteTableProps) {
  const navigate = useNavigate();

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
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên site</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Số pin</TableHead>
              <TableHead>Ngày lắp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((site) => (
              <TableRow
                key={site.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/manager/sites/${site.id}`)}
              >
                <TableCell className="font-medium">{site.name}</TableCell>
                <TableCell>{site.customerName}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[site.status]}>
                    {STATUS_LABEL[site.status]}
                  </Badge>
                </TableCell>
                <TableCell>{site.batteryAssetCount}</TableCell>
                <TableCell>
                  {format(new Date(site.installDate), "dd/MM/yyyy")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DataPagination
        totalItems={totalItems}
        totalPages={totalPages}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
        pageNumber={pageNumber}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}
