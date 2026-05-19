import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BatteryStatusEnum, type BatteryAssetDto } from '@/features/admin/types/battery-asset.types';
import { useDeleteBatteryAsset } from '@/features/admin/hooks/useDeleteBatteryAsset';
import { useRestoreBatteryAsset } from '@/features/admin/hooks/useRestoreBatteryAsset';
import { toast } from 'sonner';

const statusLabel: Record<BatteryStatusEnum, string> = {
  [BatteryStatusEnum.Active]:         'Hoạt động',
  [BatteryStatusEnum.Inactive]:       'Không hoạt động',
  [BatteryStatusEnum.Decommissioned]: 'Ngừng sử dụng',
};

const statusVariant: Record<BatteryStatusEnum, 'default' | 'secondary' | 'destructive'> = {
  [BatteryStatusEnum.Active]:         'default',
  [BatteryStatusEnum.Inactive]:       'secondary',
  [BatteryStatusEnum.Decommissioned]: 'destructive',
};

interface BatteryAssetTableProps {
  items:         BatteryAssetDto[];
  includeDeleted?: boolean;
  onEdit:        (item: BatteryAssetDto) => void;
}

export default function BatteryAssetTable({ items, includeDeleted, onEdit }: BatteryAssetTableProps) {
  const navigate = useNavigate();
  const { mutate: deleteAsset } = useDeleteBatteryAsset();
  const { mutate: restoreAsset } = useRestoreBatteryAsset();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Serial Number</TableHead>
          <TableHead>Loại pin</TableHead>
          <TableHead>Khách hàng</TableHead>
          <TableHead>Site</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead>Ngày lắp</TableHead>
          <TableHead className="text-right">Hành động</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow
            key={item.id}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => navigate(`/admin/battery-assets/${item.id}`)}
          >
            <TableCell className="font-mono text-sm">{item.serialNumber}</TableCell>
            <TableCell>{item.batteryTypeName}</TableCell>
            <TableCell>{item.customerName}</TableCell>
            <TableCell>{item.siteName ?? '—'}</TableCell>
            <TableCell>
              <Badge variant={statusVariant[item.status]}>
                {statusLabel[item.status]}
              </Badge>
            </TableCell>
            <TableCell>{item.installDate.slice(0, 10)}</TableCell>
            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-end gap-1">
                {!includeDeleted && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(item)}
                    >
                      Sửa
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteAsset(item.id, {
                        onSuccess: () => toast.success('Đã xóa'),
                      })}
                    >
                      Xóa
                    </Button>
                  </>
                )}
                {includeDeleted && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => restoreAsset(item.id, {
                      onSuccess: () => toast.success('Đã khôi phục'),
                    })}
                  >
                    Khôi phục
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
        {items.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
              Không có dữ liệu
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
