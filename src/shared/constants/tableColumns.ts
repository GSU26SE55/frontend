// Shared table column names (repeated across ≥2 tables). Columns specific to a
// single table stay where they are.
// Usage: <TableHead>{TABLE_COLUMNS.index}</TableHead>

export const TABLE_COLUMNS = {
  index: "#",
  actions: "Actions",
  status: "Status",
  unit: "Unit",
  ticket: "Ticket",
  time: "Time",
  sla: "SLA",
  detectedAt: "Detected at",
  source: "Source",
  severity: "Severity",
  customer: "Customer",
  expiresAt: "Expires",
  channel: "Channel",
  calibrated: "Calibrated",
} as const;
