import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Power, PowerOff } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type StatusTone } from "@/shared/theme/statusColors";
import { HttpError } from "@/shared/lib/errors";
import { useBmsSwitch } from "@/shared/hooks/battery/useBmsSwitch";
import { useCascadeRisk } from "@/shared/hooks/battery/useCascadeRisk";
import { useSetBmsSwitch } from "@/shared/hooks/battery/useSetBmsSwitch";
import {
  BmsSwitchCommandStatus,
  BmsSwitchTarget,
  type SetBmsSwitchPayload,
} from "@/shared/types/battery/bms-switch.types";

type Confirmation = SetBmsSwitchPayload;

const FAILED_STATUSES = new Set<number>([
  BmsSwitchCommandStatus.Failed,
  BmsSwitchCommandStatus.Rejected,
  BmsSwitchCommandStatus.Unknown,
  BmsSwitchCommandStatus.TimedOut,
]);

function mosfetState(enabled: boolean | null | undefined) {
  if (enabled == null) return { on: true, tone: "ok" as StatusTone, label: "On" };
  return enabled
    ? { on: true, tone: "ok" as StatusTone, label: "On" }
    : { on: false, tone: "p1" as StatusTone, label: "Off" };
}

function failureMessage(error: unknown) {
  if (error instanceof HttpError) return error.message;
  return "Unable to send the command to the device.";
}

function commandFailureMessage(status: number) {
  if (status === BmsSwitchCommandStatus.Rejected) return "The BMS rejected the control command.";
  if (status === BmsSwitchCommandStatus.Unknown) return "The firmware did not recognize the BMS control command.";
  if (status === BmsSwitchCommandStatus.TimedOut) return "The BMS control command timed out.";
  return "The BMS control command failed.";
}

export default function BmsSwitchControlCard({ assetId }: { assetId: string }) {
  const stateQuery = useBmsSwitch(assetId);
  const mutation = useSetBmsSwitch(assetId);
  const { data: cascade } = useCascadeRisk(assetId);
  const [openModal, setOpenModal] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [localSwitches, setLocalSwitches] = useState<{ charge?: boolean; discharge?: boolean }>({
    charge: true,
    discharge: true,
  });
  const issuedCmdId = useRef<string | null>(null);
  const lastCommand = stateQuery.data?.lastCommand;
  const highRisk = cascade?.level === "High" || (cascade?.cascadeRiskScore ?? 0) >= 0.7;
  const pending = mutation.isPending || stateQuery.data?.pendingCommand != null;
  const chargeEnabled = stateQuery.data?.chargeEnabled ?? localSwitches.charge ?? true;
  const dischargeEnabled = stateQuery.data?.dischargeEnabled ?? localSwitches.discharge ?? true;
  const charge = mosfetState(chargeEnabled);
  const discharge = mosfetState(dischargeEnabled);

  useEffect(() => {
    if (!lastCommand || issuedCmdId.current !== lastCommand.cmdId) return;

    issuedCmdId.current = null;
    if (lastCommand.status === BmsSwitchCommandStatus.Ok) {
      toast.success("The BMS confirmed and applied the new state.");
    } else if (FAILED_STATUSES.has(lastCommand.status)) {
      toast.error(commandFailureMessage(lastCommand.status));
    }
  }, [lastCommand]);

  const submit = (payload: SetBmsSwitchPayload) => {
    if (payload.target === BmsSwitchTarget.Charge) {
      setLocalSwitches((prev) => ({ ...prev, charge: payload.enable }));
    } else if (payload.target === BmsSwitchTarget.Discharge) {
      setLocalSwitches((prev) => ({ ...prev, discharge: payload.enable }));
    } else if (payload.target === BmsSwitchTarget.Both) {
      setLocalSwitches({ charge: payload.enable, discharge: payload.enable });
    }

    mutation.mutate(payload, {
      onSuccess: (accepted) => {
        issuedCmdId.current = accepted.cmdId;
        toast.message("Command sent; waiting for BMS confirmation.");
      },
      onError: (error) => toast.error(failureMessage(error)),
    });
  };

  const action = confirmation?.enable ? "Enable" : "Disable";
  const targetName =
    confirmation?.target === BmsSwitchTarget.Charge ? "charging MOSFET"
    : confirmation?.target === BmsSwitchTarget.Discharge ? "discharging MOSFET"
    : "both charge and discharge MOSFETs";

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpenModal(true)}
      >
        <Power size={13} />
        BMS control
      </Button>

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Power size={16} />
              BMS control
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Manage and control MOSFET charge and discharge switch states.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {highRisk && (
              <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <p>This battery has an elevated cascade risk. Inspect the site before re-enabling a MOSFET.</p>
              </div>
            )}

            {/* Charge switch */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "size-8 rounded-full flex items-center justify-center shrink-0 text-xs font-medium",
                  charge.on ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-muted text-muted-foreground"
                )}>
                  {charge.on ? <Power size={14} /> : <PowerOff size={14} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">Charge MOSFET</p>
                    <span className={cn(
                      "text-[10px] font-semibold px-1.5 py-0.5 rounded",
                      charge.on ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-muted text-muted-foreground"
                    )}>
                      {pending ? "Updating..." : (charge.on ? "ON" : "OFF")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Allows charging current from Solar/Grid into the battery
                  </p>
                </div>
              </div>
              <Button
                variant={charge.on ? "destructive" : "default"}
                size="sm"
                disabled={pending}
                onClick={() => setConfirmation({ target: BmsSwitchTarget.Charge, enable: !charge.on })}
              >
                {charge.on ? "Disable" : "Enable"}
              </Button>
            </div>

            {/* Discharge switch */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "size-8 rounded-full flex items-center justify-center shrink-0 text-xs font-medium",
                  discharge.on ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-muted text-muted-foreground"
                )}>
                  {discharge.on ? <Power size={14} /> : <PowerOff size={14} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">Discharge MOSFET</p>
                    <span className={cn(
                      "text-[10px] font-semibold px-1.5 py-0.5 rounded",
                      discharge.on ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-muted text-muted-foreground"
                    )}>
                      {pending ? "Updating..." : (discharge.on ? "ON" : "OFF")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Allows power delivery from the battery to connected loads
                  </p>
                </div>
              </div>
              <Button
                variant={discharge.on ? "destructive" : "default"}
                size="sm"
                disabled={pending}
                onClick={() => setConfirmation({ target: BmsSwitchTarget.Discharge, enable: !discharge.on })}
              >
                {discharge.on ? "Disable" : "Enable"}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpenModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmation !== null}
        onOpenChange={(open) => !open && setConfirmation(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className={confirmation?.enable ? undefined : "bg-destructive/10 text-destructive"}>
              <AlertTriangle />
            </AlertDialogMedia>
            <AlertDialogTitle>
              {action} battery {targetName}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmation?.target === BmsSwitchTarget.Charge
                ? (confirmation.enable
                    ? "The charging MOSFET will turn on; the battery can charge normally."
                    : "The charging MOSFET will turn off; the battery will stop charging but can still supply connected loads.")
                : confirmation?.target === BmsSwitchTarget.Discharge
                ? (confirmation.enable
                    ? "The discharging MOSFET will turn on; the battery will supply connected loads normally."
                    : "The discharging MOSFET will turn off; connected loads will lose battery power immediately.")
                : (confirmation?.enable
                    ? "Both charging and discharging MOSFETs will turn on."
                    : "Both charging and discharging MOSFETs will turn off.")}
              {highRisk && " Notice: This battery currently has an elevated cascade risk score."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant={confirmation?.enable ? "default" : "destructive"}
              disabled={mutation.isPending || confirmation === null}
              onClick={() => {
                if (confirmation) submit(confirmation);
                setConfirmation(null);
              }}
            >
              Confirm {action.toLowerCase()}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
