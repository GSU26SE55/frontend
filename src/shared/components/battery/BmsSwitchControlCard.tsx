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
import { useSetBmsSwitch } from "@/shared/hooks/battery/useSetBmsSwitch";
import {
  BmsSwitchCommandStatus,
  BmsSwitchTarget,
  type SetBmsSwitchPayload,
} from "@/shared/types/battery/bms-switch.types";

type Confirmation = SetBmsSwitchPayload;

/** Kết quả của MỘT lần bấm — "Both" là hai lệnh nhưng vẫn chỉ là một lượt. */
interface Batch {
  enable: boolean;
  /** MOSFET lượt này phải đổi được. Vế nào gửi hỏng thì rút khỏi đây. */
  targets: BmsSwitchTarget[];
  /** cmdId đã gửi được, theo thứ tự. Phần tử cuối là lệnh chốt lượt. */
  issued: string[];
  /** true khi đã gửi xong TOÀN BỘ lượt — trước đó tuyệt đối không được kết luận. */
  sealed: boolean;
  failures: string[];
}

const targetsOf = (target: BmsSwitchTarget) =>
  target === BmsSwitchTarget.All
    ? [BmsSwitchTarget.Charge, BmsSwitchTarget.Discharge]
    : [target];

const targetNoun = (target: BmsSwitchTarget) =>
  target === BmsSwitchTarget.Charge ? "Charging" : "Power output";

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
  onClick,
}: {
  disabled?: boolean;
  tone?: "danger";
  onClick?: () => void;
}) {
  return (
    <DialogTrigger
      render={
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          aria-label="BMS Control"
          onClick={onClick}
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
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  // What the confirm button will do. Defaults to the urgent case — cut everything — matching
  // the site-wide dialog.
  const [pickTarget, setPickTarget] = useState<BmsSwitchTarget>(
    BmsSwitchTarget.All,
  );
  const [pickEnable, setPickEnable] = useState(false);
  // Cả lượt là một thao tác: nút phải khoá luôn trong 1.2s chờ giữa hai lệnh, lúc đó không có
  // `mutation.isPending` lẫn `pendingCommand` nào để suy ra.
  const [busy, setBusy] = useState(false);
  // Một lần bấm = MỘT toast, kể cả "Both" (hai lệnh, hai ack, có thể thêm lỗi gửi).
  const batch = useRef<Batch | null>(null);

  const state = stateQuery.data;
  // Lượt được chốt xong từ trong một async closure, nơi `state` của render bắt được đã cũ.
  const refetchState = stateQuery.refetch;
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Cascade risk UI hidden on FE — warning banner disabled accordingly.
  const highRisk = false;
  const pending = busy || mutation.isPending || state?.pendingCommand != null;

  // Đọc THẲNG readback, không có giá trị mặc định: `?? true` cũ bịa ra "On" cho một MOSFET mà
  // thiết bị chưa hề báo trạng thái — với một công tắc cắt điện thì đoán bừa là thứ tệ nhất.
  const charge = mosfetState(state?.chargeEnabled);
  const discharge = mosfetState(state?.dischargeEnabled);

  // Chỉ MOSFET đang có lệnh bay mới hiện "Waiting…" — vế kia vẫn phải đọc được trạng thái thật
  // của nó. Hai ô cùng "Waiting…" là nói dối về vế chưa hề bị đụng tới.
  const inFlight = mutation.isPending
    ? mutation.variables?.target
    : state?.pendingCommand?.target;
  const isWaiting = (target: BmsSwitchTarget) =>
    inFlight === target || inFlight === BmsSwitchTarget.All;

  const readbackOf = (target: BmsSwitchTarget) =>
    target === BmsSwitchTarget.Charge
      ? state?.chargeEnabled
      : state?.dischargeEnabled;
  // Đã ở sẵn trạng thái đó thì gửi lệnh cũng không đổi được gì → khoá lại, đừng bắt người dùng
  // bấm rồi chờ BMS trả về "đã xong" mà thực tế chẳng có gì xảy ra.
  // `null` = thiết bị không báo trạng thái → KHÔNG khoá: không chứng minh được là thừa.
  const isRedundant = (enable: boolean) =>
    targetsOf(pickTarget).every((target) => {
      const actual = readbackOf(target);
      return actual != null && actual === enable;
    });
  // Hướng thực sự sẽ gửi đi. Nếu hướng đang chọn hoá ra thừa (đã ở sẵn trạng thái đó) mà hướng
  // kia thì không, tự lật sang hướng kia.
  const activeEnable =
    isRedundant(pickEnable) && !isRedundant(!pickEnable)
      ? !pickEnable
      : pickEnable;
  const redundant = isRedundant(activeEnable);

  const finishBatch = () => {
    const current = batch.current;
    if (!current) return;
    batch.current = null;
    setBusy(false);
    if (current.failures.length === 0) {
      toast.success("Success");
      return;
    }
    // Trùng nhau thì gộp: hai MOSFET hỏng cùng một lý do vẫn chỉ là một dòng.
    toast.error([...new Set(current.failures)].join(" "));
  };

  // Chốt lượt CHỈ khi lệnh cuối đã gửi xong VÀ đã ack xong. `sealed` là thứ chặn ca "Both"
  // báo ngay sau lệnh charge trong lúc lệnh discharge còn chưa được gửi đi.
  const settle = () => {
    const current = batch.current;
    const snapshot = stateRef.current;
    if (!current || !current.sealed) return;

    const finalId = current.issued[current.issued.length - 1];
    if (!finalId) return; // không lệnh nào tới được thiết bị — submit() đã báo rồi
    // `lastCommand` là lệnh MỚI NHẤT ở backend. Chờ tới khi nó chính là lệnh chốt lượt, nếu
    // không ta đang đọc ack của lệnh đầu và kết luận sớm.
    if (snapshot?.lastCommand?.cmdId !== finalId) return;
    if (
      snapshot.lastCommand.status === BmsSwitchCommandStatus.Pending ||
      snapshot.pendingCommand
    )
      return;

    if (FAILED_STATUSES.has(snapshot.lastCommand.status))
      current.failures.push(commandFailureMessage(snapshot.lastCommand.status));

    // Rồi mới xét trạng thái ĐỌC VỀ của từng MOSFET: ack của lệnh đầu có thể đã bị lệnh sau ghi
    // đè trong `lastCommand`, nên readback mới là bằng chứng cả hai vế đã đổi thật. `null` là
    // thiết bị không báo trạng thái — không coi là sai, ack ở trên đã nói phần đó.
    for (const target of current.targets) {
      const actual =
        target === BmsSwitchTarget.Charge
          ? snapshot.chargeEnabled
          : snapshot.dischargeEnabled;
      if (actual != null && actual !== current.enable)
        current.failures.push(
          `${targetNoun(target)} did not turn ${current.enable ? "on" : "off"}.`,
        );
    }

    finishBatch();
  };

  // Chạy theo mỗi lần state đổi; `submit` cũng gọi thẳng sau khi seal, phòng ca ack về ngay
  // trong lần refetch cuối — lúc đó không còn `pendingCommand` để poll 400ms đánh thức nữa.
  useEffect(settle, [state]);

  // "Both" gửi HAI lệnh TUẦN TỰ (charge rồi discharge), không phải một lệnh `target: "all"`.
  //
  // Lý do: firmware chỉ map charge=1 / discharge=2 (`cmd_logic.cpp`) — `"all"` rớt validation ở
  // thiết bị và ack về `failed`. Hai lệnh rời chạy được với đúng firmware đang nạp, và backend
  // không chặn vì `TargetsOverlap(charge, discharge)` = false (hai MOSFET khác nhau).
  //
  // Đổi lại còn ĐƯỢC nhiều hơn: mỗi MOSFET có ack riêng, status riêng và readback riêng, nên ca
  // "áp dụng được một nửa" hiện ra rõ từng cái thay vì phải nhồi vào một trạng thái chung.
  // cmdId phải vào `issued` TRƯỚC khi refetch: thiết bị nhanh có thể ack ngay trong lần fetch
  // đó, và một ack tới lúc lượt chưa ghi nhận lệnh là một ack bị bỏ rơi — không ai báo gì cả.
  //
  // Và phải refetch: response accept chỉ có cmdId, không có trạng thái MOSFET. Có fetch lại thì
  // `pendingCommand` mới vào cache, và chỉ khi đó query mới đổi sang nhịp poll 400ms để bắt
  // readback — không thì nó ngồi im tới lần refetch 30s kế tiếp.
  const submitOne = async (target: BmsSwitchTarget, enable: boolean) => {
    const current = batch.current;
    try {
      const accepted = await mutation.mutateAsync({ target, enable });
      if (current) current.issued.push(accepted.cmdId);
      await refetchState();
      return true;
    } catch (error) {
      if (current) {
        current.failures.push(failureMessage(error));
        // Lệnh không rời được máy thì đừng đòi readback của vế đó nữa — lỗi gửi đã nói rồi.
        current.targets = current.targets.filter((t) => t !== target);
      }
      return false;
    }
  };

  const submit = (payload: SetBmsSwitchPayload) => {
    // Guards against a double-click firing submit() twice before the dialog closes: the
    // AlertDialogAction onClick calls setConfirmation(null) synchronously, but mutation.isPending
    // only flips true after the mutateAsync call inside submitOne actually runs (deferred for
    // "All" behind an async IIFE), leaving a window where a second click still passes the button's
    // own `disabled={mutation.isPending}` check.
    if (pending) return;

    const current: Batch = {
      enable: payload.enable,
      targets: targetsOf(payload.target),
      issued: [],
      sealed: false,
      failures: [],
    };
    batch.current = current;
    setBusy(true);

    // No "command sent" toast: acceptance is not the outcome the operator is waiting for, and
    // pairing it with the confirmation toast that follows meant every switch produced two
    // notifications. The wait is already visible in the control itself, which stays disabled
    // and pending until the BMS answers.
    void (async () => {
      if (payload.target !== BmsSwitchTarget.All) {
        await submitOne(payload.target, payload.enable);
      } else {
        const chargeSent = await submitOne(
          BmsSwitchTarget.Charge,
          payload.enable,
        );
        // TẮT thì vẫn đi tiếp: mục đích là cô lập pin, tắt được vế nào hay vế đó.
        // BẬT thì dừng: bật nửa vời trong khi nửa kia lỗi là trạng thái không ai muốn.
        if (chargeSent || !payload.enable) {
          // Đợi 1.2s để bus RS485 Modbus và BMS hoàn tất lệnh trước khi gửi lệnh thứ hai
          await new Promise((resolve) => setTimeout(resolve, 1200));
          await submitOne(BmsSwitchTarget.Discharge, payload.enable);
        } else {
          current.targets = current.targets.filter(
            (t) => t !== BmsSwitchTarget.Discharge,
          );
        }
      }

      // So sánh identity phòng người dùng đã bấm lượt mới trong lúc chờ.
      if (batch.current !== current) return;
      current.sealed = true;
      // Không lệnh nào tới được thiết bị → sẽ chẳng có ack nào để chờ, báo lỗi ngay.
      if (current.issued.length === 0) finishBatch();
      else settle();
    })();
  };

  // Tự động fetch lại trạng thái BMS mới nhất mỗi khi mở dialog
  useEffect(() => {
    if (open) void refetchState();
  }, [open, refetchState]);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) void refetchState();
    onOpenChange?.(isOpen);
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
      <Dialog open={open} onOpenChange={handleOpenChange}>
        {!controlled && (
          <BmsTrigger disabled onClick={() => stateQuery.refetch()} />
        )}
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
      <Dialog open={open} onOpenChange={handleOpenChange}>
        {!controlled && (
          <BmsTrigger tone="danger" onClick={() => stateQuery.refetch()} />
        )}
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
              waiting: isWaiting(BmsSwitchTarget.Charge),
              // Direction of current rather than a second power symbol: both tiles used the
              // same Power glyph, so at a glance they were one control duplicated. An arrow
              // INTO the pack vs OUT of it says which path each tile is about.
              Icon: ArrowDownToLine,
            },
            {
              key: "discharge",
              label: "Discharge",
              state: discharge,
              waiting: isWaiting(BmsSwitchTarget.Discharge),
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
              {row.waiting ? "Waiting…" : row.state.label}
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
            {
              value: false,
              label: "Turn off",
              icon: PowerOff,
              off: isRedundant(false),
            },
            {
              value: true,
              label: "Turn on",
              icon: Power,
              off: isRedundant(true),
            },
          ] as const
        ).map((option) => (
          <button
            key={String(option.value)}
            type="button"
            disabled={pending || option.off}
            aria-pressed={activeEnable === option.value}
            onClick={() => setPickEnable(option.value)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded px-2 py-1.5 text-xs font-medium transition-colors",
              activeEnable === option.value
                ? option.value
                  ? "bg-background text-emerald-700 shadow-sm dark:text-emerald-400"
                  : "bg-background text-destructive shadow-sm"
                : "text-muted-foreground hover:text-foreground",
              (pending || option.off) && "cursor-default opacity-50",
            )}
          >
            <option.icon className="size-3.5" />
            {option.label}
          </button>
        ))}
      </div>

      <Button
        variant={activeEnable ? "default" : "destructive"}
        disabled={pending || redundant}
        onClick={() =>
          setConfirmation({ target: pickTarget, enable: activeEnable })
        }
        className="w-full"
      >
        {activeEnable ? (
          <Power className="size-3.5" />
        ) : (
          <PowerOff className="size-3.5" />
        )}
        {activeEnable ? "Turn on" : "Turn off"} {targetLabel}
      </Button>
    </>
  );

  return (
    <>
      {variant === "dialog" ? (
        <Dialog open={open} onOpenChange={handleOpenChange}>
          {!controlled && <BmsTrigger onClick={() => stateQuery.refetch()} />}
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
