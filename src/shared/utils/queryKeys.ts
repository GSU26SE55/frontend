export const KEY = {
  batteries: ['batteries'],
  tickets: ['tickets'],
  users: ['users'],
  notifications: ['notifications'],
  auditLogs: ['auditLogs'],
  currentUser: ['currentUser'],
} as const;

export const QUERY_KEY = {
  batteries: {
    list: (params?: object) => [...KEY.batteries, 'list', params] as const,
    detail: (id: string) => [...KEY.batteries, 'detail', id] as const,
  },
  tickets: {
    list: (params?: object) => [...KEY.tickets, 'list', params] as const,
    detail: (id: string) => [...KEY.tickets, 'detail', id] as const,
  },
  users: {
    list: (params?: object) => [...KEY.users, 'list', params] as const,
    detail: (id: string) => [...KEY.users, 'detail', id] as const,
  },
  notifications: {
    list: (params?: object) => [...KEY.notifications, 'list', params] as const,
  },
  auditLogs: {
    list: (params?: object) => [...KEY.auditLogs, 'list', params] as const,
  },
  currentUser: {
    session: () => [...KEY.currentUser, 'session'] as const,
    me: () => [...KEY.currentUser, 'me'] as const,
  },
} as const;
