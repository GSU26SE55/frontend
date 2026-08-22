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
import { useDeactivateAccount } from "@/features/auth/hooks/account/useDeactivateAccount";
import { useDeleteAccount } from "@/features/auth/hooks/account/useDeleteAccount";
import { useExportMyData } from "@/features/auth/hooks/account/useExportMyData";
import { handleErrorApi } from "@/shared/lib/errors";
import { AUTH_MESSAGES } from "@/features/auth/constants/messages";

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
      onSuccess: () => toast.success(AUTH_MESSAGES.account.dataExported),
      onError: (error) => handleErrorApi({ error }),
    });
  };

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive">Danger zone</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Download my data (GDPR)</p>
            <p className="text-xs text-muted-foreground">
              Export all account data as a JSON file
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
            Download data
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Deactivate account</p>
            <p className="text-xs text-muted-foreground">
              Temporarily deactivate the account
            </p>
          </div>
          <Button
            variant="destructive"
            onClick={() => setConfirmDeactivate(true)}
          >
            Deactivate
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Delete account</p>
            <p className="text-xs text-muted-foreground">
              Permanently delete the account and all data
            </p>
          </div>
          <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
            Delete account
          </Button>
        </div>

        <AlertDialog
          open={confirmDeactivate}
          onOpenChange={setConfirmDeactivate}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deactivate account?</AlertDialogTitle>
              <AlertDialogDescription>
                You can reactivate it later.
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
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Permanently delete account?</AlertDialogTitle>
              <AlertDialogDescription className="text-destructive font-medium">
                This action cannot be undone.
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
                Delete permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default DangerZone;
