import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  Download,
  FileUp,
  RefreshCw,
  RotateCcw,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/shared/components/layout/PageContainer";
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
import DataPagination from "@/shared/components/ui/DataPagination";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";
import {
  useCommitImportBatch,
  useCreateImportBatch,
  useDownloadImportErrors,
  useDownloadImportTemplate,
  useImportBatch,
  useImportBatches,
  useImportRows,
  useRevertImportBatch,
  useUpdateImportRows,
} from "@/features/admin/hooks/import/useImportBatches";
import {
  ImportBatchStatusBadge,
  ImportRowStatusBadge,
} from "@/features/admin/components/import/ImportStatusBadge";
import { IMPORT_ENTITY_LABEL } from "@/features/admin/components/import/importLabels";
import {
  IMPORT_FIELD_DEFINITIONS,
  errorColumnKey,
} from "@/features/admin/components/import/importFieldDefinitions";
import {
  ImportBatchStatusEnum,
  ImportRowStatusEnum,
  isImportBatchRunning,
} from "@/shared/enums/import/import.enum";
import type { ImportRowDto } from "@/shared/types/import/import.types";
import { handleErrorApi } from "@/shared/lib/errors";
import { DEFAULT_PAGE_SIZE } from "@/shared/constants/pagination";
import { cn } from "@/lib/utils";

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// Matches the BE's own multipart size limit for this endpoint — rejecting oversized files
// client-side avoids a full upload roundtrip just to learn the server would refuse it.
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function validateFile(file: File): string | null {
  const isXlsx =
    file.name.toLowerCase().endsWith(".xlsx") || file.type === XLSX_MIME;
  if (!isXlsx) return "Not an .xlsx file.";
  if (file.size === 0) return "File is empty.";
  if (file.size > MAX_FILE_SIZE_BYTES) return "File is larger than 10 MB.";
  return null;
}

export default function DataImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [revertTarget, setRevertTarget] = useState<string | null>(null);
  const [confirmCommit, setConfirmCommit] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [batchesPage, setBatchesPage] = useState(1);
  const [batchesPageSize, setBatchesPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [badRowsPage, setBadRowsPage] = useState(1);
  const [rowEdits, setRowEdits] = useState<Record<string, Record<string, string>>>(
    {},
  );
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { data: batches, isLoading: batchesLoading } = useImportBatches({
    pageNumber: batchesPage,
    pageSize: batchesPageSize,
  });
  const { data: activeBatch } = useImportBatch(
    activeBatchId ?? "",
    !!activeBatchId,
  );
  const { data: badRows } = useImportRows(
    activeBatchId ?? "",
    {
      pageNumber: badRowsPage,
      pageSize: DEFAULT_PAGE_SIZE,
      status: ImportRowStatusEnum.Invalid,
    },
    !!activeBatchId && (activeBatch?.invalidRows ?? 0) > 0,
  );

  const createBatch = useCreateImportBatch(setUploadPercent);
  const commitBatch = useCommitImportBatch();
  const revertBatch = useRevertImportBatch();
  const downloadTemplate = useDownloadImportTemplate();
  const downloadErrors = useDownloadImportErrors();
  const updateRows = useUpdateImportRows(activeBatchId ?? "");

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

  function pickFile(picked: File | null) {
    setFile(picked);
    setFileError(picked ? (validateFile(picked) ?? null) : null);
  }

  function resetFile() {
    setFile(null);
    setFileError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleDryRun() {
    setUploadPercent(0);
    createBatch.mutate(
      { file },
      {
        onSuccess: (response) => {
          setUploadPercent(null);
          const batch = response.data;
          if (!batch) return;
          setActiveBatchId(batch.id);
          setBadRowsPage(1);
          setRowEdits({});
          resetFile();
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
        onError: (error) => {
          setUploadPercent(null);
          handleErrorApi({ error });
        },
      },
    );
  }

  function handleCommit() {
    if (!activeBatchId) return;
    commitBatch.mutate(activeBatchId, {
      onSuccess: () => {
        toast.success("Accepted. Track the progress below.");
        setConfirmCommit(false);
      },
      onError: (error) => {
        handleErrorApi({ error });
        setConfirmCommit(false);
      },
    });
  }

  function setFieldEdit(rowId: string, fieldKey: string, value: string) {
    setRowEdits((current) => ({
      ...current,
      [rowId]: { ...current[rowId], [fieldKey]: value },
    }));
  }

  function handleResubmitCorrections() {
    if (!activeBatchId || !badRows) return;

    const rowsById = new Map(badRows.items.map((row) => [row.id, row]));
    const editedRows = Object.entries(rowEdits)
      .filter(([rowId]) => rowsById.has(rowId))
      .map(([rowId, edits]) => ({
        rowId,
        // Gửi ĐỦ mọi cột của dòng, không chỉ cột vừa sửa — BE thay nguyên RawJson bằng những gì
        // gửi lên, thiếu cột nào là mất giá trị cũ của cột đó.
        fields: { ...rowsById.get(rowId)!.fields, ...edits },
      }));

    if (editedRows.length === 0) return;

    updateRows.mutate(
      { rows: editedRows },
      {
        onSuccess: (response) => {
          setRowEdits({});
          setBadRowsPage(1);
          const batch = response.data;
          if (!batch) return;
          toast.success(
            batch.invalidRows === 0
              ? `All ${batch.validRows} rows are now valid.`
              : `${batch.validRows}/${batch.totalRows} rows valid now — ${batch.invalidRows} still need fixing.`,
          );
        },
        onError: (error) => handleErrorApi({ error }),
      },
    );
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
    <PageContainer data-testid="data-import-page">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Third-party data import</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Download a template, fill it in, dry-run it to preview the result,
            then commit. The dry-run writes no business records at all.
          </p>
        </div>
        <RefreshButton queryKeys={[KEY.importBatches]} />
      </div>

      {/* Step 1 — template */}
      <Card className="p-5">
        <h2 className="mb-3 font-medium">Step 1 — Download the template</h2>
        <Button
          variant="outline"
          size="sm"
          data-testid="template-download"
          disabled={downloadTemplate.isPending}
          onClick={() =>
            downloadTemplate.mutate(undefined, {
              onError: (error) => handleErrorApi({ error }),
            })
          }
        >
          <Download className="mr-2 size-4" />
          import-template.xlsx
        </Button>
        <p className="text-muted-foreground mt-2 text-xs">
          One workbook, three sheets — Customers, Sites, Battery assets, in
          that order.
        </p>
      </Card>

      {/* Step 2 — pick the file + dry run */}
      <Card className="p-5">
        <h2 className="mb-3 font-medium">Step 2 — Pick the file and dry-run</h2>
        <div className="max-w-sm space-y-1.5">
          <Label htmlFor="import-file">Workbook (.xlsx)</Label>
          <Input
            id="import-file"
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className={cn("h-9", fileError && "border-destructive")}
            data-testid="file-input"
            ref={inputRef}
            onChange={(event) =>
              pickFile(event.target.files?.[0] ?? null)
            }
          />
          {fileError && (
            <p className="text-destructive text-xs">{fileError}</p>
          )}
        </div>
        <div className="mt-4 flex items-center justify-end gap-3">
          {!file && (
            <span className="text-muted-foreground text-sm">
              Pick a file first.
            </span>
          )}
          {file && fileError && (
            <span className="text-destructive text-sm">
              Fix the file error above before running.
            </span>
          )}
          <Button
            data-testid="dry-run-button"
            disabled={!file || !!fileError || createBatch.isPending}
            onClick={handleDryRun}
          >
            <FileUp className="mr-2 size-4" />
            {createBatch.isPending ? "Validating…" : "Dry run"}
          </Button>
        </div>
        {createBatch.isPending && uploadPercent !== null && (
          <div className="mt-3">
            <div className="text-muted-foreground mb-1 flex justify-between text-xs">
              <span>Uploading…</span>
              <span>{uploadPercent}%</span>
            </div>
            <div className="bg-muted h-2 w-full overflow-hidden rounded">
              <div
                className="bg-primary h-full transition-[width] duration-150 ease-linear"
                style={{ width: `${uploadPercent}%` }}
                data-testid="upload-progress-bar"
              />
            </div>
          </div>
        )}
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
                  className="bg-primary h-full transition-[width] duration-300 ease-linear"
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
              onClick={() => setConfirmCommit(true)}
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
            <div className="mt-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-medium">
                    Invalid rows — fix and resubmit
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    Edit the fields below, then resubmit — the same validation
                    that checks a .xlsx file runs again on the whole batch.
                  </p>
                </div>
                <Button
                  size="sm"
                  data-testid="resubmit-corrections-button"
                  disabled={
                    Object.keys(rowEdits).length === 0 || updateRows.isPending
                  }
                  onClick={handleResubmitCorrections}
                >
                  <RefreshCw className="mr-2 size-4" />
                  {updateRows.isPending
                    ? "Re-validating…"
                    : `Resubmit ${Object.keys(rowEdits).length} correction(s)`}
                </Button>
              </div>
              <div className="space-y-3">
                {badRows.items.map((row) => (
                  <InvalidRowEditor
                    key={row.id}
                    row={row}
                    values={{ ...row.fields, ...rowEdits[row.id] }}
                    onFieldChange={(fieldKey, value) =>
                      setFieldEdit(row.id, fieldKey, value)
                    }
                  />
                ))}
              </div>
              <DataPagination
                totalItems={badRows.totalItems}
                pageNumber={badRows.pageNumber}
                pageSize={badRows.pageSize}
                totalPages={badRows.totalPages}
                hasNextPage={badRows.hasNextPage}
                hasPreviousPage={badRows.hasPreviousPage}
                onPageChange={setBadRowsPage}
              />
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
          <div className="space-y-3">
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
                  <TableRow
                    key={batch.id}
                    data-testid="batch-row"
                    className={cn(batch.id === activeBatchId && "bg-muted/40")}
                  >
                    <TableCell className="max-w-70 truncate">
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
                        onClick={() => {
                          setActiveBatchId(batch.id);
                          setBadRowsPage(1);
                          setRowEdits({});
                        }}
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
                      No import batches yet — download a template above to get
                      started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {batches && (
              <DataPagination
                totalItems={batches.totalItems}
                pageNumber={batches.pageNumber}
                pageSize={batches.pageSize}
                totalPages={batches.totalPages}
                hasNextPage={batches.hasNextPage}
                hasPreviousPage={batches.hasPreviousPage}
                onPageChange={setBatchesPage}
                onPageSizeChange={(size) => {
                  setBatchesPageSize(size);
                  setBatchesPage(1);
                }}
              />
            )}
          </div>
        )}
      </Card>

      {/* Commit writes the staged rows into live data and is the harder of the two actions to
          undo — Revert cannot bring back customer accounts. It gets the same confirmation the
          Revert button has always had, and names the row count so the number is checked before
          anything is written. */}
      <AlertDialog open={confirmCommit} onOpenChange={setConfirmCommit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Commit this batch?</AlertDialogTitle>
            <AlertDialogDescription>
              {activeBatch ? (
                <>
                  <span className="text-foreground font-semibold">
                    {activeBatch.validRows} of {activeBatch.totalRows} rows
                  </span>{" "}
                  will be written into live data. Reverting afterwards removes
                  the sites, battery assets and devices created — but keeps the
                  customer accounts.
                </>
              ) : (
                "The valid rows will be written into live data."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              data-testid="confirm-commit"
              onClick={handleCommit}
            >
              Commit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!revertTarget}
        onOpenChange={(open) => !open && setRevertTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revert this batch?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="text-foreground font-semibold">
                Sites, battery assets and devices
              </span>{" "}
              created by the batch are removed. Customer accounts are kept on
              purpose — they may already have been used to sign in or attached
              to a maintenance ticket.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              data-testid="confirm-revert"
              onClick={handleRevert}
            >
              Revert
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
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

/**
 * One invalid row, editable in place — the fields shown match exactly the columns of that row's
 * sheet in the .xlsx template, pre-filled with its current values (already-corrected values if
 * the caller passed those in via `values`).
 */
function InvalidRowEditor({
  row,
  values,
  onFieldChange,
}: {
  row: ImportRowDto;
  values: Record<string, string>;
  onFieldChange: (fieldKey: string, value: string) => void;
}) {
  const fields = IMPORT_FIELD_DEFINITIONS[row.entityType];

  const errorByColumn = new Map<string, string>();
  const unmatchedErrors: typeof row.errors = [];
  for (const error of row.errors) {
    const columnKey = errorColumnKey(row.entityType, error.field);
    if (columnKey) errorByColumn.set(columnKey, error.detail);
    else unmatchedErrors.push(error);
  }

  return (
    <div
      className="rounded-md border p-3"
      data-testid={`invalid-row-${row.id}`}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">
            {IMPORT_ENTITY_LABEL[row.entityType]}
          </span>
          <span className="text-muted-foreground">Row {row.rowNumber}</span>
        </div>
        <ImportRowStatusBadge status={row.status} />
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map((field) => {
          const errorDetail = errorByColumn.get(field.key);
          return (
            <div key={field.key} className="space-y-1">
              <Label className="text-xs" htmlFor={`${row.id}-${field.key}`}>
                {field.label}
                {field.required && (
                  <span className="text-destructive ml-0.5">*</span>
                )}
              </Label>
              <Input
                id={`${row.id}-${field.key}`}
                data-testid={`field-${row.id}-${field.key}`}
                className={cn("h-8 text-sm", errorDetail && "border-destructive")}
                value={values[field.key] ?? ""}
                onChange={(event) => onFieldChange(field.key, event.target.value)}
              />
              {errorDetail && (
                <p className="text-destructive text-xs">{errorDetail}</p>
              )}
            </div>
          );
        })}
      </div>
      {unmatchedErrors.length > 0 && (
        <p className="text-destructive mt-2 text-xs">
          {unmatchedErrors
            .map((error) => `${error.field}: ${error.detail}`)
            .join(" · ")}
        </p>
      )}
    </div>
  );
}
