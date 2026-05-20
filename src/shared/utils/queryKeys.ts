export const KEY = {
  currentUser:  'currentUser',
  loginHistory: 'loginHistory',
  profile:      'profile',
  staff:        'staff',
  sessions:     'sessions',
  sites:        'sites',
  files:          'files',
  batteryAssets:  'batteryAssets',
  batteryTypes:   'batteryTypes',
  batteryGroups:  'batteryGroups',
  admin: {
    accounts:    ['admin', 'accounts']    as const,
    staff:       ['admin', 'staff']       as const,
    roles:       ['admin', 'roles']       as const,
    permissions: ['admin', 'permissions'] as const,
    auditLogs:   ['admin', 'auditLogs']   as const,
  },
} as const;

export const QUERY_KEY = {
  currentUser: {
    session: () => [KEY.currentUser, 'session'] as const,
  },
  loginHistory: {
    list: (params?: object) => [KEY.loginHistory, 'list', params] as const,
  },
  profile: {
    me: () => [KEY.profile, 'me'] as const,
  },
  staff: {
    list:   (skill?: string) => [KEY.staff, 'list', skill]     as const,
    detail: (id: string)     => [KEY.staff, 'detail', id]      as const,
  },
  sessions: {
    me: (activeOnly?: boolean) => [KEY.sessions, 'me', activeOnly] as const,
  },
  sites: {
    list:      (params?: object) => [KEY.sites, 'list', params]                  as const,
    detail:    (id: string)      => [KEY.sites, 'detail', id]                    as const,
    dashboard: (id: string)      => [KEY.sites, 'dashboard', id]                 as const,
    assets:    (siteId: string, params?: object) => [KEY.sites, 'assets', siteId, params] as const,
  },
  batteryAssets: {
    list:     (params?: object) => [KEY.batteryAssets, 'list', params]     as const,
    detail:   (id: string)      => [KEY.batteryAssets, 'detail', id]       as const,
    realtime: (id: string)      => [KEY.batteryAssets, 'realtime', id]     as const,
  },
  batteryTypes: {
    list:   (params?: object) => [KEY.batteryTypes, 'list', params]  as const,
    detail: (id: string)      => [KEY.batteryTypes, 'detail', id]    as const,
  },
  batteryGroups: {
    list:   (params?: object) => [KEY.batteryGroups, 'list', params] as const,
    detail: (id: string)      => [KEY.batteryGroups, 'detail', id]   as const,
  },
  files: {
    metadata:    (id: string) => [KEY.files, 'metadata', id]     as const,
    presignedUrl: (id: string) => [KEY.files, 'presigned-url', id] as const,
  },
  admin: {
    accounts: {
      list:         (params?: object) => [...KEY.admin.accounts, 'list', params],
      detail:       (id: string)      => [...KEY.admin.accounts, 'detail', id],
      sessions:     (id: string)      => [...KEY.admin.accounts, 'sessions', id],
      loginHistory: (id: string, params?: object) =>
                      [...KEY.admin.accounts, 'loginHistory', id, params],
    },
    staff: {
      profile: (accountId: string) => [...KEY.admin.staff, 'profile', accountId],
    },
    roles: {
      list:        (params?: object) => [...KEY.admin.roles, 'list', params],
      detail:      (id: string)      => [...KEY.admin.roles, 'detail', id],
      permissions: (roleId: string)  => [...KEY.admin.roles, 'permissions', roleId],
    },
    permissions: {
      list: (module?: string) => [...KEY.admin.permissions, 'list', module],
    },
    auditLogs: {
      list: (params?: object) => [...KEY.admin.auditLogs, 'list', params],
    },
  },
} as const;
