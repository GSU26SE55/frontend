import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBatteryAssets } from '@/features/admin/hooks/useBatteryAssets';
import BatteryAssetTable from '@/features/admin/components/BatteryAssetTable';
import BatteryAssetForm from '@/features/admin/components/BatteryAssetForm';
import type { BatteryAssetDto } from '@/features/admin/types/battery-asset.types';

export default function BatteryAssetsPage() {
  const [keyword, setKeyword]           = useState('');
  const [pageNumber, setPageNumber]     = useState(1);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [formOpen, setFormOpen]         = useState(false);
  const [editItem, setEditItem]         = useState<BatteryAssetDto | null>(null);

  const pageSize = 10;

  const { data, isLoading } = useBatteryAssets({
    pageNumber,
    pageSize,
    keyword: keyword || undefined,
    includeDeleted,
  });

  const items      = data?.items ?? [];
  const totalItems = data?.totalItems ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const handleEdit = (item: BatteryAssetDto) => {
    setEditItem(item);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditItem(null);
    setFormOpen(true);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Battery Assets</h1>
        <Button onClick={handleCreate}>+ Tạo mới</Button>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Tìm theo serial number..."
          value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPageNumber(1); }}
          className="max-w-xs"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includeDeleted}
            onChange={(e) => { setIncludeDeleted(e.target.checked); setPageNumber(1); }}
          />
          Hiện đã xóa
        </label>
        <span className="text-sm text-muted-foreground">{totalItems} kết quả</span>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Đang tải...</p>
      ) : (
        <BatteryAssetTable
          items={items}
          includeDeleted={includeDeleted}
          onEdit={handleEdit}
        />
      )}

      {totalPages > 1 && (
        <div className="flex gap-2 items-center justify-center">
          <Button
            variant="outline"
            size="sm"
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber((p) => p - 1)}
          >
            Trước
          </Button>
          <span className="text-sm">{pageNumber} / {totalPages}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={pageNumber >= totalPages}
            onClick={() => setPageNumber((p) => p + 1)}
          >
            Sau
          </Button>
        </div>
      )}

      <BatteryAssetForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editData={editItem}
      />
    </div>
  );
}
