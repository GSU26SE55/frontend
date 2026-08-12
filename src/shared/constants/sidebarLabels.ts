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
  envIncidents: "Environmental incidents",
  ambient: "Site environment",
  inbox: "Inbox",
  settings: "Settings",
} as const;

// Inbox path — shared by every role (no /admin|/manager|/staff prefix).
// AppLayout matches this path to attach the unread badge, so the 3 nav configs and
// AppLayout must reference the same constant: change the path in one place but not
// the other and the badge silently disappears.
export const INBOX_PATH = "/notifications";

// Section group titles used by ≥2 roles (only "System" is shared by all 3).
// Role-specific section titles ("Battery infrastructure"/"Management"/"Reports"…)
// live in {role}Nav.ts.
export const SIDEBAR_SECTION_TITLES = {
  system: "System",
} as const;
