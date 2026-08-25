// Panel names (the title of <DashboardPanel>) on the Overview page of all 3 roles.
// These are the panels inside the role's default page (/admin, /manager, /staff) —
// NOT the sidebar "sections" (Needs action / Look up / Notifications / Configure).
// Kept in one place so renaming a panel touches one spot instead of 3 pages.
// Usage: title={OVERVIEW_PANELS.admin.alerts7d}

export const OVERVIEW_PANELS = {
  admin: {
    alerts7d: "Alerts · 7 days",
    alertsByType: "Alerts by type",
    slaSystem: "System-wide SLA compliance",
    // "Operational status" = the business lifecycle (Active/Suspended/
    // Decommissioned, set by hand by an admin), NOT connectivity. Named
    // explicitly so it doesn't visually clash with the "Batteries online"
    // panel (online/offline) sitting right next to it on the dashboard.
    batteryByStatus: "Batteries by operational status",
    topAlerting: "Most-alerting batteries",
    siteHealth: "Site health",
    telemetry24h: "Average telemetry · 24h",
  },
  manager: {
    ticketPipeline: "Ticket pipeline",
    sla: "SLA compliance",
    priority: "Tickets by priority",
    newTickets7d: "New tickets · 7 days",
    staffLoad: "Staff workload",
    triageQueue: "Triage queue",
    sitesNeedAttention: "Sites needing attention",
    topAlerting: "Most-alerting batteries",
  },
  staff: {
    personalSla: "My SLA compliance",
    tickets7d: "Tickets · 7 days",
    ticketStatus: "Ticket status",
    priority: "Work priority",
    slaRisk: "SLA risk",
    recentNotifications: "Recent notifications",
  },
} as const;
