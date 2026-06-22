export const ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    LOGIN_VERIFY_2FA: "/api/auth/login/verify-2fa", // GH-295 — bước 2 của 2FA login
    LOGIN_2FA_SMS: "/api/auth/login/2fa/sms", // #AUTH-58 — gửi OTP SMS fallback (header X-Challenge-Token)
    TWO_FA_CROSS_DEVICE_REQUEST: "/api/auth/2fa/cross-device-confirm/request", // #AUTH-51 — Device A
    TWO_FA_CROSS_DEVICE_CONFIRM: "/api/auth/2fa/cross-device-confirm", // #AUTH-51 — Device B
    REACTIVATE_REQUEST: "/api/auth/reactivate-request", // #AUTH-50 — bước 1
    REACTIVATE_VERIFY: "/api/auth/reactivate-verify", // #AUTH-50 — bước 2
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
      // GH-295: flow 2FA 2 bước. /enable cũ đã 410 Gone — không dùng.
      TWO_FA_INIT: "/api/accounts/me/2fa/init",
      TWO_FA_CONFIRM: "/api/accounts/me/2fa/confirm",
      TWO_FA_DISABLE: "/api/accounts/me/2fa/disable",
      TWO_FA_BACKUP_REGEN: "/api/accounts/me/2fa/backup-codes/regenerate",
      LINK_GOOGLE: "/api/accounts/me/link-google",
      UNLINK_GOOGLE: "/api/accounts/me/unlink-google",
      DEACTIVATE: "/api/accounts/me/deactivate",
      DELETE: "/api/accounts/me",
      LOGIN_HISTORY: "/api/accounts/me/login-history",
      EXPORT: "/api/accounts/me/export", // #AUTH-62 — GDPR data export (JSON)
      // #AUTH-48 — Trusted Devices
      TRUSTED_DEVICES: "/api/accounts/me/trusted-devices",
      TRUSTED_DEVICE: (id: string) => `/api/accounts/me/trusted-devices/${id}`,
    },
  },

  // Base /api/tickets chung (đọc shared cho mọi role). Action theo role nằm ở
  // STAFF_TICKETS / ADMIN.TICKETS — KHÔNG có LIST/CREATE/status/close generic (api-ticket.md).
  TICKETS: {
    DETAIL: (id: string) => `/api/tickets/${id}`,
    ACTIVITIES: (id: string) => `/api/tickets/${id}/activities`,
    COMMENTS: (id: string) => `/api/tickets/${id}/comments`,
    MAINTENANCE_LOGS: (id: string) => `/api/tickets/${id}/maintenance-logs`,
    MAINTENANCE_LOG_UPDATE: (id: string, logId: string) =>
      `/api/tickets/${id}/maintenance-logs/${logId}`,
  },

  // Health metrics (public — JSON thuần, KHÔNG bọc CommonResponse).
  TICKET_HEALTH: {
    HEALTH: "/api/ticket/health",
    SYNC_LAG: "/api/ticket/health/sync-lag",
    SAGA: "/api/ticket/health/saga",
  },

  STAFF_TICKETS: {
    ME: "/api/staff/tickets/me",
    MAINTENANCE_LOGS_ME: "/api/staff/tickets/maintenance-logs/me",
    START: (id: string) => `/api/staff/tickets/${id}/start`,
    HOLD: (id: string) => `/api/staff/tickets/${id}/hold`,
    RESUME: (id: string) => `/api/staff/tickets/${id}/resume`,
    RESOLVE: (id: string) => `/api/staff/tickets/${id}/resolve`,
    ESCALATE_REQUEST: (id: string) =>
      `/api/staff/tickets/${id}/escalate-request`,
  },

  NOTIFICATIONS: {
    LIST: "/api/notifications",
    CREATE: "/api/notifications", // Admin only — tạo notification thủ công
  },

  DEVICE_TOKENS: {
    REGISTER: "/api/device-tokens",
    UNREGISTER: "/api/device-tokens", // DELETE — body { token }
    LIST: "/api/device-tokens",
  },

  NOTIFICATION_PREFERENCES: {
    GET: "/api/notification-preferences",
    UPDATE: "/api/notification-preferences", // PUT — upsert preference của user hiện tại
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

  // Audit logs thật nằm ở ADMIN.AUDIT_LOGS (/api/admin/audit-logs).
  // Endpoint /api/audit-logs không tồn tại trong spec → đã xóa group top-level.

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
      RESET_2FA: (id: string) => `/api/admin/accounts/${id}/2fa`, // GH-295 — admin reset 2FA (DELETE)
      MERGE: (id: string) => `/api/admin/accounts/${id}/merge`, // #AUTH-47 — merge secondary vào primary (path = primaryId)
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
      BY_ACCOUNT: (accountId: string) =>
        `/api/admin/audit-logs/by-account/${accountId}`,
    },
    TICKETS: {
      LIST: "/api/admin/tickets",
      QUEUE: "/api/admin/tickets/queue",
      TRIAGE: (id: string) => `/api/admin/tickets/${id}/triage`,
      TRIAGE_REJECT: (id: string) => `/api/admin/tickets/${id}/triage-reject`,
      ASSIGN: (id: string) => `/api/admin/tickets/${id}/assign`,
      REASSIGN: (id: string) => `/api/admin/tickets/${id}/reassign`,
      APPROVE: (id: string) => `/api/admin/tickets/${id}/approve`,
      REJECT: (id: string) => `/api/admin/tickets/${id}/reject`,
      ESCALATE: (id: string) => `/api/admin/tickets/${id}/escalate`,
      DECLARE_INCIDENT: (id: string) =>
        `/api/admin/tickets/${id}/declare-incident`,
    },
    SMS_GATEWAY: {
      DEVICES: "/api/admin/sms-gateway/devices",
      DEVICE_REVOKE: (id: string) => `/api/admin/sms-gateway/devices/${id}`,
    },
    SAGAS: {
      ALERT_TICKET_LIST: "/api/admin/sagas/alert-ticket",
      ALERT_TICKET_DETAIL: (alertId: string) =>
        `/api/admin/sagas/alert-ticket/${alertId}`,
      ALERT_TICKET_REPROCESS: (alertId: string) =>
        `/api/admin/sagas/alert-ticket/${alertId}/reprocess`,
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

  // KB public/read (mọi role đã đăng nhập)
  KNOWLEDGE_BASE: {
    LIST: "/api/knowledge-base",
    DETAIL: (id: string) => `/api/knowledge-base/${id}`,
    HELPFUL: (id: string) => `/api/knowledge-base/${id}/helpful`,
    SUGGEST: "/api/knowledge-base/suggest",
    USAGE_STATS: (id: string) => `/api/knowledge-base/${id}/usage-stats`,
  },

  // KB nội bộ — authoring (Staff/Manager/Admin)
  KB_INTERNAL: {
    CREATE: "/api/internal/knowledge-base",
    UPDATE: (id: string) => `/api/internal/knowledge-base/${id}`,
    VERSIONS: (id: string) => `/api/internal/knowledge-base/${id}/versions`,
    VERSION_DETAIL: (id: string, versionId: string) =>
      `/api/internal/knowledge-base/${id}/versions/${versionId}`,
    COMPARE: (id: string) => `/api/internal/knowledge-base/${id}/compare`,
    COPY_TEMPLATE: (id: string) =>
      `/api/internal/knowledge-base/${id}/copy-template`,
  },

  // KB workflow — duyệt/xuất bản (Manager/Admin)
  KB_ADMIN: {
    APPROVE_REVIEW: (id: string) =>
      `/api/admin/knowledge-base/${id}/approve-review`,
    REJECT_REVIEW: (id: string) =>
      `/api/admin/knowledge-base/${id}/reject-review`,
    PUBLISH: (id: string) => `/api/admin/knowledge-base/${id}/publish`,
    ARCHIVE: (id: string) => `/api/admin/knowledge-base/${id}/archive`,
    ROLLBACK: (id: string) => `/api/admin/knowledge-base/${id}/rollback`,
    DELETE: (id: string) => `/api/admin/knowledge-base/${id}`,
  },

  // Gán bài KB vào Ticket (Staff/Manager/Admin)
  KB_REFERENCES: {
    LIST: "/api/knowledge-base/references", // GET ?ticketId=
    ADD: "/api/knowledge-base/references", // POST
    REMOVE: (referenceId: string) =>
      `/api/knowledge-base/references/${referenceId}`,
  },
} as const;
