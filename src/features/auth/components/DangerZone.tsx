import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useDeactivateAccount } from '@/features/auth/hooks/useDeactivateAccount';
import { useDeleteAccount } from '@/features/auth/hooks/useDeleteAccount';
import { handleErrorApi } from '@/shared/lib/errors';

const DangerZone = () => {
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { mutate: deactivate, isPending: isDeactivating } = useDeactivateAccount();
  const { mutate: deleteAcc, isPending: isDeleting } = useDeleteAccount();

  const handleDeactivate = () => {
    deactivate(undefined, {
      onError: (error) => handleErrorApi({ error }),
    });
  };

  const handleDelete = () => {
    deleteAcc(undefined, {
      onError: (error) => handleErrorApi({ error }),
    });
  };

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive">Vùng nguy hiểm</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Vô hiệu hóa tài khoản</p>
            <p className="text-xs text-muted-foreground">Tạm thời vô hiệu hóa tài khoản</p>
          </div>
          <Button variant="outline" onClick={() => setConfirmDeactivate(true)}>Vô hiệu hóa</Button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Xóa tài khoản</p>
            <p className="text-xs text-muted-foreground">Xóa vĩnh viễn tài khoản và tất cả dữ liệu</p>
          </div>
          <Button variant="destructive" onClick={() => setConfirmDelete(true)}>Xóa tài khoản</Button>
        </div>

        <Dialog open={confirmDeactivate} onOpenChange={setConfirmDeactivate}>
          <DialogContent>
            <DialogHeader><DialogTitle>Vô hiệu hóa tài khoản?</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">Bạn có thể kích hoạt lại sau.</p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setConfirmDeactivate(false)}>Hủy</Button>
              <Button variant="destructive" onClick={handleDeactivate} disabled={isDeactivating}>
                {isDeactivating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Xác nhận
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <DialogContent>
            <DialogHeader><DialogTitle>Xóa tài khoản vĩnh viễn?</DialogTitle></DialogHeader>
            <p className="text-sm text-destructive font-medium">Hành động này không thể hoàn tác.</p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setConfirmDelete(false)}>Hủy</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Xóa vĩnh viễn
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default DangerZone;
