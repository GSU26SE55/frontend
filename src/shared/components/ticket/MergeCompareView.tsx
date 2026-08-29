import { useMemo, useState } from "react";
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import TicketStatusBadge from "@/shared/components/ticket/TicketStatusBadge";
import CompareFieldTable from "@/shared/components/ticket/CompareFieldTable";
import { buildCompareRows } from "@/shared/utils/ticket/compareRows";
import CompareEvidencePanel from "@/shared/components/ticket/CompareEvidencePanel";
import { useMergeCandidates } from "@/shared/hooks/ticket/useMergeCandidates";
import { useBatteryAsset } from "@/shared/hooks/battery/useBatteryAsset";
import type {
  TicketDTO,
  TicketDetailDTO,
} from "@/shared/types/ticket/ticket.types";

export interface MergeCompareViewProps {
  /** Ticket that will be merged (closed). */
  source: TicketDetailDTO | undefined;
  isLoadingSource: boolean;
  /** Currently selected target ticket (kept) — undefined when not yet chosen. */
  target: TicketDetailDTO | undefined;
  isLoadingTarget: boolean;
  /** Raw ticket list used to filter candidates. */
  tickets: TicketDTO[] | undefined;
  isLoadingTickets: boolean;
  targetId: string;
  onTargetIdChange: (id: string) => void;
  onBack: () => void;
  onMerge: () => void;
  isMerging: boolean;
}

/**
 * Page comparing 2 tickets before merging. Merging is an operation that CANNOT be undone
 * (the source ticket closes permanently), so the Manager must review all the facts before
 * confirming.
 *
 * Pure UI component — data arrives via props so `shared/` doesn't depend on `features/`
 * (admin and manager have their own hooks, both reusing this view).
 */
export default function MergeCompareView({
  source,
  isLoadingSource,
  target,
  isLoadingTarget,
  tickets,
  isLoadingTickets,
  targetId,
  onTargetIdChange,
  onBack,
  onMerge,
  isMerging,
}: MergeCompareViewProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const candidates = useMergeCandidates(
    tickets,
    source?.id ?? "",
    source?.suspectedDuplicateOfTicketId,
  );

  // The currently selected ticket MUST be present in the list, otherwise Select can't
  // resolve a label from the value and will show the raw GUID in the trigger.
  //
  // Why it can be missing: useMergeCandidates excludes status=New tickets that aren't in
  // AUTO_ORIGINS, but targetId can be preset from suspectedDuplicateOfTicketId (an AI
  // suggestion) — that suggestion may point to exactly the kind of ticket just excluded.
  // The list is also empty while `tickets` is still loading.
  const options = useMemo(() => {
    if (!targetId || candidates.some((t) => t.id === targetId))
      return candidates;
    return target ? [target, ...candidates] : candidates;
  }, [candidates, targetId, target]);

  // A ticket only has customerId (a GUID) — the customer name comes from the battery asset.
  // The hook auto-disables when the id is missing, and 2 tickets on the same battery share cache.
  const { data: sourceAsset } = useBatteryAsset(source?.batteryAssetId);
  const { data: targetAsset } = useBatteryAsset(target?.batteryAssetId);

  if (isLoadingSource || !source) {
    return (
      <div className="space-y-4 py-6 pl-(--page-pl) pr-(--page-pr)">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const rows = target
    ? buildCompareRows(source, target, {
        source: sourceAsset?.customerName,
        target: targetAsset?.customerName,
      })
    : [];
  const diffBattery =
    !!target && (source.batteryAssetId ?? "") !== (target.batteryAssetId ?? "");
  const diffCustomer = !!target && source.customerId !== target.customerId;
  const hasCriticalDiff = diffBattery || diffCustomer;

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Icon-only, matching the back button on the ticket detail page. aria-label keeps the
            control named for screen readers now that the visible text is gone. */}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Back"
          onClick={onBack}
        >
          <ArrowLeftIcon className="size-4" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold">
            Compare before merging tickets
          </h1>
          <p className="text-sm text-muted-foreground">
            Review both tickets carefully — merging cannot be undone.
          </p>
        </div>
      </div>

      {/* ── Select target ticket ───────────────────────────────────────── */}
      <Card>
        <CardContent className="space-y-2 pt-6">
          <Label>Select target ticket (will be kept)</Label>
          <Select
            value={targetId || undefined}
            onValueChange={(v) => onTargetIdChange(v ?? "")}
            items={options.map((t) => ({
              value: t.id,
              label: `${t.id === source.suspectedDuplicateOfTicketId ? "AI suggestion · " : ""}${t.code} — ${t.title}`,
            }))}
          >
            <SelectTrigger className="w-full min-w-0">
              <SelectValue
                className="min-w-0 truncate"
                placeholder={
                  isLoadingTickets
                    ? "Loading tickets…"
                    : "Select a ticket to merge into…"
                }
              />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              {options.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.id === source.suspectedDuplicateOfTicketId
                    ? "AI suggestion · "
                    : ""}
                  {t.code} — {t.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {source.suspectedDuplicateOfTicketId && (
            /* Copy icon = "these look like the same ticket". Deliberately NOT the warning
               triangle below, which means the opposite: they look like DIFFERENT incidents. */
            <p className="flex items-center gap-1.5 text-xs text-amber-600">
              <Copy className="size-3 shrink-0" />
              AI suggestion: the suspected duplicate ticket has been
              pre-selected.
            </p>
          )}
        </CardContent>
      </Card>

      {!targetId ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Select a target ticket above to start comparing.
          </CardContent>
        </Card>
      ) : isLoadingTarget || !target ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <>
          {/* ── Warning for a possibly wrong merge (warning only, doesn't block) ───────── */}
          {hasCriticalDiff && (
            <div className="flex gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
              <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
              <div>
                <p className="font-medium text-destructive">
                  Warning: these 2 tickets appear to NOT be the same incident
                </p>
                <ul className="mt-1 list-inside list-disc text-muted-foreground">
                  {diffBattery && <li>Different battery</li>}
                  {diffCustomer && <li>Different customer</li>}
                </ul>
              </div>
            </div>
          )}

          {/* ── 2-column headers ──────────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Card className="border-muted-foreground/30">
              <CardHeader className="pb-3">
                <p className="text-xs font-medium text-muted-foreground">
                  WILL BE MERGED (closed)
                </p>
                <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                  {source.code}
                  <TicketStatusBadge status={source.status} />
                </CardTitle>
                <p className="text-sm text-muted-foreground">{source.title}</p>
              </CardHeader>
            </Card>
            <Card className="border-primary/40">
              <CardHeader className="pb-3">
                <p className="text-xs font-medium text-primary">WILL BE KEPT</p>
                <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                  {target.code}
                  <TicketStatusBadge status={target.status} />
                </CardTitle>
                <p className="text-sm text-muted-foreground">{target.title}</p>
              </CardHeader>
            </Card>
          </div>

          {/* ── 1. Basic field comparison table ─────────────────────────── */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Field comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <CompareFieldTable rows={rows} />
            </CardContent>
          </Card>

          {/* ── 2. AI assessment ─────────────────────────────────────────── */}
          {(source.duplicateReason ||
            source.aiVerifyReason ||
            target.aiVerifyReason) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">AI assessment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {source.duplicateReason && (
                  <div className="rounded-md bg-amber-50 p-3 text-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
                    <p className="text-xs font-medium">
                      Suspected duplicate reason
                    </p>
                    <p className="mt-0.5">{source.duplicateReason}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      {source.code} — AI check
                    </p>
                    <p className="mt-0.5">
                      {source.aiVerifyReason ?? "No assessment."}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      {target.code} — AI check
                    </p>
                    <p className="mt-0.5">
                      {target.aiVerifyReason ?? "No assessment."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── 3. Full description ─────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Incident description</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {source.code}
                </p>
                <p className="mt-1 whitespace-pre-wrap">
                  {source.description || "No description."}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {target.code}
                </p>
                <p className="mt-1 whitespace-pre-wrap">
                  {target.description || "No description."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* ── 4. Sensor evidence ─────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Sensor evidence</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <CompareEvidencePanel
                assetId={source.batteryAssetId}
                detectedAt={source.detectedAt}
                title={source.code}
              />
              <CompareEvidencePanel
                assetId={target.batteryAssetId}
                detectedAt={target.detectedAt}
                title={target.code}
              />
            </CardContent>
          </Card>

          {/* ── Confirm ────────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-end gap-2 pb-4">
            <Button variant="outline" onClick={onBack}>
              Cancel
            </Button>
            <Button onClick={() => setConfirmOpen(true)} disabled={isMerging}>
              Merge {source.code}
              <ArrowRightIcon className="size-4" />
              {target.code}
            </Button>
          </div>

          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm ticket merge?</AlertDialogTitle>
                <AlertDialogDescription>
                  Ticket <strong>{source.code}</strong> will be{" "}
                  <strong>closed permanently</strong> and merged into{" "}
                  <strong>{target.code}</strong>. This action cannot be undone.
                  {hasCriticalDiff && (
                    <>
                      {" "}
                      Note: these tickets are{" "}
                      {diffBattery && "on different batteries"}
                      {diffBattery && diffCustomer && " and "}
                      {diffCustomer && "for different customers"}.
                    </>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmOpen(false)}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  variant={hasCriticalDiff ? "destructive" : "default"}
                  disabled={isMerging}
                  onClick={() => {
                    setConfirmOpen(false);
                    onMerge();
                  }}
                >
                  {isMerging ? "Merging…" : "Merge ticket"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
