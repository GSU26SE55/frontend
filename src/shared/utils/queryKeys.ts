export const KEY = {
  currentUser: "currentUser",
  loginHistory: "loginHistory",
  profile: "profile",
  staff: "staff",
  sessions: "sessions",
  sites: "sites",
  files: "files",
  batteryAssets: "batteryAssets",
  batteryTypes: "batteryTypes",
  sensorReadings: "sensorReadings",
  thresholds: "thresholds",
  tickets: "tickets",
  staffTickets: "staffTickets",
  admin: {
    accounts: ["admin", "accounts"] as const,
    staff: ["admin", "staff"] as const,
    roles: ["admin", "roles"] as const,
    permissions: ["admin", "permissions"] as const,
    auditLogs: ["admin", "auditLogs"] as const,
    tickets: ["admin", "tickets"] as const,
  },
  manager: {
    tickets: ["manager", "tickets"] as const,
  },
} as const;

export const QUERY_KEY = {
  currentUser: {
    session: () => [KEY.currentUser, "session"] as const,
  },
  loginHistory: {
    list: (params?: object) => [KEY.loginHistory, "list", params] as const,
  },
  profile: {
    me: () => [KEY.profile, "me"] as const,
  },
  staff: {
    list: (skill?: string) => [KEY.staff, "list", skill] as const,
    detail: (id: string) => [KEY.staff, "detail", id] as const,
  },
  sessions: {
    me: (activeOnly?: boolean) => [KEY.sessions, "me", activeOnly] as const,
  },
  sites: {
    list: (params?: object) => [KEY.sites, "list", params] as const,
    detail: (id: string) => [KEY.sites, "detail", id] as const,
    dashboard: (id: string) => [KEY.sites, "dashboard", id] as const,
    assets: (siteId: string, params?: object) =>
      [KEY.sites, "assets", siteId, params] as const,
  },
  batteryAssets: {
    list: (params?: object) => [KEY.batteryAssets, "list", params] as const,
    detail: (id: string) => [KEY.batteryAssets, "detail", id] as const,
    realtime: (id: string) => [KEY.batteryAssets, "realtime", id] as const,
  },
  batteryTypes: {
    list: (params?: object) => [KEY.batteryTypes, "list", params] as const,
    detail: (id: string) => [KEY.batteryTypes, "detail", id] as const,
  },
  sensorReadings: {
    latest: (assetId: string) =>
      [KEY.sensorReadings, "latest", assetId] as const,
    history: (assetId: string, params?: object) =>
      [KEY.sensorReadings, "history", assetId, params] as const,
    aggregate: (assetId: string, params?: object) =>
      [KEY.sensorReadings, "aggregate", assetId, params] as const,
  },
  thresholds: {
    list: (params?: object) => [KEY.thresholds, "list", params] as const,
    byType: (batteryTypeId: string, params?: object) =>
      [KEY.thresholds, "by-type", batteryTypeId, params] as const,
  },
  files: {
    metadata: (id: string) => [KEY.files, "metadata", id] as const,
    presignedUrl: (id: string) => [KEY.files, "presigned-url", id] as const,
    blob: (id: string) => [KEY.files, "blob", id] as const,
  },
  admin: {
    accounts: {
      list: (params?: object) => [...KEY.admin.accounts, "list", params],
      detail: (id: string) => [...KEY.admin.accounts, "detail", id],
      sessions: (id: string) => [...KEY.admin.accounts, "sessions", id],
      loginHistory: (id: string, params?: object) => [
        ...KEY.admin.accounts,
        "loginHistory",
        id,
        params,
      ],
    },
    staff: {
      profile: (accountId: string) => [
        ...KEY.admin.staff,
        "profile",
        accountId,
      ],
    },
    roles: {
      list: (params?: object) => [...KEY.admin.roles, "list", params],
      detail: (id: string) => [...KEY.admin.roles, "detail", id],
      permissions: (roleId: string) => [
        ...KEY.admin.roles,
        "permissions",
        roleId,
      ],
    },
    permissions: {
      list: (module?: string) => [...KEY.admin.permissions, "list", module],
    },
    auditLogs: {
      list: (params?: object) => [...KEY.admin.auditLogs, "list", params],
    },
    tickets: {
      list: (params?: object) => [...KEY.admin.tickets, "list", params],
    },
  },
  tickets: {
    detail: (id: string) => [KEY.tickets, "detail", id] as const,
    activities: (id: string) => [KEY.tickets, "activities", id] as const,
  },
  staffTickets: {
    list: (params?: object) => [KEY.staffTickets, "list", params] as const,
    detail: (id: string) => [KEY.staffTickets, "detail", id] as const,
  },
  manager: {
    tickets: {
      list: (params?: object) => [...KEY.manager.tickets, "list", params],
      queue: (params?: object) => [...KEY.manager.tickets, "queue", params],
      detail: (id: string) => [...KEY.manager.tickets, "detail", id],
      activities: (id: string) => [...KEY.manager.tickets, "activities", id],
    },
  },
} as const;
