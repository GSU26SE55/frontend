import { useMemo, useState } from "react";
import { AlertTriangle, Loader2, Power, PowerOff, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { bmsSwitchService } from "@/shared/services/battery/bms-switch.service";
import { HttpError } from "@/shared/lib/errors";
import { BatteryStatusEnum } from "@/shared/enums/battery/battery.enum";
import {
  BmsSwitchTarget,
  type SetBmsSwitchPayload,
} from "@/shared/types/battery/bms-switch.types";
import type { BatteryAssetDto } from "@/shared/types/battery/battery.types";

/**
 * Switch the charge and discharge MOSFETs on batteries at a site — the operator picks which
 * batteries, which MOSFET, and which direction.
 *
 * It mirrors the per-battery control rather than being a one-way kill switch. Cutting is the
 * urgent case, but whatever gets cut has to be restored, and a shutdown-only dialog leaves the
 * operator switching a dozen batteries back on one screen at a time — so "off" would be fast and
 * "on" slow, which is backwards from how an incident actually ends. Charge and discharge are
 * separable for the same reason they are on a single battery: stopping a battery from charging
 * while it still feeds the load is a different decision from de-energising it.
 *
 * An environmental incident is not automatically a whole-site shutdown: smoke over one rack, a
 * leak at one end of the cabinet. Forcing all-or-nothing would make the operator either cut
 * more than the fault warrants (needless outage for the load) or skip the control entirely and
 * switch batteries one at a time from their own screens. So the list is a selection, defaulting
 * to every active battery — the common case stays one click, the narrower case stays possible.
 *
 * There is no site-level endpoint: the API only exposes POST /battery-assets/{id}/bms-switch, so
 * this fans out one request per battery. That makes the operation NON-ATOMIC, and this is a
 * mains-safety control — half-applied is worse than not applied, because the operator walks away
 * believing the site is dead. The failure mode is therefore explicit rather than hidden:
 *
 *   - the confirm button names the exact number of batteries selected;
 *   - requests are issued in small batches, so one unreachable device cannot stall the rest;
 *   - the result is reported PER BATTERY, and any failure keeps the dialog open with a Retry
 *     scoped to just the batteries that did not answer.
 *
 * "Sent" means the API queued the MQTT command, NOT that the BMS applied it — the same
 * distinction the per-battery control draws while it waits for the ACK. The copy says so; the
 * per-battery dialog remains the place to confirm a device actually switched.
 *
 * Non-active batteries are listed but not selectable: a decommissioned unit has no live BMS to
 * answer, and counting its inevitable failure as an error would train operators to ignore the
 * report.
 */

const BATCH_SIZE = 5;

type AssetResult = {
  asset: BatteryAssetDto;
  status: "ok" | "failed";
  error?: string;
};

function failureMessage(error: unknown) {
  if (error instanceof HttpError) return error.message;
  return "The command could not be sent to the device.";
}

export default function SiteBmsSwitchDialog({
  assets,
  truncated = false,
  isLoading = false,
  open,
  onOpenChange,
}: {
  /**
   * Batteries on the site. The caller must pass the FULL list, not one page — a partial list
   * would silently leave batteries out of a shutdown the operator believes covered the site.
   */
  assets: BatteryAssetDto[];
  /**
   * The site holds more batteries than the caller could enumerate. The switch is refused
   * outright: acting on a truncated list is the exact failure this control must not have.
   */
  truncated?: boolean;
  isLoading?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [results, setResults] = useState<AssetResult[] | null>(null);
  const [pending, setPending] = useState(false);
  /**
   * null = untouched, so every active battery counts as selected. An environmental incident
   * usually does mean the whole site goes off, so the common case stays a single click while
   * the operator can still narrow it.
   *
   * Deriving the default instead of seeding state in an effect matters here: the battery list
   * arrives asynchronously and refetches, and seeding on every new array identity would wipe a
   * selection the operator had already made — on a shutdown control, silently re-checking
   * batteries they had just unchecked.
   */
  const [selected, setSelected] = useState<Set<string> | null>(null);
  /** Which MOSFET to act on, and which way. Defaults to the urgent case: cut everything. */
  const [target, setTarget] = useState<BmsSwitchTarget>(BmsSwitchTarget.All);
  const [enable, setEnable] = useState(false);

  const switchable = useMemo(
    () => assets.filter((a) => a.status === BatteryStatusEnum.Active),
    [assets],
  );

  const isSelected = (id: string) => selected === null || selected.has(id);
  const targets = switchable.filter((a) => isSelected(a.id));
  const failed = results?.filter((r) => r.status === "failed") ?? [];
  const allSelected =
    switchable.length > 0 && targets.length === switchable.length;

  const toggle = (id: string) =>
    setSelected((prev) => {
      // First interaction materialises the implicit "all" before removing one.
      const next = new Set(prev ?? switchable.map((a) => a.id));
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const run = async (batch: BatteryAssetDto[]) => {
    const payload: SetBmsSwitchPayload = { target, enable };

    setPending(true);
    const collected: AssetResult[] = [];

    // Chunked rather than one big Promise.all: a site can hold dozens of batteries, and firing
    // every MQTT publish at once buries slow devices behind a burst of timeouts.
    for (let i = 0; i < batch.length; i += BATCH_SIZE) {
      const chunk = batch.slice(i, i + BATCH_SIZE);
      const settled = await Promise.allSettled(
        chunk.map((asset) => bmsSwitchService.setSwitch(asset.id, payload)),
      );
      settled.forEach((outcome, index) =>
        collected.push(
          outcome.status === "fulfilled"
            ? { asset: chunk[index], status: "ok" }
            : {
                asset: chunk[index],
                status: "failed",
                error: failureMessage(outcome.reason),
              },
        ),
      );
    }

    setPending(false);
    setResults(collected);

    const failures = collected.filter((r) => r.status === "failed");
    if (failures.length === 0) {
      toast.success(
        `Sent to ${collected.length} batter${collected.length === 1 ? "y" : "ies"}. Each BMS confirms separately.`,
      );
      setResults(null);
      setSelected(null);
      setTarget(BmsSwitchTarget.All);
      setEnable(false);
      onOpenChange(false);
    } else {
      toast.error(
        `${failures.length} of ${collected.length} batteries did not accept the command.`,
      );
    }
  };

  const close = (next: boolean) => {
    if (pending) return;
    if (!next) {
      setResults(null);
      setSelected(null);
      setTarget(BmsSwitchTarget.All);
      setEnable(false);
    }
    onOpenChange(next);
  };

  const blocked = isLoading || truncated || switchable.length === 0;
  const targetLabel =
    target === BmsSwitchTarget.Charge
      ? "charge"
      : target === BmsSwitchTarget.Discharge
        ? "discharge"
        : "both";

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle
              className={
                enable
                  ? "size-4 text-muted-foreground"
                  : "size-4 text-destructive"
              }
            />
            BMS control · site batteries
          </DialogTitle>
          <DialogDescription>
            {isLoading ? (
              "Loading the site's batteries…"
            ) : truncated ? (
              "This site has too many batteries to switch from here. Use the per-battery control, or ask for a site-level shutdown endpoint."
            ) : switchable.length === 0 ? (
              "No active battery on this site can be switched."
            ) : (
              <>
                {enable
                  ? "Turning a MOSFET back on lets the battery charge or supply the load again."
                  : "Turning a MOSFET off stops that path immediately — cutting discharge drops the load."}{" "}
                Commands are sent one per battery and are not applied as a
                single unit — each BMS confirms on its own, so check the site
                afterwards.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading && <Skeleton className="h-32 w-full" />}

        {/* Re-energising is the direction that can restart a fault. The per-battery control
            carries the same warning off that battery's cascade-risk score; there is no site-wide
            equivalent to key it on, so it is shown whenever the operator switches something back
            on rather than pretending the risk was assessed. */}
        {!blocked && !results && enable && (
          <p className="flex gap-2 rounded-md border border-amber-300 bg-amber-100/70 p-2 text-xs text-amber-950 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
            <AlertTriangle className="mt-px size-3.5 shrink-0" />
            Inspect the site before switching batteries back on — if the fault
            that prompted the shutdown is still present, re-energising can
            restart it.
          </p>
        )}

        {!blocked && !results && (
          <>
            {/* MOSFET and direction first: they decide what the button at the bottom will do,
                so choosing them after picking batteries would read backwards. */}
            <div className="space-y-2">
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
                    aria-pressed={target === option.value}
                    onClick={() => setTarget(option.value)}
                    className={cn(
                      "rounded px-2 py-1 text-xs font-medium transition-colors",
                      target === option.value
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
                    aria-pressed={enable === option.value}
                    onClick={() => setEnable(option.value)}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded px-2 py-1 text-xs font-medium transition-colors",
                      enable === option.value
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
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {targets.length} of {switchable.length} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() =>
                  setSelected(
                    allSelected
                      ? new Set()
                      : new Set(switchable.map((a) => a.id)),
                  )
                }
              >
                {allSelected ? "Clear all" : "Select all"}
              </Button>
            </div>

            <div className="max-h-56 space-y-0.5 overflow-y-auto rounded-md border border-border/70 p-1">
              {assets.map((asset) => {
                const active = asset.status === BatteryStatusEnum.Active;
                return (
                  <label
                    key={asset.id}
                    className={
                      active
                        ? "flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-muted/60"
                        : "flex items-center gap-2 rounded px-2 py-1.5 opacity-50"
                    }
                  >
                    <Checkbox
                      checked={isSelected(asset.id)}
                      onCheckedChange={() => toggle(asset.id)}
                      disabled={!active || pending}
                    />
                    <span className="min-w-0 flex-1 font-mono text-xs">
                      {asset.serialNumber}
                    </span>
                    <span className="text-2xs text-muted-foreground">
                      {active ? asset.batteryTypeName : "Inactive"}
                    </span>
                  </label>
                );
              })}
            </div>
          </>
        )}

        {results && (
          <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-border/70 p-2">
            {results.map((r) => (
              <div
                key={r.asset.id}
                className="flex items-start gap-2 text-xs leading-tight"
              >
                {r.status === "ok" ? (
                  <PowerOff className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <X className="mt-0.5 size-3.5 shrink-0 text-destructive" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="font-mono">{r.asset.serialNumber}</span>
                  <span className="text-muted-foreground">
                    {r.status === "ok" ? " — command sent" : ` — ${r.error}`}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => close(false)}
            disabled={pending}
          >
            {failed.length > 0 ? "Close" : "Cancel"}
          </Button>
          <Button
            variant={enable ? "default" : "destructive"}
            disabled={
              pending ||
              blocked ||
              (failed.length === 0 && targets.length === 0)
            }
            onClick={() =>
              run(failed.length > 0 ? failed.map((f) => f.asset) : targets)
            }
          >
            {pending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : enable ? (
              <Power className="size-3.5" />
            ) : (
              <PowerOff className="size-3.5" />
            )}
            {pending
              ? "Sending…"
              : failed.length > 0
                ? `Retry ${failed.length} failed`
                : `${enable ? "Turn on" : "Turn off"} ${targetLabel} · ${targets.length} batter${targets.length === 1 ? "y" : "ies"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
