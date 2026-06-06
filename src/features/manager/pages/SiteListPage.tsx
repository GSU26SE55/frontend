import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
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
import { format } from "date-fns";
import { useSiteList } from "@/features/manager/hooks/useSites";
import {
  SiteStatusEnum,
  type SiteFilterParams,
} from "@/shared/types/site.types";

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

export default function ManagerSiteListPage() {
  const navigate = useNavigate();
  const [params, setParams] = useState<SiteFilterParams>({
    pageNumber: 1,
    pageSize: 10,
  });
  const [keyword, setKeyword] = useState("");

  const { data, isLoading } = useSiteList(params);
  const totalPages = Math.ceil(
    (data?.totalItems ?? 0) / (params.pageSize ?? 10),
  );

  const handleSearch = () => {
    setParams((p) => ({ ...p, pageNumber: 1, keyword: keyword || undefined }));
  };

  if (isLoading) {
    return (
      <div className="space-y-2 p-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">Danh sách Site</h1>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Tìm theo tên site..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={handleSearch}>
          Tìm
        </Button>
      </div>

      {!data?.items || data.items.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">
          Chưa có site nào.
        </p>
      ) : (
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
            {data.items.map((site) => (
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
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setParams((p) => ({ ...p, pageNumber: (p.pageNumber ?? 1) - 1 }))
            }
            disabled={(params.pageNumber ?? 1) <= 1}
          >
            Trước
          </Button>
          <span className="text-sm text-muted-foreground">
            {params.pageNumber} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setParams((p) => ({ ...p, pageNumber: (p.pageNumber ?? 1) + 1 }))
            }
            disabled={(params.pageNumber ?? 1) >= totalPages}
          >
            Sau
          </Button>
        </div>
      )}
    </div>
  );
}
