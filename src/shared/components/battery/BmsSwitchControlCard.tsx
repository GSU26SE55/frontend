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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

function mosfetState(enabled: boolean | null | undefined) {
  if (enabled == null)
    return { on: false, tone: "muted" as StatusTone, label: "Unknown" };
  return enabled
    ? { on: true, tone: "ok" as StatusTone, label: "On" }
    : { on: false, tone: "p1" as StatusTone, label: "Off" };
}

function failureMessage(error: unknown) {
  if (error instanceof HttpError) return error.message;
  return "Unable to send the command to the device.";
}

function commandFailureMessage(status: number) {
  if (status === BmsSwitchCommandStatus.Rejected)
    return "The BMS rejected the control command.";
  if (status === BmsSwitchCommandStatus.Unknown)
    return "The firmware did not recognize the BMS control command.";
  if (status === BmsSwitchCommandStatus.TimedOut)
    return "The BMS control command timed out.";
  return "The BMS control command failed.";
}

// Rendered by the Admin, Manager and Staff battery detail routes — matching the roles the
// API authorizes on /bms-switch. The API repeats the check; hiding it in the browser is not
// treated as a security boundary.
//
// `variant` picks the shell only — the controls, confirmation dialog and toasts are identical.
// "popover" is the header button used by both callers; "card" is the older sidebar block,
// kept so the control can be moved back into the sidebar without rewriting it. "dialog" has no
// trigger of its own — its open state is controlled by the caller (e.g. a DropdownMenuItem
// "BMS" in a table row's Actions menu, where the control can't own a nested Popover trigger).
export default function BmsSwitchControlCard({
  assetId,
  variant = "popover",
  open,
  onOpenChange,
}: {
  assetId: string;
  variant?: "card" | "popover" | "dialog";
  /** "dialog" variant only — open state is controlled by the caller. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const stateQuery = useBmsSwitch(assetId);
  const mutation = useSetBmsSwitch(assetId);
  const { data: cascade } = useCascadeRisk(assetId);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [localSwitches, setLocalSwitches] = useState<{
    charge?: boolean;
    discharge?: boolean;
  }>({
    charge: true,
    discharge: true,
  });
  const issuedCmdId = useRef<string | null>(null);
  const lastCommand = stateQuery.data?.lastCommand;
  const highRisk =
    cascade?.level === "High" || (cascade?.cascadeRiskScore ?? 0) >= 0.7;
  const pending = mutation.isPending || stateQuery.data?.pendingCommand != null;
  const chargeEnabled =
    stateQuery.data?.chargeEnabled ?? localSwitches.charge ?? true;
  const dischargeEnabled =
    stateQuery.data?.dischargeEnabled ?? localSwitches.discharge ?? true;
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
    } else if (payload.target === BmsSwitchTarget.All) {
      setLocalSwitches({ charge: payload.enable, discharge: payload.enable });
    }

    mutation.mutate(payload, {
      // No "command sent" toast: acceptance is not the outcome the operator is waiting
      // for, and pairing it with the confirmation toast that follows meant every switch
      // produced two notifications. The wait is already visible in the control itself,
      // which stays disabled and pending until the BMS answers.
      onSuccess: (accepted) => {
        issuedCmdId.current = accepted.cmdId;
      },
      onError: (error) => toast.error(failureMessage(error)),
    });
  };

  // In the header the placeholder is a disabled button, not a card: a skeleton card
  // sitting in a row of buttons reads as a broken layout rather than as loading.
  if (stateQuery.isLoading) {
    if (variant === "dialog") {
      return (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="w-72">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-1.5 text-2sm">
                <Power className="size-3.5 text-amber-700 dark:text-amber-400" />
                BMS Control
              </DialogTitle>
            </DialogHeader>
            <Skeleton className="h-24 w-full" />
          </DialogContent>
        </Dialog>
      );
    }
    return variant === "popover" ? (
      <Button variant="outline" size="sm" disabled aria-label="BMS Control">
        <Power className="size-3.5" />
        BMS
      </Button>
    ) : (
      <Card className="m-4 mt-0 p-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-24 w-full" />
      </Card>
    );
  }

  if (stateQuery.isError) {
    const message = failureMessage(stateQuery.error);
    if (variant === "dialog") {
      return (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="w-72">
            <DialogHeader>
              <DialogTitle className="text-2sm">
                Unable to load BMS controls
              </DialogTitle>
            </DialogHeader>
            <p className="text-xs text-muted-foreground">{message}</p>
          </DialogContent>
        </Dialog>
      );
    }
    return variant === "popover" ? (
      <Popover>
        <PopoverTrigger
          render={
            <Button variant="outline" size="sm" aria-label="BMS Control" />
          }
        >
          <Power className="size-3.5 text-destructive" />
          BMS
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64">
          <p className="text-sm font-medium">Unable to load BMS controls</p>
          <p className="text-xs text-muted-foreground">{message}</p>
        </PopoverContent>
      </Popover>
    ) : (
      <Card className="m-4 mt-0 border-destructive/40 p-4">
        <p className="text-sm font-medium">Unable to load BMS controls</p>
        <p className="mt-1 text-xs text-muted-foreground">{message}</p>
      </Card>
    );
  }

  const action = confirmation?.enable ? "Enable" : "Disable";
  const targetName =
    confirmation?.target === BmsSwitchTarget.Charge
      ? "charging"
      : confirmation?.target === BmsSwitchTarget.Discharge
        ? "discharging"
        : "charging and discharging";

  const controls = (
    <>
      {highRisk && (
        <p className="flex gap-2 rounded-md border border-amber-300 bg-amber-100/70 p-2 text-xs text-amber-950 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
          <AlertTriangle className="mt-px size-3.5 shrink-0" />
          This battery has a high cascade risk. Inspect the site before
          re-enabling a MOSFET.
        </p>
      )}
      {/* The MOSFETs are controlled independently and stacked vertically because
          the narrow container would compress labels in a two-column layout. */}
      {(
        [
          {
            key: "charge",
            label: "Charge",
            state: charge,
            target: BmsSwitchTarget.Charge,
          },
          {
            key: "discharge",
            label: "Discharge",
            state: discharge,
            target: BmsSwitchTarget.Discharge,
          },
        ] as const
      ).map((row) => (
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
              "grid size-8 shrink-0 place-items-center rounded-full transition-[color,background-color,border-color,box-shadow,transform] duration-(--motion-state) ease-strong",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              toneClass(row.state.tone),
              pending
                ? "cursor-default opacity-50"
                : "cursor-pointer hover:brightness-105 active:scale-95",
            )}
          >
            {row.state.on ? (
              <Power className="size-4" />
            ) : (
              <PowerOff className="size-4" />
            )}
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-2sm font-medium leading-tight">{row.label}</p>
            {/* Keep the state to one word. Detailed errors use a toast instead of
                taking another line inside this compact panel. */}
            <p className="text-2xs leading-tight text-muted-foreground">
              {pending ? "Waiting for BMS" : row.state.label}
            </p>
          </div>
        </div>
      ))}
    </>
  );

  return (
    <>
      {variant === "popover" ? (
        <Popover>
          <PopoverTrigger
            render={
              <Button variant="outline" size="sm" aria-label="BMS Control" />
            }
          >
            <Power className="size-3.5 text-amber-700 dark:text-amber-400" />
            BMS
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 gap-1.5">
            <p className="flex items-center gap-1.5 text-2sm font-medium leading-tight">
              <Power className="size-3.5 text-amber-700 dark:text-amber-400" />
              BMS Control
            </p>
            {controls}
          </PopoverContent>
        </Popover>
      ) : variant === "dialog" ? (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="w-72 gap-2">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-1.5 text-2sm leading-tight">
                <Power className="size-3.5 text-amber-700 dark:text-amber-400" />
                BMS Control
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-1.5">{controls}</div>
          </DialogContent>
        </Dialog>
      ) : (
        <Card className="m-3 mt-0 gap-1.5 border-amber-300/70 bg-amber-50/30 py-2 dark:border-amber-900/60 dark:bg-amber-950/10">
          <CardHeader className="px-2.5 pb-0">
            <CardTitle className="flex items-center gap-1.5 text-2sm leading-tight">
              <Power className="size-3.5 text-amber-700 dark:text-amber-400" />
              BMS Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 px-2.5">{controls}</CardContent>
        </Card>
      )}

      <AlertDialog
        open={confirmation !== null}
        onOpenChange={(open) => !open && setConfirmation(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia
              className={
                confirmation?.enable
                  ? undefined
                  : "bg-destructive/10 text-destructive"
              }
            >
              <AlertTriangle />
            </AlertDialogMedia>
            <AlertDialogTitle>
              {action} battery {targetName}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmation?.target === BmsSwitchTarget.Charge
                ? confirmation.enable
                  ? "The charging MOSFET will turn on; the battery can charge normally."
                  : "The charging MOSFET will turn off; the battery will stop charging but can still supply the load."
                : confirmation?.target === BmsSwitchTarget.Discharge
                  ? confirmation.enable
                    ? "The discharging MOSFET will turn on; the battery can supply the load normally."
                    : "The discharging MOSFET will turn off; the load will lose power immediately, but the battery can still charge."
                  : confirmation?.enable
                    ? "Both charging and discharging MOSFETs will turn on; the battery will operate normally."
                    : "Both charging and discharging MOSFETs will turn off; the battery will stop charging and supplying the load."}
              {highRisk && " This battery has a high cascade risk."}
              {
                " The command succeeds only after the BMS sends a confirmation ACK."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutation.isPending}>
              Cancel
            </AlertDialogCancel>
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
