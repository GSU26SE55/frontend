import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Pencil, ArrowRightLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { useBatteryAsset } from "@/features/admin/hooks/battery/useBatteryAsset";
import { useCascadeRisk } from "@/features/admin/hooks/battery/useCascadeRisk";
import { useDeleteBatteryAsset } from "@/features/admin/hooks/battery/useDeleteBatteryAsset";
import BatteryAssetForm from "@/features/admin/components/battery/BatteryAssetForm";
import TransferOwnerDialog from "@/features/admin/components/battery/TransferOwnerDialog";
import SetTopologyDialog from "@/features/admin/components/iot/SetTopologyDialog";
import BatteryRealtimeDetail from "@/shared/components/battery/BatteryRealtimeDetail";
import BmsSwitchControlCard from "@/shared/components/battery/BmsSwitchControlCard";
import { ADMIN_MESSAGES } from "@/features/admin/constants/messages";

// Admin — full battery detail page: uses the shared BatteryRealtimeDetail (read-only core)
// + injects admin CRUD and the BMS control through headerActions.
//
// The "Set topology" trigger is hidden for now; SetTopologyDialog below is kept wired so
// restoring it only means putting the button back into headerActions.
export default function BatteryAssetDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [topologyOpen, setTopologyOpen] = useState(false);

  // Need the asset for the Edit/Transfer dialogs (same cache key as shared → no double-fetch).
  const { data: asset } = useBatteryAsset(id);
  // Current topology for SetTopologyDialog (same cache key as the header's CascadeRiskBadge in shared).
  const { data: cascade } = useCascadeRisk(id);
  const { mutate: deleteAsset } = useDeleteBatteryAsset();

  const handleDelete = () => {
    deleteAsset(id, {
      onSuccess: () => {
        toast.success(ADMIN_MESSAGES.battery.deleted);
        navigate("/admin/battery-assets");
      },
    });
  };

  return (
    <>
      <BatteryRealtimeDetail
        assetId={id}
        headerActions={
          <>
            <BmsSwitchControlCard assetId={id} variant="popover" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
            >
              <Pencil size={13} /> Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTransferOpen(true)}
            >
              <ArrowRightLeft size={13} /> Transfer
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 size={13} /> Delete
            </Button>
          </>
        }
      />

      {/* -- Dialogs (Admin only) -- */}
      {asset && (
        <>
          <BatteryAssetForm
            open={editOpen}
            onOpenChange={setEditOpen}
            editData={asset}
          />
          <TransferOwnerDialog
            open={transferOpen}
            onOpenChange={setTransferOpen}
            assetId={id}
            currentCustomerId={asset.customerId}
          />
          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete battery asset?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete{" "}
                  <strong>{asset.serialNumber}</strong>? This action cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel />
                <AlertDialogAction variant="destructive" onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
      <SetTopologyDialog
        assetId={id}
        currentTopology={cascade?.electricalTopology}
        open={topologyOpen}
        onOpenChange={setTopologyOpen}
      />
    </>
  );
}
