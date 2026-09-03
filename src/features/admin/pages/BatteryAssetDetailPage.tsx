import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Pencil, ArrowRightLeft, Trash2, ShieldAlert } from "lucide-react";
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
import { useDeleteBatteryAsset } from "@/features/admin/hooks/battery/useDeleteBatteryAsset";
import BatteryAssetForm from "@/features/admin/components/battery/BatteryAssetForm";
import TransferOwnerDialog from "@/features/admin/components/battery/TransferOwnerDialog";
import SetTopologyDialog from "@/features/admin/components/iot/SetTopologyDialog";
import BatteryRealtimeDetail from "@/shared/components/battery/BatteryRealtimeDetail";
import BmsSwitchControlCard from "@/shared/components/battery/BmsSwitchControlCard";
import { ADMIN_MESSAGES } from "@/features/admin/constants/messages";

// Admin — full battery detail page: uses the shared BatteryRealtimeDetail (read-only core)
// + injects admin CRUD, the BMS control, and Set topology through headerActions.
export default function BatteryAssetDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [topologyOpen, setTopologyOpen] = useState(false);

  // Need the asset for the Edit/Transfer dialogs (same cache key as shared → no double-fetch).
  const { data: asset } = useBatteryAsset(id);
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
            <BmsSwitchControlCard assetId={id} />
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
        // Sits next to the score/level inside CascadeRiskCard instead of floating unrelated in
        // the top bar — the dialog itself already tells the reader it affects the score.
        // `currentTopology` comes straight from CascadeRiskCard's own fetch (same cache key as
        // the header badge) — no separate query needed here just to seed the dialog's default.
        cascadeTopologyAction={({ currentTopology }) => (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTopologyOpen(true)}
            >
              <ShieldAlert size={13} /> Set topology
            </Button>
            <SetTopologyDialog
              assetId={id}
              currentTopology={currentTopology}
              open={topologyOpen}
              onOpenChange={setTopologyOpen}
            />
          </>
        )}
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
                  <strong>{asset.serialNumber}</strong>? It is hidden from the
                  asset list and its readings stop being collected. An Admin can
                  restore it later from the deleted-assets filter.
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
    </>
  );
}
