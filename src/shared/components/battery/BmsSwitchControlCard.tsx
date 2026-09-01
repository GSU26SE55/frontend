import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Power,
  PowerOff,
} from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toneText, type StatusTone } from "@/shared/theme/statusColors";
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

/**
 * The dialog's own trigger. Omitted when the caller controls `open` — then something else
 * (a menu item, another button) is already the affordance.
 */
function BmsTrigger({
  disabled,
  tone,
}: {
  disabled?: boolean;
  tone?: "danger";
}) {
  return (
    <DialogTrigger
      render={
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          aria-label="BMS Control"
        />
      }
    >
      <Power
        className={cn(
          "size-3.5",
          tone === "danger"
            ? "text-destructive"
            : "text-amber-700 dark:text-amber-400",
        )}
      />
      BMS
    </DialogTrigger>
  );
}

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
//
// "dialog" (default) is what every caller on the web uses. It was a popover until switching a
// MOSFET from a popover proved wrong for the job: a popover dismisses on any outside click or
// scroll, which is the wrong behaviour for a control that stays open while it waits several
// hundred ms for the BMS to answer — losing the panel mid-command hides whether the switch
// actually took. A modal dialog holds until the operator closes it. It also nests correctly
// inside a menu item, which a Popover trigger cannot.
//
// "card" is the older sidebar block, kept so the control can be moved back into the sidebar
// without rewriting it.
//
// The dialog supplies its own trigger button unless the caller passes `open`, in which case the
// caller owns the open state (e.g. a "BMS" item in a table row's Actions menu).
export default function BmsSwitchControlCard({
  assetId,
  variant = "dialog",
  open,
  onOpenChange,
}: {
  assetId: string;
  variant?: "card" | "dialog";
  /**
   * Controlled open state. Omit and the dialog renders its own "BMS" trigger button; pass it
   * to drive the dialog from elsewhere (a menu item, another button).
   */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const stateQuery = useBmsSwitch(assetId);
  const mutation = useSetBmsSwitch(assetId);
  const { data: cascade } = useCascadeRisk(assetId);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  // What the confirm button will do. Defaults to the urgent case — cut everything — matching
  // the site-wide dialog.
  const [pickTarget, setPickTarget] = useState<BmsSwitchTarget>(
    BmsSwitchTarget.All,
  );
  const [pickEnable, setPickEnable] = useState(false);
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

  // "Both" gửi HAI lệnh TUẦN TỰ (charge rồi discharge), không phải một lệnh `target: "all"`.
  //
  // Lý do: firmware chỉ map charge=1 / discharge=2 (`cmd_logic.cpp`) — `"all"` rớt validation ở
  // thiết bị và ack về `failed`. Hai lệnh rời chạy được với đúng firmware đang nạp, và backend
  // không chặn vì `TargetsOverlap(charge, discharge)` = false (hai MOSFET khác nhau).
  //
  // Đổi lại còn ĐƯỢC nhiều hơn: mỗi MOSFET có ack riêng, status riêng và readback riêng, nên ca
  // "áp dụng được một nửa" hiện ra rõ từng cái thay vì phải nhồi vào một trạng thái chung.
  const submitOne = (payload: SetBmsSwitchPayload) =>
    mutation.mutateAsync(payload).then((accepted) => {
      issuedCmdId.current = accepted.cmdId;
      return accepted;
    });

  const submit = (payload: SetBmsSwitchPayload) => {
    if (payload.target === BmsSwitchTarget.Charge) {
      setLocalSwitches((prev) => ({ ...prev, charge: payload.enable }));
    } else if (payload.target === BmsSwitchTarget.Discharge) {
      setLocalSwitches((prev) => ({ ...prev, discharge: payload.enable }));
    } else if (payload.target === BmsSwitchTarget.All) {
      setLocalSwitches({ charge: payload.enable, discharge: payload.enable });
    }

    // No "command sent" toast: acceptance is not the outcome the operator is waiting for, and
    // pairing it with the confirmation toast that follows meant every switch produced two
    // notifications. The wait is already visible in the control itself, which stays disabled
    // and pending until the BMS answers.
    if (payload.target !== BmsSwitchTarget.All) {
      submitOne(payload).catch((error) => toast.error(failureMessage(error)));
      return;
    }

    void (async () => {
      try {
        await submitOne({
          target: BmsSwitchTarget.Charge,
          enable: payload.enable,
        });
      } catch (error) {
        toast.error(failureMessage(error));
        // TẮT thì vẫn đi tiếp: mục đích là cô lập pin, tắt được vế nào hay vế đó.
        // BẬT thì dừng: bật nửa vời trong khi nửa kia lỗi là trạng thái không ai muốn.
        if (payload.enable) return;
      }
      try {
        await submitOne({
          target: BmsSwitchTarget.Discharge,
          enable: payload.enable,
        });
      } catch (error) {
        toast.error(failureMessage(error));
      }
    })();
  };

  // In a row of header buttons the placeholder is a disabled trigger, not a card: a skeleton
  // card sitting among buttons reads as a broken layout rather than as loading.
  const controlled = open !== undefined;

  if (stateQuery.isLoading) {
    if (variant === "card")
      return (
        <Card className="m-4 mt-0 p-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-24 w-full" />
        </Card>
      );
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        {!controlled && <BmsTrigger disabled />}
        <DialogContent className="max-w-md">
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

  if (stateQuery.isError) {
    const message = failureMessage(stateQuery.error);
    if (variant === "card")
      return (
        <Card className="m-4 mt-0 border-destructive/40 p-4">
          <p className="text-sm font-medium">Unable to load BMS controls</p>
          <p className="mt-1 text-xs text-muted-foreground">{message}</p>
        </Card>
      );
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        {!controlled && <BmsTrigger tone="danger" />}
        <DialogContent className="max-w-md">
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

  const action = confirmation?.enable ? "Enable" : "Disable";
  const targetName =
    confirmation?.target === BmsSwitchTarget.Charge
      ? "charging"
      : confirmation?.target === BmsSwitchTarget.Discharge
        ? "discharging"
        : "charging and discharging";

  // Same shape as the site-wide dialog: pick the MOSFET, pick the direction, confirm with a
  // button that names the exact action. Two controls that switch the same hardware should not
  // demand two different mental models — and the old per-row toggle hid the direction inside
  // the current state, so the operator only learned what a click would do by reading the
  // sub-label first.
  //
  // What this one keeps that the site dialog cannot: the CURRENT state of each MOSFET, which
  // only exists per battery. It is shown as a read-only status line rather than as the control.
  const targetLabel =
    pickTarget === BmsSwitchTarget.Charge
      ? "charge"
      : pickTarget === BmsSwitchTarget.Discharge
        ? "discharge"
        : "both";

  const controls = (
    <>
      {highRisk && (
        <p className="flex gap-2 rounded-md border border-amber-300 bg-amber-100/70 p-2 text-xs text-amber-950 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
          <AlertTriangle className="mt-px size-3.5 shrink-0" />
          This battery has a high cascade risk. Inspect the site before
          re-enabling a MOSFET.
        </p>
      )}

      {/* Current state first — it is what the operator checks before deciding. */}
      <div className="grid grid-cols-2 gap-1.5">
        {(
          [
            {
              key: "charge",
              label: "Charge",
              state: charge,
              // Direction of current rather than a second power symbol: both tiles used the
              // same Power glyph, so at a glance they were one control duplicated. An arrow
              // INTO the pack vs OUT of it says which path each tile is about.
              Icon: ArrowDownToLine,
            },
            {
              key: "discharge",
              label: "Discharge",
              state: discharge,
              Icon: ArrowUpFromLine,
            },
          ] as const
        ).map((row) => (
          <div
            key={row.key}
            className="rounded-md border border-border/70 px-3 py-2"
          >
            <p className="text-2xs leading-tight text-muted-foreground">
              {row.label}
            </p>
            <p
              className={cn(
                "mt-0.5 flex items-center gap-1.5 text-sm font-medium leading-tight",
                toneText(row.state.tone),
              )}
            >
              <row.Icon className="size-3.5" />
              {/* On/Off spelled out, not just coloured — the state has to survive
                  colour-vision deficiency, and the icon now carries direction instead. */}
              {pending ? "Waiting…" : row.state.label}
            </p>
          </div>
        ))}
      </div>

      {/* MOSFET and direction, then the confirm button — same order as the site dialog. */}
      <div className="grid grid-cols-3 gap-1 rounded-md bg-muted p-1">
        {(
          [
            { value: BmsSwitchTarget.All, label: "Both" },
            { value: BmsSwitchTarget.Charge, label: "Charge" },
            { value: BmsSwitchTarget.Discharge, label: "Discharge" },
          ] as const
        ).map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={pending}
            aria-pressed={pickTarget === option.value}
            onClick={() => setPickTarget(option.value)}
            className={cn(
              "rounded px-2 py-1.5 text-xs font-medium transition-colors",
              pickTarget === option.value
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground",
              pending && "cursor-default opacity-50",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-md bg-muted p-1">
        {(
          [
            { value: false, label: "Turn off", icon: PowerOff },
            { value: true, label: "Turn on", icon: Power },
          ] as const
        ).map((option) => (
          <button
            key={String(option.value)}
            type="button"
            disabled={pending}
            aria-pressed={pickEnable === option.value}
            onClick={() => setPickEnable(option.value)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded px-2 py-1.5 text-xs font-medium transition-colors",
              pickEnable === option.value
                ? option.value
                  ? "bg-background text-emerald-700 shadow-sm dark:text-emerald-400"
                  : "bg-background text-destructive shadow-sm"
                : "text-muted-foreground hover:text-foreground",
              pending && "cursor-default opacity-50",
            )}
          >
            <option.icon className="size-3.5" />
            {option.label}
          </button>
        ))}
      </div>

      <Button
        variant={pickEnable ? "default" : "destructive"}
        disabled={pending}
        onClick={() =>
          setConfirmation({ target: pickTarget, enable: pickEnable })
        }
        className="w-full"
      >
        {pickEnable ? (
          <Power className="size-3.5" />
        ) : (
          <PowerOff className="size-3.5" />
        )}
        {pickEnable ? "Turn on" : "Turn off"} {targetLabel}
      </Button>
    </>
  );

  return (
    <>
      {variant === "dialog" ? (
        <Dialog open={open} onOpenChange={onOpenChange}>
          {!controlled && <BmsTrigger />}
          <DialogContent className="max-w-md gap-3">
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
