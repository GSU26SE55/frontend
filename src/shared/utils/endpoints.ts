export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REGISTER: '/api/auth/register',
    VERIFY_OTP: '/api/auth/verify-otp',
    RESEND_OTP: '/api/auth/resend-otp',
    REFRESH_TOKEN: '/api/auth/refresh-token',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    VERIFY_RESET_OTP: '/api/auth/verify-reset-otp',
    RESET_PASSWORD: '/api/auth/reset-password',
    RESEND_RESET_OTP: '/api/auth/resend-reset-otp',
    ACCEPT_INVITE: '/api/auth/accept-invite',
    GOOGLE_LOGIN: '/api/auth/google/login',
    GOOGLE_CALLBACK: '/api/auth/google/callback',
    ME: '/api/auth/me',
    UPDATE_PROFILE: '/api/auth/me/profile',
    UPDATE_AVATAR: '/api/auth/me/avatar',
  },

  USERS: {
    LIST: '/api/users',
    CREATE: '/api/users',
    DETAIL: (id: string) => `/api/users/${id}`,
    UPDATE: (id: string) => `/api/users/${id}`,
    DEACTIVATE: (id: string) => `/api/users/${id}/deactivate`,
    RESET_PASSWORD: (id: string) => `/api/users/${id}/reset-password`,
    INVITE: '/api/users/invite',
  },

  BATTERIES: {
    LIST: '/api/batteries',
    CREATE: '/api/batteries',
    DETAIL: (id: string) => `/api/batteries/${id}`,
    UPDATE: (id: string) => `/api/batteries/${id}`,
    DELETE: (id: string) => `/api/batteries/${id}`,
    ASSIGN: (id: string) => `/api/batteries/${id}/assign`,
    CONFIG: (id: string) => `/api/batteries/${id}/config`,
    READINGS: (id: string) => `/api/batteries/${id}/readings`,
    READINGS_AGGREGATE: (id: string) => `/api/batteries/${id}/readings/aggregate`,
  },

  TICKETS: {
    LIST: '/api/tickets',
    CREATE: '/api/tickets',
    DETAIL: (id: string) => `/api/tickets/${id}`,
    UPDATE_STATUS: (id: string) => `/api/tickets/${id}/status`,
    ASSIGN: (id: string) => `/api/tickets/${id}/assign`,
    ESCALATE: (id: string) => `/api/tickets/${id}/escalate`,
    CLOSE: (id: string) => `/api/tickets/${id}/close`,
    CLOSE_REJECT: (id: string) => `/api/tickets/${id}/close-reject`,
    COMMENTS: (id: string) => `/api/tickets/${id}/comments`,
    MAINTENANCE_LOGS: (id: string) => `/api/tickets/${id}/maintenance-logs`,
  },

  NOTIFICATIONS: {
    LIST: '/api/notifications',
    MARK_READ: (id: string) => `/api/notifications/${id}/read`,
    MARK_ALL_READ: '/api/notifications/read-all',
  },

  SLA: {
    LIST: '/api/sla-rules',
    UPDATE: (id: string) => `/api/sla-rules/${id}`,
  },

  AUDIT_LOGS: {
    LIST: '/api/audit-logs',
  },
} as const;
