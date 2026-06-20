import { useState } from "react";
import { Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useDeactivateAccount } from "@/features/auth/hooks/useDeactivateAccount";
import { useDeleteAccount } from "@/features/auth/hooks/useDeleteAccount";
import { useExportMyData } from "@/features/auth/hooks/useExportMyData";
import { handleErrorApi } from "@/shared/lib/errors";

const DangerZone = () => {
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { mutate: deactivate, isPending: isDeactivating } =
    useDeactivateAccount();
  const { mutate: deleteAcc, isPending: isDeleting } = useDeleteAccount();
  const { mutate: exportData, isPending: isExporting } = useExportMyData();

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

  const handleExport = () => {
    exportData(undefined, {
      onSuccess: () => toast.success("Đã tải dữ liệu tài khoản (JSON)"),
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
            <p className="text-sm font-medium">Tải dữ liệu của tôi (GDPR)</p>
            <p className="text-xs text-muted-foreground">
              Xuất toàn bộ dữ liệu tài khoản dưới dạng file JSON
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Tải dữ liệu
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Vô hiệu hóa tài khoản</p>
            <p className="text-xs text-muted-foreground">
              Tạm thời vô hiệu hóa tài khoản
            </p>
          </div>
          <Button variant="outline" onClick={() => setConfirmDeactivate(true)}>
            Vô hiệu hóa
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Xóa tài khoản</p>
            <p className="text-xs text-muted-foreground">
              Xóa vĩnh viễn tài khoản và tất cả dữ liệu
            </p>
          </div>
          <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
            Xóa tài khoản
          </Button>
        </div>

        <AlertDialog
          open={confirmDeactivate}
          onOpenChange={setConfirmDeactivate}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Vô hiệu hóa tài khoản?</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có thể kích hoạt lại sau.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmDeactivate(false)} />
              <AlertDialogAction
                variant="destructive"
                onClick={handleDeactivate}
                disabled={isDeactivating}
              >
                {isDeactivating && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Xác nhận
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xóa tài khoản vĩnh viễn?</AlertDialogTitle>
              <AlertDialogDescription className="text-destructive font-medium">
                Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmDelete(false)} />
              <AlertDialogAction
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Xóa vĩnh viễn
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default DangerZone;
