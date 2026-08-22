import { useState } from "react";
import { MessageSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
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
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";
import {
  useAdminSmsDevices,
  useAdminRevokeSmsDevice,
} from "@/features/admin/hooks/notification/useAdminSmsGateway";
import SmsDeviceTable from "@/features/admin/components/sms-gateway/SmsDeviceTable";
import CreateSmsDeviceDialog from "@/features/admin/components/sms-gateway/CreateSmsDeviceDialog";
import ApiKeyRevealDialog from "@/features/admin/components/sms-gateway/ApiKeyRevealDialog";
import type {
  GatewayDeviceDto,
  CreateGatewayDeviceResponseDto,
} from "@/features/admin/types/ticket/sms-gateway.types";
import { ACTIONS } from "@/shared/constants/actions";

export default function SmsGatewayPage() {
  const [includeRevoked, setIncludeRevoked] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createdDevice, setCreatedDevice] =
    useState<CreateGatewayDeviceResponseDto | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<GatewayDeviceDto | null>(
    null,
  );

  const { data, isLoading } = useAdminSmsDevices({ includeRevoked });
  const { mutate: revokeDevice, isPending: revoking } =
    useAdminRevokeSmsDevice();
  const devices = data ?? [];

  const handleConfirmRevoke = () => {
    if (!revokeTarget) return;
    revokeDevice(revokeTarget.id, { onSettled: () => setRevokeTarget(null) });
  };

  return (
    <div className="p-6 space-y-6 max-w-360 mx-auto">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            Admin &middot; Notifications
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">SMS Gateway</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? "..." : devices.length} devices &mdash; manage the
            SMS-sending gateway.
          </p>
        </div>
        <div className="flex gap-2">
          <RefreshButton queryKeys={[KEY.admin.smsGateway]} />
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" /> Add device
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox
            checked={includeRevoked}
            onCheckedChange={(checked) => setIncludeRevoked(checked === true)}
          />
          <span className="text-muted-foreground">Show revoked</span>
        </label>
      </div>

      <Card className="gap-0 py-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : devices.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
            <MessageSquare className="size-8 opacity-30" />
            <span className="text-sm">No devices yet.</span>
          </div>
        ) : (
          <SmsDeviceTable data={devices} onRevoke={setRevokeTarget} />
        )}
      </Card>

      <CreateSmsDeviceDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={setCreatedDevice}
      />

      <ApiKeyRevealDialog
        device={createdDevice}
        open={!!createdDevice}
        onOpenChange={(open) => !open && setCreatedDevice(null)}
      />

      <AlertDialog
        open={!!revokeTarget}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke device?</AlertDialogTitle>
            <AlertDialogDescription>
              {revokeTarget && (
                <>
                  Revoke <strong>{revokeTarget.deviceName}</strong> (
                  {revokeTarget.deviceCode})? The device will no longer be able
                  to send SMS. This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{ACTIONS.CANCEL}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmRevoke}
              disabled={revoking}
            >
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
