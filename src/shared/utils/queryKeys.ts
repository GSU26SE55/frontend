export const KEY = {
  currentUser: "currentUser",
  loginHistory: "loginHistory",
  profile: "profile",
  staff: "staff",
  sessions: "sessions",
  trustedDevices: "trustedDevices",
  deviceTokens: "deviceTokens",
  notifications: "notifications",
  notificationPreferences: "notificationPreferences",
  sites: "sites",
  files: "files",
  batteryAssets: "batteryAssets",
  batteryTypes: "batteryTypes",
  sensorReadings: "sensorReadings",
  thresholds: "thresholds",
  alerts: "alerts",
  sohPredictions: "sohPredictions",
  anomalyClassifications: "anomalyClassifications",
  ambient: "ambient",
  environmentalIncidents: "environmentalIncidents",
  tickets: "tickets",
  staffTickets: "staffTickets",
  ticketHealth: "ticketHealth",
  batteryDashboard: "batteryDashboard",
  ticketDashboard: "ticketDashboard",
  staffTicketDashboard: "staffTicketDashboard",
  siteDashboard: "siteDashboard",
  accountStats: "accountStats",
  reports: "reports",
  iotDevices: "iotDevices",
  iotCalibrations: "iotCalibrations",
  iotFirmware: "iotFirmware",
  admin: {
    accounts: ["admin", "accounts"] as const,
    staff: ["admin", "staff"] as const,
    roles: ["admin", "roles"] as const,
    permissions: ["admin", "permissions"] as const,
    auditLogs: ["admin", "auditLogs"] as const,
    batteryAuditLogs: ["admin", "batteryAuditLogs"] as const,
    alertAuditLogs: ["admin", "alertAuditLogs"] as const,
    ticketAuditLogs: ["admin", "ticketAuditLogs"] as const,
    fileAuditLogs: ["admin", "fileAuditLogs"] as const, // GH-133 C5

    tickets: ["admin", "tickets"] as const,
    smsGateway: ["admin", "smsGateway"] as const,
    sagas: ["admin", "sagas"] as const,
    notificationTemplates: ["admin", "notificationTemplates"] as const,
    notificationGroups: ["admin", "notificationGroups"] as const, // Sprint 6.4
    notificationBatches: ["admin", "notificationBatches"] as const, // Sprint 6.4
    notificationSettings: ["admin", "notificationSettings"] as const,
  },
  manager: {
    tickets: ["manager", "tickets"] as const,
  },
  kb: "kb",
  blog: "blog",
  blogTemplates: "blogTemplates",
  ticketKbRefs: "ticketKbRefs",
  ticketChatFiles: "ticketChatFiles",
  slaRules: "slaRules",
  auditAggregate: "auditAggregate",
  chatMentions: "chatMentions",
  myChats: "myChats",
  ticketParticipants: "ticketParticipants",
  permissionsCatalog: "permissionsCatalog", // GH-133 C1 — full catalog for every role
} as const;

export const QUERY_KEY = {
  currentUser: {
    session: () => [KEY.currentUser, "session"] as const,
    permissions: () => [KEY.currentUser, "permissions"] as const, // GH-106 — server-resolved permissions
  },
  loginHistory: {
    list: (params?: object) => [KEY.loginHistory, "list", params] as const,
  },
  permissionsCatalog: {
    list: (module?: string) =>
      [KEY.permissionsCatalog, "list", module] as const, // GH-133 C1
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
  notifications: {
    list: (params?: object) => [KEY.notifications, "list", params] as const,
    // Infinite-scroll inbox — a SEPARATE key from list so the inbox's many cached pages
    // do not overwrite the bell dropdown's 10-item cache.
    infinite: (params?: object) =>
      [KEY.notifications, "infinite", params] as const,
    detail: (id: string) => [KEY.notifications, "detail", id] as const,
    unreadCount: () => [KEY.notifications, "unread-count"] as const,
  },
  notificationPreferences: {
    me: () => [KEY.notificationPreferences, "me"] as const,
    matrix: () => [KEY.notificationPreferences, "matrix"] as const,
    categories: () => [KEY.notificationPreferences, "categories"] as const,
  },
  sites: {
    list: (params?: object) => [KEY.sites, "list", params] as const,
    detail: (id: string) => [KEY.sites, "detail", id] as const,
    dashboard: (id: string) => [KEY.sites, "dashboard", id] as const,
    assets: (siteId: string, params?: object) =>
      [KEY.sites, "assets", siteId, params] as const,
    cascadeSummary: (id: string) => [KEY.sites, "cascade-summary", id] as const,
  },
  batteryAssets: {
    list: (params?: object) => [KEY.batteryAssets, "list", params] as const,
    detail: (id: string) => [KEY.batteryAssets, "detail", id] as const,
    realtime: (id: string) => [KEY.batteryAssets, "realtime", id] as const,
    cascadeRisk: (id: string) =>
      [KEY.batteryAssets, "cascade-risk", id] as const,
    bmsSwitch: (id: string) =>
      [KEY.batteryAssets, "bms-switch", id] as const,
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
    aggregateHourly: (assetId: string, params?: object) =>
      [KEY.sensorReadings, "aggregate-hourly", assetId, params] as const,
  },
  thresholds: {
    list: (params?: object) => [KEY.thresholds, "list", params] as const,
    byType: (batteryTypeId: string, params?: object) =>
      [KEY.thresholds, "by-type", batteryTypeId, params] as const,
  },
  sohPredictions: {
    list: (assetId: string, params?: object) =>
      [KEY.sohPredictions, "list", assetId, params] as const,
    long: (assetId: string, params?: object) =>
      [KEY.sohPredictions, "long", assetId, params] as const,
    batch: (params?: object) => [KEY.sohPredictions, "batch", params] as const,
  },
  anomalyClassifications: {
    list: (assetId: string, params?: object) =>
      [KEY.anomalyClassifications, "list", assetId, params] as const,
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
    batteryAuditLogs: {
      list: (params?: object) => [
        ...KEY.admin.batteryAuditLogs,
        "list",
        params,
      ],
    },
    alertAuditLogs: {
      list: (params?: object) => [...KEY.admin.alertAuditLogs, "list", params],
    },
    ticketAuditLogs: {
      list: (params?: object) => [...KEY.admin.ticketAuditLogs, "list", params],
    },
    fileAuditLogs: {
      list: (params?: object) => [...KEY.admin.fileAuditLogs, "list", params],
    },
    tickets: {
      list: (params?: object) => [...KEY.admin.tickets, "list", params],
    },
    smsGateway: {
      list: (params?: object) => [...KEY.admin.smsGateway, "list", params],
    },
    notificationTemplates: {
      list: (params?: object) => [
        ...KEY.admin.notificationTemplates,
        "list",
        params,
      ],
      // A static contract between the consumer and the template — it does not change
      // within a single working session.
      variables: () => [...KEY.admin.notificationTemplates, "variables"],
      // Depends on real data, so it must be invalidated after a template is edited.
      coverage: () => [...KEY.admin.notificationTemplates, "coverage"],
    },
    notificationGroups: {
      list: (params?: object) => [
        ...KEY.admin.notificationGroups,
        "list",
        params,
      ],
      detail: (id: string) => [...KEY.admin.notificationGroups, "detail", id],
      members: (id: string, params?: object) => [
        ...KEY.admin.notificationGroups,
        "members",
        id,
        params,
      ],
    },
    notificationBatches: {
      list: (params?: object) => [
        ...KEY.admin.notificationBatches,
        "list",
        params,
      ],
      detail: (id: string) => [...KEY.admin.notificationBatches, "detail", id],
      // The preview depends on the selected groups AND individuals AND channels — put all
      // of them in the key so changing a selection refetches instead of reusing a stale count.
      preview: (params?: object) => [
        ...KEY.admin.notificationBatches,
        "preview",
        params,
      ],
      // The previewed content depends on the template in the DB + the variables the admin
      // is typing.
      templatePreview: (params?: object) => [
        ...KEY.admin.notificationBatches,
        "template-preview",
        params,
      ],
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
    notificationSettings: {
      pushTransport: () =>
        [...KEY.admin.notificationSettings, "pushTransport"] as const,
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
    // AI suggestions — do NOT cache for long: staff availability changes constantly, and a
    // stale suggestion can point at someone who has just been loaded up with tickets.
    staffSuggestions: (id: string, topN: number) =>
      [KEY.tickets, "staffSuggestions", id, topN] as const,
    kbSuggestions: (id: string, topN: number) =>
      [KEY.tickets, "kbSuggestions", id, topN] as const,
    activities: (id: string) => [KEY.tickets, "activities", id] as const,
    maintenanceLogs: (id: string) =>
      [KEY.tickets, "maintenanceLogs", id] as const,
    chats: (id: string) => [KEY.tickets, "chats", id] as const,
    chatDetail: (tid: string, cid: string) =>
      [KEY.tickets, "chat", tid, cid] as const,
    chatReplies: (tid: string, cid: string) =>
      [KEY.tickets, "replies", tid, cid] as const,
    chatReactions: (tid: string, cid: string) =>
      [KEY.tickets, "reactions", tid, cid] as const,
    chatUnreadCount: (tid: string) => [KEY.tickets, "unread", tid] as const,
    chatReaders: (tid: string, cid: string) =>
      [KEY.tickets, "readers", tid, cid] as const,
    participants: (tid: string) => [KEY.tickets, "participants", tid] as const,
    participantsHistory: (tid: string) =>
      [KEY.tickets, "participants-history", tid] as const,
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
    compare: (id: string, fromVersionId?: string, toVersionId?: string) =>
      [KEY.kb, "compare", id, fromVersionId, toVersionId] as const,
    suggest: (params?: object) => [KEY.kb, "suggest", params] as const,
    usageStats: (id: string) => [KEY.kb, "usage-stats", id] as const,
  },
  blog: {
    // Public (Published posts only)
    publicList: (params?: object) => [KEY.blog, "public-list", params] as const,
    publicDetail: (id: string) => [KEY.blog, "public-detail", id] as const,
    // Internal (every status)
    list: (params?: object) => [KEY.blog, "list", params] as const,
    detail: (id: string) => [KEY.blog, "detail", id] as const,
    versions: (id: string) => [KEY.blog, "versions", id] as const,
    compare: (id: string, oldVersion?: number, newVersion?: number) =>
      [KEY.blog, "compare", id, oldVersion, newVersion] as const,
  },
  blogTemplates: {
    list: (params?: object) => [KEY.blogTemplates, "list", params] as const,
    detail: (id: string) => [KEY.blogTemplates, "detail", id] as const,
  },
  ticketKbRefs: {
    list: (ticketId: string) => [KEY.ticketKbRefs, "list", ticketId] as const,
  },
  ticketChatFiles: {
    list: (ticketId?: string) =>
      [KEY.ticketChatFiles, "list", ticketId] as const,
  },
  iotDevices: {
    list: (params?: object) => [KEY.iotDevices, "list", params] as const,
    detail: (id: string) => [KEY.iotDevices, "detail", id] as const,
    byCode: (deviceCode: string) =>
      [KEY.iotDevices, "by-code", deviceCode] as const,
    // IOT3-66/67 — đường Staff (`/api/iot-devices`), TÁCH khỏi `list` của admin
    // (`/api/admin/iot-devices`): hai endpoint khác nhau, hai hình dạng dữ liệu khác nhau,
    // dùng chung key là cache của bên này trả cho bên kia.
    staffList: (params?: object) => [KEY.iotDevices, "staff-list", params] as const,
    heartbeats: (deviceId: string, params?: object) =>
      [KEY.iotDevices, "heartbeats", deviceId, params] as const,
  },
  iotCalibrations: {
    list: (deviceId: string, params?: object) =>
      [KEY.iotCalibrations, "list", deviceId, params] as const,
    expiring: (within?: number) =>
      [KEY.iotCalibrations, "expiring", within] as const,
  },
  iotFirmware: {
    list: (params?: object) => [KEY.iotFirmware, "list", params] as const,
  },
  batteryDashboard: {
    stats: (params?: object) =>
      [KEY.batteryDashboard, "stats", params] as const,
  },
  ticketDashboard: {
    stats: () => [KEY.ticketDashboard, "stats"] as const,
  },
  staffTicketDashboard: {
    stats: () => [KEY.staffTicketDashboard, "stats"] as const,
  },
  siteDashboard: {
    stats: () => [KEY.siteDashboard, "stats"] as const,
  },
  accountStats: {
    stats: () => [KEY.accountStats, "stats"] as const,
  },
  reports: {
    batteryHealthByType: () => [KEY.reports, "battery-health-by-type"] as const,
    alertVolume: (params?: object) =>
      [KEY.reports, "alert-volume", params] as const,
    topAnomalies: (params?: object) =>
      [KEY.reports, "top-anomalies", params] as const,
    assetLifecycle: () => [KEY.reports, "asset-lifecycle"] as const,
    warrantyExpiring: (params?: object) =>
      [KEY.reports, "warranty-expiring", params] as const,
    environmentalIncidents: (params?: object) =>
      [KEY.reports, "environmental-incidents", params] as const,
    ambientTrend: (params?: object) =>
      [KEY.reports, "ambient-trend", params] as const,
    slaByStaff: (params?: object) =>
      [KEY.reports, "sla-by-staff", params] as const,
    slaByPriority: (params?: object) =>
      [KEY.reports, "sla-by-priority", params] as const,
    ticketVolume: (params?: object) =>
      [KEY.reports, "ticket-volume", params] as const,
    topReopenIssues: (params?: object) =>
      [KEY.reports, "top-reopen-issues", params] as const,
    staffPerformance: (params?: object) =>
      [KEY.reports, "staff-performance", params] as const,
    csat: (params?: object) => [KEY.reports, "csat", params] as const,
    resolutionTimeHistogram: (params?: object) =>
      [KEY.reports, "resolution-time-histogram", params] as const,
    categoryBreakdown: (params?: object) =>
      [KEY.reports, "category-breakdown", params] as const,
    sagaFailedRate: (params?: object) =>
      [KEY.reports, "saga-failed-rate", params] as const,
  },
  slaRules: {
    list: () => [KEY.slaRules, "list"] as const,
  },
  auditAggregate: {
    search: (params?: object) =>
      [KEY.auditAggregate, "search", params] as const,
    detail: (id: string) => [KEY.auditAggregate, "detail", id] as const,
    correlation: (id: string) =>
      [KEY.auditAggregate, "correlation", id] as const,
    accountTimeline: (accountId: string, limit?: number) =>
      [KEY.auditAggregate, "timeline", accountId, limit] as const,
    stats: (params?: object) => [KEY.auditAggregate, "stats", params] as const,
  },
  chatMentions: {
    me: (params?: object) => [KEY.chatMentions, "me", params] as const,
  },
  myChats: {
    list: (params?: object) => [KEY.myChats, "list", params] as const,
    unreadCount: () => [KEY.myChats, "unread-count"] as const,
  },
  ticketParticipants: {
    list: (tid: string) => [KEY.ticketParticipants, "list", tid] as const,
    history: (tid: string) => [KEY.ticketParticipants, "history", tid] as const,
  },
} as const;
