import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
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
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onEdit: (site: SiteDto) => void;
  onDelete: (site: SiteDto) => void;
  onRestore?: (site: SiteDto) => void;
}

export default function SiteTable({
  data,
  totalCount,
  pageNumber,
  pageSize,
  isLoading,
  onPageChange,
  onEdit,
  onDelete,
  onRestore,
}: SiteTableProps) {
  const navigate = useNavigate();
  const totalPages = Math.ceil(totalCount / pageSize);

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
    <div className="space-y-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tên site</TableHead>
            <TableHead>Khách hàng</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Số pin</TableHead>
            <TableHead>Ngày lắp</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((site) => (
            <TableRow
              key={site.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => navigate(`/admin/sites/${site.id}`)}
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
              <TableCell
                className="text-right space-x-1"
                onClick={(e) => e.stopPropagation()}
              >
                {site.status !== SiteStatusEnum.Decommissioned ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(site)}
                    >
                      Sửa
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDelete(site)}
                    >
                      Xoá
                    </Button>
                  </>
                ) : (
                  onRestore && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRestore(site)}
                    >
                      Khôi phục
                    </Button>
                  )
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pageNumber - 1)}
            disabled={pageNumber <= 1}
          >
            Trước
          </Button>
          <span className="text-sm text-muted-foreground">
            {pageNumber} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pageNumber + 1)}
            disabled={pageNumber >= totalPages}
          >
            Sau
          </Button>
        </div>
      )}
    </div>
  );
}
