import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Download, FileUp, RotateCcw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCommitImportBatch,
  useCreateImportBatch,
  useDownloadImportErrors,
  useDownloadImportTemplate,
  useImportBatch,
  useImportBatches,
  useImportRows,
  useRevertImportBatch,
} from "@/features/admin/hooks/import/useImportBatches";
import {
  ImportBatchStatusBadge,
  ImportRowStatusBadge,
} from "@/features/admin/components/import/ImportStatusBadge";
import { IMPORT_ENTITY_LABEL } from "@/features/admin/components/import/importLabels";
import {
  ImportBatchStatusEnum,
  ImportEntityTypeEnum,
  ImportRowStatusEnum,
  isImportBatchRunning,
} from "@/shared/enums/import/import.enum";
import type { CreateImportBatchPayload } from "@/shared/types/import/import.types";
import { handleErrorApi } from "@/shared/lib/errors";

const TEMPLATES = [
  { type: ImportEntityTypeEnum.Customer, label: "Customer" },
  { type: ImportEntityTypeEnum.Site, label: "Site" },
  { type: ImportEntityTypeEnum.BatteryAsset, label: "Battery asset" },
] as const;

type FileSlot = keyof CreateImportBatchPayload;

const FILE_SLOTS: { slot: FileSlot; label: string; hint: string }[] = [
  { slot: "customersFile", label: "customers.csv", hint: "Customers" },
  {
    slot: "sitesFile",
    label: "sites.csv",
    hint: "Sites — needs a customer code",
  },
  {
    slot: "assetsFile",
    label: "assets.csv",
    hint: "Battery assets — needs a site code",
  },
];

export default function DataImportPage() {
  const [files, setFiles] = useState<CreateImportBatchPayload>({});
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [revertTarget, setRevertTarget] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const { data: batches, isLoading: batchesLoading } = useImportBatches({
    pageNumber: 1,
    pageSize: 10,
  });
  const { data: activeBatch } = useImportBatch(
    activeBatchId ?? "",
    !!activeBatchId,
  );
  const { data: badRows } = useImportRows(
    activeBatchId ?? "",
    { pageNumber: 1, pageSize: 50, status: ImportRowStatusEnum.Invalid },
    !!activeBatchId && (activeBatch?.invalidRows ?? 0) > 0,
  );

  const createBatch = useCreateImportBatch();
  const commitBatch = useCommitImportBatch();
  const revertBatch = useRevertImportBatch();
  const downloadTemplate = useDownloadImportTemplate();
  const downloadErrors = useDownloadImportErrors();

  const hasAnyFile = useMemo(
    () => FILE_SLOTS.some(({ slot }) => !!files[slot]),
    [files],
  );

  const progressPercent =
    activeBatch && activeBatch.validRows > 0
      ? Math.min(
          100,
          Math.round((activeBatch.processedRows / activeBatch.validRows) * 100),
        )
      : 0;

  const canCommit =
    activeBatch?.status === ImportBatchStatusEnum.ReadyToCommit &&
    activeBatch.validRows > 0;

  // Widen the array type: written inline, TypeScript narrows it to exactly the three values
  // listed, and includes() then rejects any other status instead of returning false.
  const REVERTABLE: ImportBatchStatusEnum[] = [
    ImportBatchStatusEnum.Completed,
    ImportBatchStatusEnum.CompletedWithErrors,
    ImportBatchStatusEnum.Failed,
  ];
  const canRevert = !!activeBatch && REVERTABLE.includes(activeBatch.status);

  function pickFile(slot: FileSlot, file: File | null) {
    setFiles((current) => ({ ...current, [slot]: file }));
  }

  function resetFiles() {
    setFiles({});
    Object.values(inputRefs.current).forEach((input) => {
      if (input) input.value = "";
    });
  }

  function handleDryRun() {
    createBatch.mutate(files, {
      onSuccess: (response) => {
        const batch = response.data;
        if (!batch) return;
        setActiveBatchId(batch.id);
        resetFiles();
        if (batch.invalidRows > 0) {
          toast.warning(
            `${batch.validRows}/${batch.totalRows} rows valid. Download the failed rows, fix them and upload again.`,
          );
        } else {
          toast.success(
            `${batch.totalRows} rows valid. Nothing written yet — press "Commit" to continue.`,
          );
        }
      },
      onError: (error) => handleErrorApi({ error }),
    });
  }

  function handleCommit() {
    if (!activeBatchId) return;
    commitBatch.mutate(activeBatchId, {
      onSuccess: () => toast.success("Accepted. Track the progress below."),
      onError: (error) => handleErrorApi({ error }),
    });
  }

  function handleRevert() {
    if (!revertTarget) return;
    revertBatch.mutate(revertTarget, {
      onSuccess: (response) => {
        toast.success(response.message ?? "Reverted.");
        setRevertTarget(null);
      },
      onError: (error) => {
        handleErrorApi({ error });
        setRevertTarget(null);
      },
    });
  }

  return (
    <div className="space-y-6 p-6" data-testid="data-import-page">
      <div>
        <h1 className="text-2xl font-semibold">Third-party data import</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Download a template, fill it in, dry-run it to preview the result,
          then commit. The dry-run writes no business records at all.
        </p>
      </div>

      {/* Step 1 — templates */}
      <Card className="p-5">
        <h2 className="mb-3 font-medium">Step 1 — Download a template</h2>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map(({ type, label }) => (
            <Button
              key={type}
              variant="outline"
              size="sm"
              data-testid={`template-${type}`}
              disabled={downloadTemplate.isPending}
              onClick={() =>
                downloadTemplate.mutate(type, {
                  onError: (error) => handleErrorApi({ error }),
                })
              }
            >
              <Download className="mr-2 size-4" />
              {label}
            </Button>
          ))}
        </div>
      </Card>

      {/* Step 2 — pick files + dry run */}
      <Card className="p-5">
        <h2 className="mb-3 font-medium">Step 2 — Pick files and dry-run</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {FILE_SLOTS.map(({ slot, label, hint }) => (
            <div key={slot} className="space-y-1.5">
              <Label htmlFor={slot}>
                {label}
                <span className="text-muted-foreground ml-2 text-xs font-normal">
                  {hint}
                </span>
              </Label>
              <Input
                id={slot}
                type="file"
                accept=".csv,text/csv"
                data-testid={`file-${slot}`}
                ref={(element) => {
                  inputRefs.current[slot] = element;
                }}
                onChange={(event) =>
                  pickFile(slot, event.target.files?.[0] ?? null)
                }
              />
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button
            data-testid="dry-run-button"
            disabled={!hasAnyFile || createBatch.isPending}
            onClick={handleDryRun}
          >
            <FileUp className="mr-2 size-4" />
            {createBatch.isPending ? "Validating…" : "Dry run"}
          </Button>
          {!hasAnyFile && (
            <span className="text-muted-foreground text-sm">
              Pick at least one file.
            </span>
          )}
        </div>
      </Card>

      {/* Step 3 — result + commit */}
      {activeBatch && (
        <Card className="p-5" data-testid="active-batch">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-medium">
              Step 3 — Result for the selected batch
            </h2>
            <ImportBatchStatusBadge status={activeBatch.status} />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat
              label="Total rows"
              value={activeBatch.totalRows}
              testId="stat-total"
            />
            <Stat
              label="Valid"
              value={activeBatch.validRows}
              testId="stat-valid"
            />
            <Stat
              label="Invalid"
              value={activeBatch.invalidRows}
              testId="stat-invalid"
            />
            <Stat
              label="Created"
              value={activeBatch.createdRows}
              testId="stat-created"
            />
          </div>

          {isImportBatchRunning(activeBatch.status) && (
            <div className="mt-4">
              <div className="text-muted-foreground mb-1 flex justify-between text-xs">
                <span>
                  {activeBatch.status ===
                  ImportBatchStatusEnum.AwaitingAccountSync
                    ? "Waiting for AuthService to issue customer accounts…"
                    : "Writing data…"}
                </span>
                <span>
                  {activeBatch.processedRows}/{activeBatch.validRows}
                </span>
              </div>
              <div className="bg-muted h-2 w-full overflow-hidden rounded">
                <div
                  className="bg-primary h-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                  data-testid="progress-bar"
                />
              </div>
            </div>
          )}

          {activeBatch.errorSummary && (
            <p
              className="text-destructive mt-3 text-sm"
              data-testid="batch-error-summary"
            >
              {activeBatch.errorSummary}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              data-testid="commit-button"
              disabled={!canCommit || commitBatch.isPending}
              onClick={handleCommit}
            >
              <Upload className="mr-2 size-4" />
              Commit
            </Button>
            {activeBatch.invalidRows > 0 && (
              <Button
                variant="outline"
                data-testid="download-errors-button"
                onClick={() =>
                  downloadErrors.mutate(activeBatch.id, {
                    onError: (error) => handleErrorApi({ error }),
                  })
                }
              >
                <Download className="mr-2 size-4" />
                Download failed rows
              </Button>
            )}
            {canRevert && (
              <Button
                variant="destructive"
                data-testid="revert-button"
                onClick={() => setRevertTarget(activeBatch.id)}
              >
                <RotateCcw className="mr-2 size-4" />
                Revert
              </Button>
            )}
          </div>

          {!!badRows?.items.length && (
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-medium">Invalid rows</h3>
              <Table data-testid="invalid-rows-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Row</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {badRows.items.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        {IMPORT_ENTITY_LABEL[row.entityType]}
                      </TableCell>
                      <TableCell>{row.rowNumber}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {row.externalRef}
                      </TableCell>
                      <TableCell>
                        <ImportRowStatusBadge status={row.status} />
                      </TableCell>
                      <TableCell className="text-destructive text-sm">
                        {row.errors
                          .map((error) => `${error.field}: ${error.detail}`)
                          .join(" · ")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      )}

      {/* History */}
      <Card className="p-5">
        <h2 className="mb-3 font-medium">Recent batches</h2>
        {batchesLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <Table data-testid="batches-table">
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Row</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches?.items.map((batch) => (
                <TableRow key={batch.id} data-testid="batch-row">
                  <TableCell className="max-w-[280px] truncate">
                    {batch.fileName ?? "(no name)"}
                  </TableCell>
                  <TableCell>
                    <ImportBatchStatusBadge status={batch.status} />
                  </TableCell>
                  <TableCell>
                    {batch.validRows}/{batch.totalRows}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveBatchId(batch.id)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!batches?.items.length && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-muted-foreground text-center"
                  >
                    No batches yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <AlertDialog
        open={!!revertTarget}
        onOpenChange={(open) => !open && setRevertTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revert this batch?</AlertDialogTitle>
            <AlertDialogDescription>
              Sites, battery assets and devices created by the batch are
              removed. Customer accounts are kept on purpose — they may already
              have been used to sign in or attached to a maintenance ticket.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              data-testid="confirm-revert"
              onClick={handleRevert}
            >
              Revert
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Stat({
  label,
  value,
  testId,
}: {
  label: string;
  value: number;
  testId: string;
}) {
  return (
    <div className="bg-muted/40 rounded-md p-3">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="text-xl font-semibold" data-testid={testId}>
        {value}
      </div>
    </div>
  );
}
