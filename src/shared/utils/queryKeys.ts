export const KEY = {
  currentUser: "currentUser",
  loginHistory: "loginHistory",
  profile: "profile",
  staff: "staff",
  sessions: "sessions",
  trustedDevices: "trustedDevices",
  deviceTokens: "deviceTokens",
  notificationPreferences: "notificationPreferences",
  sites: "sites",
  files: "files",
  batteryAssets: "batteryAssets",
  batteryTypes: "batteryTypes",
  sensorReadings: "sensorReadings",
  thresholds: "thresholds",
  alerts: "alerts",
  ambient: "ambient",
  environmentalIncidents: "environmentalIncidents",
  tickets: "tickets",
  staffTickets: "staffTickets",
  ticketHealth: "ticketHealth",
  admin: {
    accounts: ["admin", "accounts"] as const,
    staff: ["admin", "staff"] as const,
    roles: ["admin", "roles"] as const,
    permissions: ["admin", "permissions"] as const,
    auditLogs: ["admin", "auditLogs"] as const,
    tickets: ["admin", "tickets"] as const,
    smsGateway: ["admin", "smsGateway"] as const,
    sagas: ["admin", "sagas"] as const,
  },
  manager: {
    tickets: ["manager", "tickets"] as const,
  },
  kb: "kb",
  ticketKbRefs: "ticketKbRefs",
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
  trustedDevices: {
    list: () => [KEY.trustedDevices, "list"] as const,
  },
  deviceTokens: {
    list: () => [KEY.deviceTokens, "list"] as const,
  },
  notificationPreferences: {
    me: () => [KEY.notificationPreferences, "me"] as const,
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
    presignedUrl: (id: string, expiresInMinutes?: number) =>
      [KEY.files, "presigned-url", id, expiresInMinutes] as const,
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
      byAccount: (accountId: string, params?: object) => [
        ...KEY.admin.auditLogs,
        "byAccount",
        accountId,
        params,
      ],
    },
    tickets: {
      list: (params?: object) => [...KEY.admin.tickets, "list", params],
    },
    smsGateway: {
      list: (params?: object) => [...KEY.admin.smsGateway, "list", params],
    },
    sagas: {
      list: (params?: object) => [...KEY.admin.sagas, "alert-ticket", params],
      detail: (alertId: string) => [
        ...KEY.admin.sagas,
        "alert-ticket",
        "detail",
        alertId,
      ],
    },
  },
  alerts: {
    list: (params?: object) => [KEY.alerts, "list", params] as const,
    detail: (id: string) => [KEY.alerts, "detail", id] as const,
  },
  ambient: {
    history: (siteId: string, params?: object) =>
      [KEY.ambient, "history", siteId, params] as const,
    latest: (siteId: string) => [KEY.ambient, "latest", siteId] as const,
    thresholdList: (params?: object) =>
      [KEY.ambient, "threshold", "list", params] as const,
    thresholdBySite: (siteId: string) =>
      [KEY.ambient, "threshold", "by-site", siteId] as const,
  },
  environmentalIncidents: {
    list: (params?: object) =>
      [KEY.environmentalIncidents, "list", params] as const,
    detail: (id: string) => [KEY.environmentalIncidents, "detail", id] as const,
    activeBySite: (siteId: string) =>
      [KEY.environmentalIncidents, "active", siteId] as const,
  },
  tickets: {
    detail: (id: string) => [KEY.tickets, "detail", id] as const,
    activities: (id: string) => [KEY.tickets, "activities", id] as const,
    maintenanceLogs: (id: string) =>
      [KEY.tickets, "maintenanceLogs", id] as const,
    comments: (id: string) => [KEY.tickets, "comments", id] as const,
  },
  staffTickets: {
    list: (params?: object) => [KEY.staffTickets, "list", params] as const,
    detail: (id: string) => [KEY.staffTickets, "detail", id] as const,
    myMaintenanceLogs: () => [KEY.staffTickets, "myMaintenanceLogs"] as const,
  },
  ticketHealth: {
    health: () => [KEY.ticketHealth, "health"] as const,
    syncLag: () => [KEY.ticketHealth, "sync-lag"] as const,
    saga: () => [KEY.ticketHealth, "saga"] as const,
  },
  manager: {
    tickets: {
      list: (params?: object) => [...KEY.manager.tickets, "list", params],
      queue: (params?: object) => [...KEY.manager.tickets, "queue", params],
      detail: (id: string) => [...KEY.manager.tickets, "detail", id],
      activities: (id: string) => [...KEY.manager.tickets, "activities", id],
    },
  },
  kb: {
    list: (params?: object) => [KEY.kb, "list", params] as const,
    detail: (id: string) => [KEY.kb, "detail", id] as const,
    versions: (id: string) => [KEY.kb, "versions", id] as const,
    versionDetail: (id: string, versionId: string | null) =>
      [KEY.kb, "version-detail", id, versionId] as const,
    compare: (id: string, fromVersionId?: string, toVersionId?: string) =>
      [KEY.kb, "compare", id, fromVersionId, toVersionId] as const,
    suggest: (params?: object) => [KEY.kb, "suggest", params] as const,
    usageStats: (id: string) => [KEY.kb, "usage-stats", id] as const,
  },
  ticketKbRefs: {
    list: (ticketId: string) => [KEY.ticketKbRefs, "list", ticketId] as const,
  },
} as const;
