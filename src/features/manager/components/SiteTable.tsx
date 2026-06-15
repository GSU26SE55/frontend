import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
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
}

export default function SiteTable({ data }: SiteTableProps) {
  const navigate = useNavigate();

  return (
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
  );
}
