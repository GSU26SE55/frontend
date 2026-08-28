// Sidebar labels/titles SHARED by ≥2 roles — one source so a rename touches one spot.
// Labels/titles specific to a single role live in features/{role}/config/{role}Nav.ts.
// Panels inside the Overview page are OVERVIEW_PANELS (overviewPanels.ts) — not these.

// App name shown in the sidebar header.
export const APP_NAME = "Solar Battery Management";

// Menu item labels used by ≥2 roles.
export const SIDEBAR_LABELS = {
  overview: "Overview",
  analytics: "Analytics",
  sites: "Battery & Site",
  tickets: "Tickets",
  knowledgeBase: "Guide",
  blog: "Blog",
  batteryAlerts: "Battery alerts",
  // Reads as one family with the two lines around it. The route, types and BE endpoint
  // still say "incident" — only the label changed, so nothing else had to move.
  envIncidents: "Environmental alerts",
  // IoT gateway connectivity + data integrity. Separate from battery alerts because the
  // subject is the device, not any one battery — these rows carry no battery serial.
  deviceAlerts: "Device alerts",
  settings: "Settings",
} as const;

// Section group titles — shared by all three roles, so a role's sidebar differs only in
// WHICH items land in each group, never in how the groups are named.
//
// Named with the project's own ITIL 4 vocabulary (see .claude/rules/design.md), so the
// sidebar reads the same way the domain docs do:
//   incidents     — what is going wrong right now: the two alert streams, both carrying
//                   a red count.
//   knowledge     — ITIL Knowledge Management. Guide is the internal, technical KB;
//                   Blog is the customer-facing version generated from it
//                   (BlogPostOriginEnum.AiGeneratedFromKb), so Guide is listed first —
//                   the order follows the direction the content flows.
//   assets        — the estate and the records about it (sites, devices, audit log).
//                   Nothing is queued here; the reader came looking for something.
//   notifications — the outbound message pipeline, in the order the job is done.
//   system        — setup changed rarely. Collapsed by default.
export const SIDEBAR_SECTION_TITLES = {
  incidents: "Incidents",
  knowledge: "Knowledge",
  assets: "Assets",
  notifications: "Notifications",
  system: "System",
} as const;
