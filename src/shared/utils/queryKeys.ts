export const KEY = {
  currentUser: 'currentUser',
} as const;

export const QUERY_KEY = {
  currentUser: {
    session: () => [KEY.currentUser, 'session'] as const,
  },
} as const;