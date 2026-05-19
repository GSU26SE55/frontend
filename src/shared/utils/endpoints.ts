export const ENDPOINTS = {
  AUTH: {
    LOGIN:            '/api/auth/login',
    LOGOUT:           '/api/auth/logout',
    REGISTER:         '/api/auth/register',
    VERIFY_OTP:       '/api/auth/verify-otp',
    RESEND_OTP:       '/api/auth/resend-otp',
    REFRESH_TOKEN:    '/api/auth/refresh-token',
    FORGOT_PASSWORD:  '/api/auth/forgot-password',
    VERIFY_RESET_OTP: '/api/auth/verify-reset-otp',
    RESET_PASSWORD:   '/api/auth/reset-password',
    RESEND_RESET_OTP: '/api/auth/resend-reset-otp',
    ACCEPT_INVITE:    '/api/auth/accept-invite',
    GOOGLE_LOGIN:     '/api/auth/google/login',
    GOOGLE_CALLBACK:  '/api/auth/google/callback',
    ME:               '/api/auth/me',
    UPDATE_PROFILE:   '/api/auth/me/profile',
    UPDATE_AVATAR:    '/api/auth/me/avatar',
  },

  ACCOUNTS: {
    ME: {
      PASSWORD:             '/api/accounts/me/password',
      CHANGE_EMAIL:         '/api/accounts/me/change-email',
      CONFIRM_EMAIL_CHANGE: '/api/accounts/me/confirm-email-change',
      SEND_PHONE_OTP:       '/api/accounts/me/send-phone-otp',
      VERIFY_PHONE_OTP:     '/api/accounts/me/verify-phone-otp',
      TWO_FA_ENABLE:        '/api/accounts/me/2fa/enable',
      TWO_FA_DISABLE:       '/api/accounts/me/2fa/disable',
      LINK_GOOGLE:          '/api/accounts/me/link-google',
      UNLINK_GOOGLE:        '/api/accounts/me/unlink-google',
      DEACTIVATE:           '/api/accounts/me/deactivate',
      DELETE:               '/api/accounts/me',
      LOGIN_HISTORY:        '/api/accounts/me/login-history',
    },
  },

  USERS: {
    LIST:           '/api/users',
    CREATE:         '/api/users',
    DETAIL:         (id: string) => `/api/users/${id}`,
    UPDATE:         (id: string) => `/api/users/${id}`,
    DEACTIVATE:     (id: string) => `/api/users/${id}/deactivate`,
    RESET_PASSWORD: (id: string) => `/api/users/${id}/reset-password`,
    INVITE:         '/api/users/invite',
  },

  BATTERIES: {
    LIST:               '/api/batteries',
    CREATE:             '/api/batteries',
    DETAIL:             (id: string) => `/api/batteries/${id}`,
    UPDATE:             (id: string) => `/api/batteries/${id}`,
    DELETE:             (id: string) => `/api/batteries/${id}`,
    ASSIGN:             (id: string) => `/api/batteries/${id}/assign`,
    CONFIG:             (id: string) => `/api/batteries/${id}/config`,
    READINGS:           (id: string) => `/api/batteries/${id}/readings`,
    READINGS_AGGREGATE: (id: string) => `/api/batteries/${id}/readings/aggregate`,
  },

  TICKETS: {
    LIST:             '/api/tickets',
    CREATE:           '/api/tickets',
    DETAIL:           (id: string) => `/api/tickets/${id}`,
    UPDATE_STATUS:    (id: string) => `/api/tickets/${id}/status`,
    ASSIGN:           (id: string) => `/api/tickets/${id}/assign`,
    ESCALATE:         (id: string) => `/api/tickets/${id}/escalate`,
    CLOSE:            (id: string) => `/api/tickets/${id}/close`,
    CLOSE_REJECT:     (id: string) => `/api/tickets/${id}/close-reject`,
    COMMENTS:         (id: string) => `/api/tickets/${id}/comments`,
    MAINTENANCE_LOGS: (id: string) => `/api/tickets/${id}/maintenance-logs`,
  },

  NOTIFICATIONS: {
    LIST:         '/api/notifications',
    MARK_READ:    (id: string) => `/api/notifications/${id}/read`,
    MARK_ALL_READ: '/api/notifications/read-all',
  },

  SLA: {
    LIST:   '/api/sla-rules',
    UPDATE: (id: string) => `/api/sla-rules/${id}`,
  },

  AUDIT_LOGS: {
    LIST: '/api/audit-logs',
  },

  ADMIN: {
    ACCOUNTS: {
      LIST:          '/api/admin/accounts',
      DETAIL:        (id: string) => `/api/admin/accounts/${id}`,
      CREATE:        '/api/admin/accounts',
      INVITE:        '/api/admin/accounts/invite',
      UPDATE:        (id: string) => `/api/admin/accounts/${id}`,
      STATUS:        (id: string) => `/api/admin/accounts/${id}/status`,
      UNLOCK:        (id: string) => `/api/admin/accounts/${id}/unlock`,
      DELETE:        (id: string) => `/api/admin/accounts/${id}`,
      SESSIONS:      (id: string) => `/api/admin/accounts/${id}/sessions`,
      REVOKE_ALL:    (id: string) => `/api/admin/accounts/${id}/sessions/revoke-all`,
      LOGIN_HISTORY: (id: string) => `/api/admin/accounts/${id}/login-history`,
    },
    STAFF: {
      PROFILE: (id: string) => `/api/admin/staff/${id}/profile`,
      SKILLS:  (id: string) => `/api/admin/staff/${id}/skills`,
      SKILL:   (id: string, skillCode: string) => `/api/admin/staff/${id}/skills/${skillCode}`,
    },
    ROLES: {
      LIST:   '/api/admin/roles',
      DETAIL: (id: string) => `/api/admin/roles/${id}`,
      CREATE: '/api/admin/roles',
      UPDATE: (id: string) => `/api/admin/roles/${id}`,
      STATUS: (id: string) => `/api/admin/roles/${id}/status`,
      DELETE: (id: string) => `/api/admin/roles/${id}`,
    },
    PERMISSIONS: {
      LIST:         '/api/admin/permissions',
      BY_ROLE:      (roleId: string) => `/api/admin/roles/${roleId}/permissions`,
      SET_FOR_ROLE: (roleId: string) => `/api/admin/roles/${roleId}/permissions`,
    },
    AUDIT_LOGS: {
      LIST: '/api/admin/audit-logs',
    },
  },

  SITES: {
    LIST:      '/api/sites',
    ME:        '/api/sites/me',
    DETAIL:    (id: string) => `/api/sites/${id}`,
    DASHBOARD: (id: string) => `/api/sites/${id}/dashboard`,
    ASSETS:    (siteId: string) => `/api/sites/${siteId}/assets`,
    RESTORE:   (id: string) => `/api/sites/${id}/restore`,
  },

  STAFF: {
    LIST:   '/api/staff',
    DETAIL: (id: string) => `/api/staff/${id}/assignment-profile`,
  },

  SESSIONS: {
    ME:         '/api/sessions/me',
    REVOKE:     (id: string) => `/api/sessions/${id}`,
    REVOKE_ALL: '/api/sessions/revoke-all',
  },
} as const;
