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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toneClass, type StatusTone } from "@/shared/theme/statusColors";
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

// State of one MOSFET. `on` determines whether the next action enables or disables it.
// null means no verified readback is available. In that state, the next click enables
// the MOSFET because disabling an unknown state could cut power unintentionally.
function mosfetState(enabled: boolean | null | undefined) {
  if (enabled == null) return { on: false, tone: "muted" as StatusTone, label: "Unknown" };
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

// This component is intentionally rendered only by Admin and Staff routes. The API repeats
// the same authorization check; hiding it in the browser is not treated as a security boundary.
export default function BmsSwitchControlCard({ assetId }: { assetId: string }) {
  const stateQuery = useBmsSwitch(assetId);
  const mutation = useSetBmsSwitch(assetId);
  const { data: cascade } = useCascadeRisk(assetId);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const issuedCmdId = useRef<string | null>(null);
  const lastCommand = stateQuery.data?.lastCommand;
  const highRisk = cascade?.level === "High" || (cascade?.cascadeRiskScore ?? 0) >= 0.7;
  const pending = mutation.isPending || stateQuery.data?.pendingCommand != null;
  const charge = mosfetState(stateQuery.data?.chargeEnabled);
  const discharge = mosfetState(stateQuery.data?.dischargeEnabled);

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
    mutation.mutate(payload, {
      onSuccess: (accepted) => {
        issuedCmdId.current = accepted.cmdId;
        toast.message("Command sent; waiting for BMS confirmation.");
      },
      onError: (error) => toast.error(failureMessage(error)),
    });
  };

  if (stateQuery.isLoading) {
    return (
      <Card className="m-4 mt-0 p-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-24 w-full" />
      </Card>
    );
  }

  if (stateQuery.isError) {
    return (
      <Card className="m-4 mt-0 border-destructive/40 p-4">
        <p className="text-sm font-medium">Unable to load BMS controls</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {failureMessage(stateQuery.error)}
        </p>
      </Card>
    );
  }

  const action = confirmation?.enable ? "Enable" : "Disable";
  const targetName =
    confirmation?.target === BmsSwitchTarget.Charge ? "charging"
    : confirmation?.target === BmsSwitchTarget.Discharge ? "discharging"
    : "charging and discharging";

  return (
    <>
      <Card className="m-3 mt-0 gap-1.5 border-amber-300/70 bg-amber-50/30 py-2 dark:border-amber-900/60 dark:bg-amber-950/10">
        <CardHeader className="px-2.5 pb-0">
          <CardTitle className="flex items-center gap-1.5 text-[13px] leading-tight">
            <Power className="size-3.5 text-amber-700 dark:text-amber-400" />
            BMS Control
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 px-2.5">
          {highRisk && (
            <p className="flex gap-2 rounded-md border border-amber-300 bg-amber-100/70 p-2 text-xs text-amber-950 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
              <AlertTriangle className="mt-px size-3.5 shrink-0" />
              This battery has a high cascade risk. Inspect the site before re-enabling a MOSFET.
            </p>
          )}
          {/* The MOSFETs are controlled independently and stacked vertically because
              the narrow sidebar would compress labels in a two-column layout. */}
          {([
            { key: "charge", label: "Charge", state: charge, target: BmsSwitchTarget.Charge },
            { key: "discharge", label: "Discharge", state: discharge, target: BmsSwitchTarget.Discharge },
          ] as const).map((row) => (
            <div
              key={row.key}
              className="flex items-center gap-2 rounded-md border border-border/70 px-2 py-1.5"
            >
              {/* Shape and color both change so the state remains distinguishable
                  for users with color-vision deficiencies. */}
              <button
                type="button"
                disabled={pending}
                aria-pressed={row.state.on}
                aria-label={`${row.state.on ? "Disable" : "Enable"} battery ${row.label.toLowerCase()}`}
                onClick={() =>
                  setConfirmation({ target: row.target, enable: !row.state.on })
                }
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  toneClass(row.state.tone),
                  pending
                    ? "cursor-default opacity-50"
                    : "cursor-pointer hover:brightness-105 active:scale-95",
                )}
              >
                {row.state.on ? <Power className="size-4" /> : <PowerOff className="size-4" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium leading-tight">{row.label}</p>
                {/* Keep the state to one word. Detailed errors use a toast instead of
                    taking another line inside this compact card. */}
                <p className="text-[11px] leading-tight text-muted-foreground">
                  {pending ? "Waiting for BMS" : row.state.label}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

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
                    : "The charging MOSFET will turn off; the battery will stop charging but can still supply the load.")
                : confirmation?.target === BmsSwitchTarget.Discharge
                ? (confirmation.enable
                    ? "The discharging MOSFET will turn on; the battery can supply the load normally."
                    : "The discharging MOSFET will turn off; the load will lose power immediately, but the battery can still charge.")
                : (confirmation?.enable
                    ? "Both charging and discharging MOSFETs will turn on; the battery will operate normally."
                    : "Both charging and discharging MOSFETs will turn off; the battery will stop charging and supplying the load.")}
              {highRisk && " This battery has a high cascade risk."}
              {" The command succeeds only after the BMS sends a confirmation ACK."}
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
