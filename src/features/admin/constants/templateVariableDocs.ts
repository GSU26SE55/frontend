/**
 * Dictionary of template variable name → description + sample value.
 *
 * Why it's needed: the BE `/variables` endpoint (NotificationTemplateVariables.cs) returns **key
 * names only** — `["ticketId", "code", "customerId", "priority", "screen"]`. An author looking at
 * the chip row `{{code}}` `{{screen}}` cannot tell which one is the ticket code the customer sees,
 * which is an internal GUID, and which is a deep-link path. Handlebars renders an unknown variable
 * as an empty string instead of reporting an error, so a wrong guess only surfaces once the
 * customer receives the notification.
 *
 * Lookup is by key name and **case-insensitive** (the BE builds the model with OrdinalIgnoreCase,
 * so `{{Code}}` and `{{code}}` both resolve).
 *
 * When a BE consumer adds a new payload key: add a line here. A missing line breaks nothing — the
 * chip still renders, it just has no description.
 */

export interface TemplateVariableDoc {
  /** Short plain-language label — shown in place of the raw variable name. */
  label: string;
  /** The real value substituted at send time — helps picture how the sentence reads. */
  sample: string;
  /**
   * Variables to avoid in content sent to a recipient: internal GUIDs or bare enum numbers.
   * Still insertable (sometimes needed), just flagged with a soft warning.
   */
  internal?: boolean;
}

export const TEMPLATE_VARIABLE_DOCS: Record<string, TemplateVariableDoc> = {
  // ── Common variables (builtin — available on every type) ─────────────────
  title: { label: "System-generated title", sample: "New ticket TK-1042" },
  body: {
    label: "System-generated body",
    sample: "Ticket TK-1042 has just been created",
  },
  entitytype: { label: "Related entity type", sample: "Ticket" },
  entityid: {
    label: "Related entity ID",
    sample: "3f2b…c19a",
    internal: true,
  },
  userid: { label: "Recipient ID", sample: "8a71…40de", internal: true },
  createdat: { label: "Notification created at", sample: "17/08/2026 09:15" },

  // ── Ticket ───────────────────────────────────────────────────────────────
  ticketid: { label: "Ticket ID", sample: "3f2b…c19a", internal: true },
  code: { label: "Ticket code", sample: "TK-1042" },
  ticketcode: { label: "Ticket code", sample: "TK-1042" },
  customerid: { label: "Customer ID", sample: "9c14…77bf", internal: true },
  staffid: { label: "Technician ID", sample: "5e08…2a31", internal: true },
  staffname: { label: "Technician name", sample: "John Smith" },
  priority: { label: "Priority (number)", sample: "1", internal: true },
  screen: {
    label: "Screen opened when the notification is tapped",
    sample: "ticket-detail",
  },
  resolvedbystaffid: {
    label: "Resolving technician ID",
    sample: "5e08…2a31",
    internal: true,
  },
  sourceticketid: {
    label: "Merged-from ticket ID",
    sample: "3f2b…c19a",
    internal: true,
  },
  masterticketid: {
    label: "Surviving ticket ID after merge",
    sample: "7d90…11cc",
    internal: true,
  },
  declaredbyuserid: {
    label: "Reporter ID",
    sample: "8a71…40de",
    internal: true,
  },

  // Status — always prefer the *StatusName pair over the bare number.
  oldstatus: { label: "Previous status (number)", sample: "3", internal: true },
  newstatus: { label: "New status (number)", sample: "4", internal: true },
  oldstatusname: { label: "Previous status", sample: "In progress" },
  newstatusname: { label: "New status", sample: "Resolved" },

  // Schedule / progress
  scheduledstartatutc: {
    label: "Scheduled start time",
    sample: "18/08/2026 08:00",
  },
  previousscheduledstartatutc: {
    label: "Previous scheduled start time",
    sample: "17/08/2026 14:00",
  },
  workstartsimmediately: { label: "Starts immediately?", sample: "true" },
  startedatutc: { label: "Work started at", sample: "18/08/2026 08:05" },
  scheduleversion: { label: "Reschedule count", sample: "2" },
  activationreason: { label: "Activation reason", sample: "ScheduleReached" },
  closedat: { label: "Ticket closed at", sample: "19/08/2026 17:30" },
  isautoclosed: { label: "Auto-closed?", sample: "true" },
  rating: { label: "Customer rating (stars)", sample: "5" },
  approvedat: { label: "Approved at", sample: "19/08/2026 10:00" },
  rejectedat: { label: "Rejected at", sample: "19/08/2026 10:00" },
  isclosedrejected: { label: "Rejected and closed?", sample: "false" },
  reason: { label: "Reason", sample: "Out of warranty scope" },
  note: {
    label: "Additional note",
    sample: "Customer requested another survey",
  },
  reopenreason: { label: "Reopen reason", sample: "Issue recurred" },
  reopencount: { label: "Reopen count", sample: "2" },
  reopenedat: { label: "Reopened at", sample: "20/08/2026 09:00" },
  dayspending: { label: "Days pending", sample: "3" },
  daysuntilratingdeadline: { label: "Days left to rate", sample: "4" },

  // ── SLA ──────────────────────────────────────────────────────────────────
  percentage: { label: "SLA percentage used", sample: "80" },
  warningat: { label: "Warning raised at", sample: "18/08/2026 12:00" },
  breachedat: { label: "SLA breached at", sample: "18/08/2026 16:00" },
  resumedat: { label: "SLA resumed at", sample: "18/08/2026 13:00" },
  prioritytier: { label: "Priority tier", sample: "P1" },

  // ── Battery / alerts ─────────────────────────────────────────────────────
  alertid: { label: "Alert ID", sample: "b2e4…9017", internal: true },
  batteryassetid: { label: "Battery ID", sample: "c5a3…88f2", internal: true },
  assetserialnumber: {
    label: "Battery serial number",
    sample: "BAT-2024-0917",
  },
  anomalytype: { label: "Anomaly type (number)", sample: "4", internal: true },
  severity: { label: "Severity (number)", sample: "3", internal: true },
  anomalytypename: { label: "Anomaly type", sample: "Overheating" },
  severityname: { label: "Severity", sample: "Critical" },
  actualvalue: { label: "Measured value", sample: "62.4" },
  thresholdvalue: { label: "Threshold", sample: "55.0" },
  unit: { label: "Unit", sample: "°C" },
  detectedat: { label: "Detected at", sample: "17/08/2026 09:12" },
  minutessincedetection: { label: "Minutes since detection", sample: "45" },
  cascaderiskscore: { label: "Cascade risk score", sample: "0.82" },
  relatedticketid: {
    label: "Related ticket ID",
    sample: "3f2b…c19a",
    internal: true,
  },
  correlationid: {
    label: "Correlation ID (for log lookup)",
    sample: "a19f…5c30",
    internal: true,
  },
  errorcode: { label: "Error code", sample: "SAGA_TIMEOUT" },
  failedat: { label: "Failed at", sample: "17/08/2026 09:20" },
  failedatstage: { label: "Failed at stage", sample: "CreateTicket" },

  // ── Site / environment ───────────────────────────────────────────────────
  incidentid: { label: "Incident ID", sample: "d7c1…4e60", internal: true },
  siteid: { label: "Site ID", sample: "e3f8…2b47", internal: true },
  sitename: { label: "Site name", sample: "Binh Duong Site 1" },
  incidenttype: { label: "Incident type", sample: "High temperature" },
  description: {
    label: "Incident description",
    sample: "Room temperature exceeded 45°C",
  },
  wasfalsealarm: { label: "False alarm?", sample: "false" },
  resolvedat: { label: "Resolved at", sample: "17/08/2026 11:40" },

  // ── IoT ──────────────────────────────────────────────────────────────────
  iotdeviceid: {
    label: "IoT device ID",
    sample: "f4a2…6d18",
    internal: true,
  },
  devicecode: { label: "IoT device code", sample: "IOT-BD1-07" },
  lastseenat: { label: "Last seen online", sample: "17/08/2026 08:50" },
  offlinedurationseconds: {
    label: "Offline duration (seconds)",
    sample: "900",
  },
  affectedbatterycount: { label: "Affected battery count", sample: "12" },
  recoveredat: { label: "Recovered at", sample: "17/08/2026 09:05" },
  lastofflineat: {
    label: "Last offline at",
    sample: "17/08/2026 08:50",
  },
  rejectedreadingcount: { label: "Rejected reading count", sample: "148" },
  windowstartedat: {
    label: "Monitoring window started at",
    sample: "17/08/2026 06:00",
  },
  decommissionedat: {
    label: "Decommissioned at",
    sample: "17/08/2026 09:30",
  },

  // ── Conversation (chat) ──────────────────────────────────────────────────
  chatid: { label: "Conversation ID", sample: "aa10…39fe", internal: true },
  sendername: { label: "Sender name", sample: "Jane Doe" },
  isinternal: { label: "Internal note?", sample: "false" },
  isgroupmention: { label: "Mentions the whole group?", sample: "true" },
  reactiontype: { label: "Reaction type", sample: "Like" },
  managuserid: { label: "Manager ID", sample: "6b22…f803", internal: true },
  manageruserid: { label: "Manager ID", sample: "6b22…f803", internal: true },
  oldtype: { label: "Previous role", sample: "Observer" },
  newtype: { label: "New role", sample: "Assignee" },

  // ── Account ──────────────────────────────────────────────────────────────
  accountid: { label: "Account ID", sample: "8a71…40de", internal: true },
  creationsource: { label: "Account creation source", sample: "AdminInvite" },
  role: { label: "Role", sample: "Staff" },

  // ── Blog ─────────────────────────────────────────────────────────────────
  blogpostid: { label: "Blog post ID", sample: "cc39…7a44", internal: true },
  errormessage: {
    label: "Underlying technical error",
    sample: "Timeout after 60s",
    internal: true,
  },

  // ── Digest ───────────────────────────────────────────────────────────────
  digest: { label: "Is a digest?", sample: "true" },
  count: { label: "Notifications bundled", sample: "7" },
  from: { label: "From", sample: "17/08/2026 08:00" },
  to: { label: "To", sample: "17/08/2026 12:00" },
  notificationids: {
    label: "Notification ID list",
    sample: "3 IDs…",
    internal: true,
  },
};

/** Look up a variable's description — case-insensitive. `undefined` if not declared. */
export function getVariableDoc(name: string): TemplateVariableDoc | undefined {
  return TEMPLATE_VARIABLE_DOCS[name.toLowerCase()];
}
