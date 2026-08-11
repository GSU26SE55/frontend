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
    ME_PERMISSIONS: "/api/auth/me/permissions", // GH-106 — permission server-resolved (DB), không đọc perm[] JWT
    PERMISSIONS_CATALOG: "/api/permissions", // GH-133 C1 — catalog full mọi role (khác /api/admin/permissions Admin-only)
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
  // BE đổi ticket_comments → ticket_chats (migration 20260622) — path chính xác là /chats.
  TICKETS: {
    DASHBOARD_STATS: "/api/tickets/dashboard/stats",
    DETAIL: (id: string) => `/api/tickets/${id}`,
    ACTIVITIES: (id: string) => `/api/tickets/${id}/activities`,
    CHATS: (id: string) => `/api/tickets/${id}/chats`,
    CHAT_DETAIL: (tid: string, cid: string) =>
      `/api/tickets/${tid}/chats/${cid}`,
    CHAT_HISTORY: (tid: string, cid: string) =>
      `/api/tickets/${tid}/chats/${cid}/history`,
    CHAT_REPLIES: (tid: string, cid: string) =>
      `/api/tickets/${tid}/chats/${cid}/replies`,
    CHAT_PIN: (tid: string, cid: string) =>
      `/api/tickets/${tid}/chats/${cid}/pin`,
    CHAT_REACTIONS: (tid: string, cid: string) =>
      `/api/tickets/${tid}/chats/${cid}/reactions`,
    CHAT_MARK_READ: (tid: string) => `/api/tickets/${tid}/chats/mark-read`,
    CHAT_READERS: (tid: string, cid: string) =>
      `/api/tickets/${tid}/chats/${cid}/readers`,
    CHAT_UNREAD_COUNT: (tid: string) =>
      `/api/tickets/${tid}/chats/unread-count`,
    CHAT_CURSOR: (tid: string) => `/api/tickets/${tid}/chats/cursor`,
    CHAT_ATTACHMENTS: (tid: string, cid: string) =>
      `/api/tickets/${tid}/chats/${cid}/attachments`,
    // Tổng hợp mọi file đã gửi qua chat trong 1 ticket (dùng cho picker ảnh khi soạn KB)
    CHAT_FILES: (tid: string) => `/api/tickets/${tid}/chats/files`,
    CHAT_ATTACHMENT: (tid: string, cid: string, aid: string) =>
      `/api/tickets/${tid}/chats/${cid}/attachments/${aid}`,
    CHAT_TRANSLATE: (tid: string, cid: string) =>
      `/api/tickets/${tid}/chats/${cid}/translate`,
    CHAT_VOICE: (tid: string) => `/api/tickets/${tid}/chats/voice`,
    CHAT_VOICE_RETRY: (tid: string, cid: string) =>
      `/api/tickets/${tid}/chats/${cid}/voice/retry`,
    // GH-133 Nhóm C — AI chats + download attachment
    CHAT_ATTACHMENT_DOWNLOAD: (tid: string, cid: string, aid: string) =>
      `/api/tickets/${tid}/chats/${cid}/attachments/${aid}/download`, // C3
    CHAT_SUGGEST: (tid: string) => `/api/tickets/${tid}/chats/suggest`, // C2 (AI)
    CHAT_SUMMARIZE: (tid: string) => `/api/tickets/${tid}/chats/summarize`, // C2 (AI)
    MAINTENANCE_LOGS: (id: string) => `/api/tickets/${id}/maintenance-logs`,
    MAINTENANCE_LOG_UPDATE: (id: string, logId: string) =>
      `/api/tickets/${id}/maintenance-logs/${logId}`,
    PARTICIPANTS: (tid: string) => `/api/tickets/${tid}/participants`,
    PARTICIPANT: (tid: string, uid: string) =>
      `/api/tickets/${tid}/participants/${uid}`,
    PARTICIPANTS_BULK: (tid: string) => `/api/tickets/${tid}/participants/bulk`,
    PARTICIPANTS_LEAVE: (tid: string) =>
      `/api/tickets/${tid}/participants/leave`,
    PARTICIPANTS_HISTORY: (tid: string) =>
      `/api/tickets/${tid}/participants/history`,
    // AI-ranked suggestions for a ticket. Added here because commit 51bd9ec shipped
    // suggestion.service.ts referencing these two keys without defining them, which broke
    // `tsc -b`. Paths follow the BE route convention (lowercase, kebab-case) — confirm them
    // against the TicketService controller before relying on the response.
    STAFF_SUGGESTIONS: (id: string) => `/api/tickets/${id}/staff-suggestions`,
    KB_SUGGESTIONS: (id: string) => `/api/tickets/${id}/kb-suggestions`,
  },

  // #696 — CHAT_TEMPLATES đã bị xóa khỏi BE (/api/chat-templates,
  // /api/tickets/{id}/chats/from-template/{templateId}). Không khôi phục.

  CHAT_MENTIONS: {
    ME: "/api/chats/mentions/me",
  },

  MY_CHATS: {
    LIST: "/api/chats/me",
    ERASE: "/api/chats/erase-my-data",
    // Tổng tin chưa đọc trên MỌI ticket của user hiện tại. BE đếm theo bản ghi chat nên
    // tin có @mention đã nằm trong số này — không cộng thêm list mention (đếm gấp đôi).
    UNREAD_COUNT: "/api/chats/unread-count",
  },

  ADMIN_CHAT_SEARCH: {
    SEARCH: "/api/chats/search",
  },

  // Health metrics (public — JSON thuần, KHÔNG bọc CommonResponse).
  TICKET_HEALTH: {
    HEALTH: "/api/ticket/health",
    SYNC_LAG: "/api/ticket/health/sync-lag",
    SAGA: "/api/ticket/health/saga",
  },

  STAFF_TICKETS: {
    ME: "/api/staff/tickets/me",
    DASHBOARD_STATS: "/api/staff/tickets/dashboard/stats",
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
    // GET chi tiết 1 noti — KHÔNG áp bộ lọc feed InApp như LIST (đã cầm id thì trả
    // đúng bản ghi đó). Chỉ đọc, không tự mark read. 404 nếu là noti của user khác.
    DETAIL: (id: string) => `/api/notifications/${id}`,
    CREATE: "/api/notifications", // Admin only — tạo notification thủ công
    MARK_READ: (id: string) => `/api/notifications/${id}/read`, // PATCH — idempotent
    MARK_ALL_READ: "/api/notifications/read-all", // POST — body rỗng
    UNREAD_COUNT: "/api/notifications/unread-count", // GET — badge count
    // PATCH — user chủ động MỞ notification (bấm push / deep link). Mạnh hơn /read,
    // dùng để đo open-rate thật. Idempotent → gọi lại vẫn 200.
    OPENED: (id: string) => `/api/notifications/${id}/opened`,
    UNSUBSCRIBE: "/api/notification-unsubscribe",
  },

  DEVICE_TOKENS: {
    REGISTER: "/api/device-tokens",
    UNREGISTER: "/api/device-tokens", // DELETE — body { token }
    LIST: "/api/device-tokens",
  },

  NOTIFICATION_PREFERENCES: {
    GET: "/api/notification-preferences",
    UPDATE: "/api/notification-preferences", // PUT — upsert preference của user hiện tại
    // Sprint 6.3 NOTI3-04 — ma trận nhóm × kênh.
    // GET trả đủ 6 nhóm; PUT VÁ TỪNG DÒNG (chỉ nhóm gửi lên bị đổi).
    MATRIX: "/api/notification-preferences/matrix",
    // Bảng tra cứu NotificationType → nhóm (không nhân bản mapping ở client).
    CATEGORIES: "/api/notification-preferences/categories",
  },

  ALERTS: {
    LIST: "/api/alerts",
    DETAIL: (id: string) => `/api/alerts/${id}`,
    ACKNOWLEDGE: (id: string) => `/api/alerts/${id}/acknowledge`,
    RESOLVE: (id: string) => `/api/alerts/${id}/resolve`,
    PRESCRIPTION_FEEDBACK: (id: string) =>
      `/api/alerts/${id}/prescription-feedback`,
    AI_PRESCRIPTION: (id: string) => `/api/alerts/${id}/ai-prescription`,
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
    // Report thủ công bằng JWT (Staff/Manager/Admin) — reuse handler với POST / (IoT).
    MANUAL: "/api/environmental-incidents/manual",
    DETAIL: (id: string) => `/api/environmental-incidents/${id}`,
    ACKNOWLEDGE: (id: string) =>
      `/api/environmental-incidents/${id}/acknowledge`,
    RESOLVE: (id: string) => `/api/environmental-incidents/${id}/resolve`,
    FALSE_ALARM: (id: string) =>
      `/api/environmental-incidents/${id}/false-alarm`,
    ACTIVE_BY_SITE: (siteId: string) =>
      `/api/environmental-incidents/by-site/${siteId}/active`,
  },

  // AI — SOH prediction + anomaly classification (BE-AI: SohPredictionBackgroundService populate).
  SOH_PREDICTIONS: {
    LIST: "/api/v1/soh-predictions", // ?batteryAssetId=&from=&to=&pageNumber=&pageSize=
    LONG: "/api/v1/soh-predictions/long",
    BATCH: "/api/v1/soh-predictions/batch",
  },
  ANOMALY_CLASSIFICATIONS: {
    LIST: "/api/v1/anomaly-classifications", // ?batteryAssetId=&classification=&from=&to=
    FEEDBACK: (id: string) => `/api/v1/anomaly-classifications/${id}/feedback`,
  },

  // Audit logs thật nằm ở ADMIN.AUDIT_LOGS (/api/admin/audit-logs).
  // Endpoint /api/audit-logs không tồn tại trong spec → đã xóa group top-level.

  ADMIN: {
    ACCOUNTS: {
      LIST: "/api/admin/accounts",
      STATS: "/api/admin/accounts/stats",
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
      // Manager gộp ticket nghi trùng vào ticket đích (body: { targetTicketId }).
      MERGE: (id: string) => `/api/admin/tickets/${id}/merge`,
      // Kích hoạt AI kiểm tra lại (ticket Skipped/Pending).
      RE_VERIFY: (id: string) => `/api/admin/tickets/${id}/re-verify`,
      // Manager đổi priority + reason. BE có thể tự escalate + đổi primary handler
      // nếu tier staff không đủ cho priority mới → response.data.status có thể = Escalated.
      RE_PRIORITIZE: (id: string) => `/api/admin/tickets/${id}/re-prioritize`,
    },
    SMS_GATEWAY: {
      DEVICES: "/api/admin/sms-gateway/devices",
      DEVICE_REVOKE: (id: string) => `/api/admin/sms-gateway/devices/${id}`,
    },
    // Sprint 6.3 NOTI3-12 — quản lý template. Chưa có endpoint create/update:
    // tạo bản mới làm bằng SQL/seed, ACTIVATE chỉ chuyển giữa các bản đã tồn tại.
    NOTIFICATION_TEMPLATES: {
      LIST: "/api/admin/notification-templates", // ?type=&channel=&activeOnly=&pageNumber=&pageSize=
      // 02/08/2026 — soạn thảo template. CREATE dùng chung path với LIST (POST vs GET).
      CREATE: "/api/admin/notification-templates",
      DETAIL: (id: string) => `/api/admin/notification-templates/${id}`,
      // PUT = sinh phiên bản MỚI rồi bật lên, không ghi đè bản cũ.
      REVISE: (id: string) => `/api/admin/notification-templates/${id}`,
      DELETE: (id: string) => `/api/admin/notification-templates/${id}`,
      PREVIEW: (id: string) =>
        `/api/admin/notification-templates/${id}/preview`,
      // Chỉ template kênh Email; rate limit 5 lần/giờ/admin (429 khi vượt).
      TEST_SEND: (id: string) =>
        `/api/admin/notification-templates/${id}/test-send`,
      ACTIVATE: (id: string) =>
        `/api/admin/notification-templates/${id}/activate`,
      // 03/08/2026 — hai endpoint tra cứu, không sửa gì.
      // VARIABLES: biến hợp lệ theo từng loại thông báo. Cần vì template gọi sai tên biến thì
      // Handlebars render ra RỖNG chứ không báo lỗi — người soạn phải tự đoán và đoán sai thì
      // không ai biết. Đây là dữ liệu tĩnh, không chạm DB.
      VARIABLES: "/api/admin/notification-templates/variables",
      // COVERAGE: cặp (loại × kênh) nào đang sinh thông báo thật mà thiếu template, và template
      // nào đang dùng biến không tồn tại.
      COVERAGE: "/api/admin/notification-templates/coverage",
    },
    // Sprint 6.4 — nhóm người nhận. Nhóm `Role` (kind=2) do seeder tạo, không sửa/xoá được.
    NOTIFICATION_GROUPS: {
      LIST: "/api/admin/notification-groups", // ?kind=&search=&pageNumber=&pageSize=
      CREATE: "/api/admin/notification-groups", // POST — luôn tạo nhóm Static
      DETAIL: (id: string) => `/api/admin/notification-groups/${id}`,
      UPDATE: (id: string) => `/api/admin/notification-groups/${id}`,
      DELETE: (id: string) => `/api/admin/notification-groups/${id}`,
      MEMBERS: (id: string) => `/api/admin/notification-groups/${id}/members`,
      ADD_MEMBERS: (id: string) =>
        `/api/admin/notification-groups/${id}/members`,
      REMOVE_MEMBER: (id: string, userId: string) =>
        `/api/admin/notification-groups/${id}/members/${userId}`,
    },
    // Sprint 6.4 — gửi hàng loạt + lịch sử gửi.
    NOTIFICATION_BROADCAST: {
      // POST — KHÔNG gửi gì, chỉ trả số người nhận SAU KHI gom trùng. Cộng memberCount
      // từng nhóm ở client là sai khi các nhóm giao nhau.
      PREVIEW: "/api/admin/notifications/broadcast/preview",
      // 03/08/2026 — xem trước NỘI DUNG theo từng kênh khi bật "dùng mẫu". Tách khỏi PREVIEW ở trên
      // vì hai câu hỏi khác nhau: "gửi cho bao nhiêu người" và "mỗi kênh sẽ hiện ra chữ gì".
      // Phải tách theo kênh vì mẫu khoá theo (Loại × Kênh) và bản SMS được nén ngắn riêng.
      TEMPLATE_PREVIEW: "/api/admin/notifications/broadcast/template-preview",
      SEND: "/api/admin/notifications/broadcast",
      BATCHES: "/api/admin/notifications/batches",
      BATCH_DETAIL: (id: string) => `/api/admin/notifications/batches/${id}`,
    },
    SAGAS: {
      ALERT_TICKET_LIST: "/api/admin/sagas/alert-ticket",
      ALERT_TICKET_DETAIL: (alertId: string) =>
        `/api/admin/sagas/alert-ticket/${alertId}`,
      ALERT_TICKET_REPROCESS: (alertId: string) =>
        `/api/admin/sagas/alert-ticket/${alertId}/reprocess`,
    },
    // Audit log Pin & Cảnh báo (BatteryService fallback — Admin only)
    BATTERY_AUDIT_LOGS: "/api/admin/battery/audit-logs",
    ALERT_AUDIT_LOGS: "/api/admin/alerts/audit-logs",
    // Audit log nội bộ TicketService (Option C, #AUDIT-28) — khác với AuditAggregator
    TICKET_AUDIT_LOGS: "/api/admin/ticket/audit-logs",
    // Audit truy cập file GDPR (FileStorageService — Admin only) — GH-133 C5
    FILES_AUDIT_LOGS: "/api/admin/files/audit-logs",
    // Admin chat override (ticket đã Closed)
    CHAT_CLOSED_OVERRIDE: (tid: string) =>
      `/api/admin/tickets/${tid}/chats/closed-override`, // POST-add
    // GH-133 C4 — per-chat PUT (edit) + DELETE trên ticket Closed (khác POST-add ở trên)
    CHAT_CLOSED_OVERRIDE_ITEM: (tid: string, cid: string) =>
      `/api/admin/tickets/${tid}/chats/${cid}/closed-override`,
    CHAT_RESTORE: (tid: string, cid: string) =>
      `/api/admin/tickets/${tid}/chats/${cid}/restore`,
    NOTIFICATION_SETTINGS: {
      PUSH_TRANSPORT: "/api/admin/notification-settings/push-transport",
    },
  },

  // AuditAggregatorService — cross-service audit read-store (Sprint audit #AUDIT-17).
  // Tách biệt hoàn toàn với ADMIN.AUDIT_LOGS (/api/admin/audit-logs của AuthService).
  AUDIT_AGGREGATOR: {
    SEARCH: "/api/admin/audit/search",
    DETAIL: (id: string) => `/api/admin/audit/${id}`,
    CORRELATION: (corrId: string) => `/api/admin/audit/correlation/${corrId}`,
    ACCOUNT_TIMELINE: (accountId: string) =>
      `/api/admin/audit/account/${accountId}/timeline`,
    STATS: "/api/admin/audit/stats",
    EXPORT: "/api/admin/audit/export",
    REPLAY: "/api/admin/audit/replay",
    REDACT: "/api/admin/audit/redact",
  },

  SITES: {
    LIST: "/api/sites",
    ME: "/api/sites/me",
    DASHBOARD_STATS: "/api/sites/dashboard/stats",
    DETAIL: (id: string) => `/api/sites/${id}`,
    DASHBOARD: (id: string) => `/api/sites/${id}/dashboard`,
    ASSETS: (siteId: string) => `/api/sites/${siteId}/assets`,
    CASCADE_RISK_SUMMARY: (id: string) =>
      `/api/sites/${id}/cascade-risk-summary`,
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
    CASCADE_RISK: (id: string) => `/api/battery-assets/${id}/cascade-risk`,
    TOPOLOGY: (id: string) => `/api/battery-assets/${id}/topology`,
    BMS_SWITCH: (id: string) => `/api/battery-assets/${id}/bms-switch`,
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
    // Bucket 1h cố định (continuous aggregate) — cho range dài; /aggregate cho ≤ 7 ngày.
    AGGREGATE_HOURLY: (assetId: string) =>
      `/api/sensor-readings/${assetId}/aggregate/hourly`,
    // SSE live telemetry — text/event-stream. Token qua ?access_token= (EventSource
    // không set được header). Chỉ trả PATH; wrapper sse.ts ghép ?scope=&access_token=.
    STREAM: "/api/sensor-readings/stream",
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

  BATTERY_DASHBOARD: {
    STATS: "/api/battery/dashboard/stats",
  },

  // IoT Device Management (Nhóm 11). Self-service 11A (provision/heartbeat/firmware-check)
  // dùng ApiKey per-device do ESP32 gọi — FE không có.
  IOT_DEVICES: {
    // Admin (JWT Admin)
    LIST: "/api/admin/iot-devices",
    DETAIL: (id: string) => `/api/admin/iot-devices/${id}`,
    CREATE: "/api/admin/iot-devices",
    UPDATE: (id: string) => `/api/admin/iot-devices/${id}`,
    DELETE: (id: string) => `/api/admin/iot-devices/${id}`,
    ROTATE_KEY: (id: string) => `/api/admin/iot-devices/${id}/rotate-key`,
    REVOKE_KEY: (id: string) => `/api/admin/iot-devices/${id}/revoke-key`,
    COMMAND: (id: string) => `/api/admin/iot-devices/${id}/command`,
    // IOT3-32 — xoay RIÊNG credential MQTT. Khác ROTATE_KEY ở chỗ apiKey còn nguyên, nên thiết
    // bị tự lấy mật khẩu mới qua /provision — KHÔNG phải ra hiện trường.
    ROTATE_MQTT: (id: string) => `/api/admin/iot-devices/${id}/rotate-mqtt`,
    // Lookup deviceCode → deviceId (Admin/Manager/Staff) — cầu nối cho Staff calibration.
    BY_CODE: (deviceCode: string) =>
      `/api/iot-devices/by-code/${encodeURIComponent(deviceCode)}`,
    // IOT3-57 — danh sách cho Admin/Manager/Staff. KHÔNG trả apiKey/mqttPassword.
    STAFF_LIST: "/api/iot-devices",
    // IOT3-58 — lịch sử heartbeat, phân trang theo CON TRỎ (không offset).
    HEARTBEATS: (deviceId: string) => `/api/iot-devices/${deviceId}/heartbeats`,
  },

  IOT_CALIBRATIONS: {
    LIST: (deviceId: string) => `/api/iot-devices/${deviceId}/calibrations`,
    CREATE: (deviceId: string) => `/api/iot-devices/${deviceId}/calibrations`,
    DELETE: (deviceId: string, calibrationId: string) =>
      `/api/iot-devices/${deviceId}/calibrations/${calibrationId}`,
    EXPIRING: "/api/iot-devices/calibrations-expiring",
  },

  IOT_FIRMWARE: {
    LIST: "/api/admin/iot-firmware-releases",
    CREATE: "/api/admin/iot-firmware-releases",
    UPLOAD_BINARY: "/api/admin/iot-firmware-releases/upload-binary",
    PUBLISH: (id: string) => `/api/admin/iot-firmware-releases/${id}/publish`,
    ARCHIVE: (id: string) => `/api/admin/iot-firmware-releases/${id}/archive`,
  },

  // Reports — BatteryService (Sprint 7 #114) + TicketService (Sprint 7 #114 §5.2).
  // Thêm ?format=csv|xlsx để export file; không truyền → JSON.
  REPORTS: {
    // BatteryService reports
    BATTERY_HEALTH_BY_TYPE: "/api/reports/battery-health-by-type",
    ALERT_VOLUME: "/api/reports/alert-volume",
    TOP_ANOMALIES: "/api/reports/top-anomalies",
    ASSET_LIFECYCLE: "/api/reports/asset-lifecycle",
    WARRANTY_EXPIRING: "/api/reports/warranty-expiring",
    ENVIRONMENTAL_INCIDENTS: "/api/reports/environmental-incidents",
    AMBIENT_TREND: "/api/reports/ambient-trend",
    // TicketService reports
    SLA_BY_STAFF: "/api/reports/sla-by-staff",
    SLA_BY_PRIORITY: "/api/reports/sla-by-priority",
    TICKET_VOLUME: "/api/reports/ticket-volume",
    TOP_REOPEN_ISSUES: "/api/reports/top-reopen-issues",
    STAFF_PERFORMANCE: "/api/reports/staff-performance",
    CSAT: "/api/reports/csat",
    RESOLUTION_TIME_HISTOGRAM: "/api/reports/resolution-time-histogram",
    CATEGORY_BREAKDOWN: "/api/reports/category-breakdown",
    SAGA_FAILED_RATE: "/api/reports/saga-failed-rate",
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
    // Sao chép bài KB có sẵn → tạo bản mới (title "_copy", Draft), trả Id.
    DUPLICATE: (id: string) => `/api/internal/knowledge-base/${id}/duplicate`,
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

  // Blog public — mọi role đã đăng nhập, CHỈ bài Published
  BLOG: {
    LIST: "/api/blog",
    DETAIL: (id: string) => `/api/blog/${id}`,
  },

  // Blog nội bộ — authoring (Staff/Manager/Admin), đọc được mọi trạng thái
  BLOG_INTERNAL: {
    LIST: "/api/internal/blog",
    // Dùng để POLL trạng thái Generating — KHÔNG dùng BLOG.DETAIL (404 khi chưa publish)
    DETAIL: (id: string) => `/api/internal/blog/${id}`,
    CREATE: "/api/internal/blog",
    UPDATE: (id: string) => `/api/internal/blog/${id}`,
    VERSIONS: (id: string) => `/api/internal/blog/${id}/versions`,
    COMPARE: (id: string) => `/api/internal/blog/${id}/compare`,
    TEMPLATES: "/api/internal/blog/templates",
    TEMPLATE_DETAIL: (id: string) => `/api/internal/blog/templates/${id}`,
  },

  // Blog workflow — publish/archive/xóa/sinh bằng AI (Manager/Admin)
  BLOG_ADMIN: {
    GENERATE_FROM_KB: (kbId: string) =>
      `/api/admin/blog/generate-from-kb/${kbId}`,
    PUBLISH: (id: string) => `/api/admin/blog/${id}/publish`,
    ARCHIVE: (id: string) => `/api/admin/blog/${id}/archive`,
    DELETE: (id: string) => `/api/admin/blog/${id}`,
  },

  // Blog template — GHI chỉ Admin (đọc dùng BLOG_INTERNAL.TEMPLATES)
  BLOG_TEMPLATES_ADMIN: {
    CREATE: "/api/admin/blog/templates",
    UPDATE: (id: string) => `/api/admin/blog/templates/${id}`,
    DELETE: (id: string) => `/api/admin/blog/templates/${id}`,
  },
} as const;
