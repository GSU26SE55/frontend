export const ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    LOGOUT: "/api/auth/logout",
    REGISTER: "/api/auth/register",
    VERIFY_OTP: "/api/auth/verify-otp",
    RESEND_OTP: "/api/auth/resend-otp",
    REFRESH_TOKEN: "/api/auth/refresh-token",
    FORGOT_PASSWORD: "/api/auth/forgot-password",
    VERIFY_RESET_OTP: "/api/auth/verify-reset-otp",
    RESET_PASSWORD: "/api/auth/reset-password",
    RESEND_RESET_OTP: "/api/auth/resend-reset-otp",
    ACCEPT_INVITE: "/api/auth/accept-invite",
    GOOGLE_LOGIN: "/api/auth/google/login",
    GOOGLE_CALLBACK: "/api/auth/google/callback",
    ME: "/api/auth/me",
    UPDATE_PROFILE: "/api/auth/me/profile",
    UPDATE_AVATAR: "/api/auth/me/avatar",
  },

  ACCOUNTS: {
    ME: {
      PASSWORD: "/api/accounts/me/password",
      CHANGE_EMAIL: "/api/accounts/me/change-email",
      CONFIRM_EMAIL_CHANGE: "/api/accounts/me/confirm-email-change",
      SEND_PHONE_OTP: "/api/accounts/me/send-phone-otp",
      VERIFY_PHONE_OTP: "/api/accounts/me/verify-phone-otp",
      TWO_FA_ENABLE: "/api/accounts/me/2fa/enable",
      TWO_FA_DISABLE: "/api/accounts/me/2fa/disable",
      LINK_GOOGLE: "/api/accounts/me/link-google",
      UNLINK_GOOGLE: "/api/accounts/me/unlink-google",
      DEACTIVATE: "/api/accounts/me/deactivate",
      DELETE: "/api/accounts/me",
      LOGIN_HISTORY: "/api/accounts/me/login-history",
    },
  },

  USERS: {
    LIST: "/api/users",
    CREATE: "/api/users",
    DETAIL: (id: string) => `/api/users/${id}`,
    UPDATE: (id: string) => `/api/users/${id}`,
    DEACTIVATE: (id: string) => `/api/users/${id}/deactivate`,
    RESET_PASSWORD: (id: string) => `/api/users/${id}/reset-password`,
    INVITE: "/api/users/invite",
  },

  TICKETS: {
    LIST: "/api/tickets",
    CREATE: "/api/tickets",
    DETAIL: (id: string) => `/api/tickets/${id}`,
    UPDATE_STATUS: (id: string) => `/api/tickets/${id}/status`,
    ASSIGN: (id: string) => `/api/tickets/${id}/assign`,
    ESCALATE: (id: string) => `/api/tickets/${id}/escalate`,
    CLOSE: (id: string) => `/api/tickets/${id}/close`,
    CLOSE_REJECT: (id: string) => `/api/tickets/${id}/close-reject`,
    COMMENTS: (id: string) => `/api/tickets/${id}/comments`,
    MAINTENANCE_LOGS: (id: string) => `/api/tickets/${id}/maintenance-logs`,
    ACTIVITIES: (id: string) => `/api/tickets/${id}/activities`,
  },

  STAFF_TICKETS: {
    ME: "/api/staff/tickets/me",
    START: (id: string) => `/api/staff/tickets/${id}/start`,
    HOLD: (id: string) => `/api/staff/tickets/${id}/hold`,
    RESUME: (id: string) => `/api/staff/tickets/${id}/resume`,
    RESOLVE: (id: string) => `/api/staff/tickets/${id}/resolve`,
    ESCALATE_REQUEST: (id: string) =>
      `/api/staff/tickets/${id}/escalate-request`,
  },

  NOTIFICATIONS: {
    LIST: "/api/notifications",
    MARK_READ: (id: string) => `/api/notifications/${id}/read`,
    MARK_ALL_READ: "/api/notifications/read-all",
  },

  ALERTS: {
    LIST: "/api/alerts",
    DETAIL: (id: string) => `/api/alerts/${id}`,
    ACKNOWLEDGE: (id: string) => `/api/alerts/${id}/acknowledge`,
    RESOLVE: (id: string) => `/api/alerts/${id}/resolve`,
  },

  AMBIENT: {
    // Note: POST /api/ambient/readings/batch là IoT ingest (API Key) — FE không gọi.
    READINGS_HISTORY: "/api/ambient/readings/history",
    READINGS_LATEST: "/api/ambient/readings/latest",
    THRESHOLD_UPSERT: "/api/ambient/threshold-configs",
    THRESHOLD_LIST: "/api/ambient/threshold-configs",
    THRESHOLD_BY_SITE: (siteId: string) =>
      `/api/ambient/threshold-configs/by-site/${siteId}`,
  },

  ENVIRONMENTAL_INCIDENTS: {
    // Note: POST /api/environmental-incidents là IoT ingest (API Key) — FE không gọi.
    LIST: "/api/environmental-incidents",
    DETAIL: (id: string) => `/api/environmental-incidents/${id}`,
    ACKNOWLEDGE: (id: string) =>
      `/api/environmental-incidents/${id}/acknowledge`,
    RESOLVE: (id: string) => `/api/environmental-incidents/${id}/resolve`,
    FALSE_ALARM: (id: string) =>
      `/api/environmental-incidents/${id}/false-alarm`,
    ACTIVE_BY_SITE: (siteId: string) =>
      `/api/environmental-incidents/by-site/${siteId}/active`,
  },

  SLA: {
    LIST: "/api/sla-rules",
    UPDATE: (id: string) => `/api/sla-rules/${id}`,
  },

  AUDIT_LOGS: {
    LIST: "/api/audit-logs",
  },

  ADMIN: {
    ACCOUNTS: {
      LIST: "/api/admin/accounts",
      DETAIL: (id: string) => `/api/admin/accounts/${id}`,
      CREATE: "/api/admin/accounts",
      INVITE: "/api/admin/accounts/invite",
      UPDATE: (id: string) => `/api/admin/accounts/${id}`,
      STATUS: (id: string) => `/api/admin/accounts/${id}/status`,
      UNLOCK: (id: string) => `/api/admin/accounts/${id}/unlock`,
      DELETE: (id: string) => `/api/admin/accounts/${id}`,
      SESSIONS: (id: string) => `/api/admin/accounts/${id}/sessions`,
      REVOKE_ALL: (id: string) =>
        `/api/admin/accounts/${id}/sessions/revoke-all`,
      LOGIN_HISTORY: (id: string) => `/api/admin/accounts/${id}/login-history`,
      ROLE: (id: string) => `/api/admin/accounts/${id}/role`,
    },
    STAFF: {
      PROFILE: (id: string) => `/api/admin/staff/${id}/profile`,
      SKILLS: (id: string) => `/api/admin/staff/${id}/skills`,
      SKILL: (id: string, skillCode: string) =>
        `/api/admin/staff/${id}/skills/${skillCode}`,
    },
    ROLES: {
      LIST: "/api/admin/roles",
      DETAIL: (id: string) => `/api/admin/roles/${id}`,
      CREATE: "/api/admin/roles",
      UPDATE: (id: string) => `/api/admin/roles/${id}`,
      STATUS: (id: string) => `/api/admin/roles/${id}/status`,
      DELETE: (id: string) => `/api/admin/roles/${id}`,
    },
    PERMISSIONS: {
      LIST: "/api/admin/permissions",
      BY_ROLE: (roleId: string) => `/api/admin/roles/${roleId}/permissions`,
      SET_FOR_ROLE: (roleId: string) =>
        `/api/admin/roles/${roleId}/permissions`,
    },
    AUDIT_LOGS: {
      LIST: "/api/admin/audit-logs",
    },
    TICKETS: {
      LIST: "/api/admin/tickets",
      QUEUE: "/api/admin/tickets/queue",
      TRIAGE: (id: string) => `/api/admin/tickets/${id}/triage`,
      ASSIGN: (id: string) => `/api/admin/tickets/${id}/assign`,
      REASSIGN: (id: string) => `/api/admin/tickets/${id}/reassign`,
      APPROVE: (id: string) => `/api/admin/tickets/${id}/approve`,
      REJECT: (id: string) => `/api/admin/tickets/${id}/reject`,
      ESCALATE: (id: string) => `/api/admin/tickets/${id}/escalate`,
      DECLARE_INCIDENT: (id: string) =>
        `/api/admin/tickets/${id}/declare-incident`,
    },
  },

  SITES: {
    LIST: "/api/sites",
    ME: "/api/sites/me",
    DETAIL: (id: string) => `/api/sites/${id}`,
    DASHBOARD: (id: string) => `/api/sites/${id}/dashboard`,
    ASSETS: (siteId: string) => `/api/sites/${siteId}/assets`,
    // Write ops live under /api/admin/sites (AdminSitesController)
    CREATE: "/api/admin/sites",
    UPDATE: (id: string) => `/api/admin/sites/${id}`,
    DELETE: (id: string) => `/api/admin/sites/${id}`,
    RESTORE: (id: string) => `/api/admin/sites/${id}/restore`,
  },

  STAFF: {
    LIST: "/api/staff",
    DETAIL: (id: string) => `/api/staff/${id}/assignment-profile`,
  },

  BATTERY_ASSETS: {
    LIST: "/api/battery-assets",
    DETAIL: (id: string) => `/api/battery-assets/${id}`,
    REALTIME: (id: string) => `/api/battery-assets/${id}/realtime`,
    // Write ops live under /api/admin/battery-assets (AdminBatteryAssetsController)
    CREATE: "/api/admin/battery-assets",
    UPDATE: (id: string) => `/api/admin/battery-assets/${id}`,
    DELETE: (id: string) => `/api/admin/battery-assets/${id}`,
    RESTORE: (id: string) => `/api/admin/battery-assets/${id}/restore`,
    TRANSFER_OWNER: (id: string) =>
      `/api/admin/battery-assets/${id}/transfer-owner`,
  },

  SENSOR_READINGS: {
    LATEST: (assetId: string) => `/api/sensor-readings/${assetId}/latest`,
    HISTORY: (assetId: string) => `/api/sensor-readings/${assetId}/history`,
    AGGREGATE: (assetId: string) => `/api/sensor-readings/${assetId}/aggregate`,
    // POST /api/sensor-readings/batch: IoT gateway (API Key) — không thuộc web FE
  },

  BATTERY_TYPES: {
    LIST: "/api/battery-types",
    DETAIL: (id: string) => `/api/battery-types/${id}`,
    // Write ops live under /api/admin/battery-types (AdminBatteryTypesController)
    CREATE: "/api/admin/battery-types",
    UPDATE: (id: string) => `/api/admin/battery-types/${id}`,
    DELETE: (id: string) => `/api/admin/battery-types/${id}`,
    RESTORE: (id: string) => `/api/admin/battery-types/${id}/restore`,
  },

  THRESHOLDS: {
    LIST: "/api/thresholds",
    BY_TYPE: (batteryTypeId: string) =>
      `/api/thresholds/by-type/${batteryTypeId}`,
    // Write op lives under /api/admin/thresholds (AdminThresholdsController)
    UPSERT: (batteryTypeId: string) =>
      `/api/admin/thresholds/by-type/${batteryTypeId}`,
  },

  FILES: {
    UPLOAD: "/api/files/upload",
    METADATA: (id: string) => `/api/files/${id}/metadata`,
    DOWNLOAD: (id: string) => `/api/files/${id}/download`,
    PRESIGNED_URL: (id: string) => `/api/files/${id}/presigned-url`,
    DELETE: (id: string) => `/api/files/${id}`,
  },

  SESSIONS: {
    ME: "/api/sessions/me",
    REVOKE: (id: string) => `/api/sessions/${id}`,
    REVOKE_ALL: "/api/sessions/revoke-all",
  },

  KB_ARTICLES: {
    LIST: "/api/kb-articles",
    DETAIL: (id: string) => `/api/kb-articles/${id}`,
    CREATE: "/api/kb-articles",
    UPDATE: (id: string) => `/api/kb-articles/${id}`,
    DELETE: (id: string) => `/api/kb-articles/${id}`,
    PUBLISH: (id: string) => `/api/kb-articles/${id}/publish`,
    ARCHIVE: (id: string) => `/api/kb-articles/${id}/archive`,
    SEARCH: "/api/kb-articles/search",
  },

  TICKET_KB_REFS: {
    LIST: (ticketId: string) => `/api/tickets/${ticketId}/kb-references`,
    ADD: (ticketId: string) => `/api/tickets/${ticketId}/kb-references`,
    REMOVE: (ticketId: string, refId: string) =>
      `/api/tickets/${ticketId}/kb-references/${refId}`,
  },
} as const;
