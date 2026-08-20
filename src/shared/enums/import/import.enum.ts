// Third-party data import enums — BatteryService.
// Shared because the import status labels are meant to surface on other role screens later.
// `as const` pattern (int values from the BE).

export const ImportEntityTypeEnum = {
  Customer: 1,
  Site: 2,
  BatteryAsset: 3,
  // IoT devices are deliberately absent. The system issues each gateway together with its API key
  // and MQTT credentials, so a third party cannot bring one into existence — they are created on
  // the IoT device screen only.
} as const;
export type ImportEntityTypeEnum =
  (typeof ImportEntityTypeEnum)[keyof typeof ImportEntityTypeEnum];

// The BE keeps Committing and AwaitingAccountSync apart on purpose: one means "writing rows now",
// the other means "waiting for AuthService to hand back customer accounts". Collapsing them in the
// UI would leave the operator unable to tell a busy batch from a stalled message bus.
export const ImportBatchStatusEnum = {
  Pending: 1,
  Parsing: 2,
  Validating: 3,
  ValidationFailed: 4,
  ReadyToCommit: 5,
  Committing: 6,
  AwaitingAccountSync: 7,
  Completed: 8,
  CompletedWithErrors: 9,
  Reverting: 10,
  Reverted: 11,
  Failed: 12,
} as const;
export type ImportBatchStatusEnum =
  (typeof ImportBatchStatusEnum)[keyof typeof ImportBatchStatusEnum];

export const ImportRowStatusEnum = {
  Pending: 1,
  Valid: 2,
  Invalid: 3,
  AwaitingAccount: 4,
  Created: 5,
  Updated: 6,
  Skipped: 7,
  Failed: 8,
  Reverted: 9,
} as const;
export type ImportRowStatusEnum =
  (typeof ImportRowStatusEnum)[keyof typeof ImportRowStatusEnum];


/**
 * States in which the backend is actively moving the batch forward on its own.
 *
 * This list mirrors exactly what `ImportBatchProcessorBackgroundService` picks up each tick. It has
 * to be an explicit list, not "everything that is not finished": `ReadyToCommit` is neither running
 * nor finished — it is a batch waiting for the operator to press the write button, and it can sit
 * there forever (a batch whose rows are all invalid can never be committed at all). Treating it as
 * running showed "writing data…" over a batch that had written nothing, and kept the page polling
 * every two seconds for a result that was never coming.
 */
export const RUNNING_IMPORT_STATUSES: readonly ImportBatchStatusEnum[] = [
  ImportBatchStatusEnum.Committing,
  ImportBatchStatusEnum.AwaitingAccountSync,
];

export const isImportBatchRunning = (status: ImportBatchStatusEnum): boolean =>
  RUNNING_IMPORT_STATUSES.includes(status);
