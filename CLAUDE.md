# Frontend (Web) — GSU26SE55

> Repo này là Web App (ReactJS) của hệ thống Solar Battery Maintenance.
> Context dự án đầy đủ: `.claude/CLAUDE.md` | Rules đầy đủ: `.claude/rules/tech/fe.md`

---

## ⚠️ Critical — hay sai nhất

- **NO** API calls trong component — luôn qua `services/` → TanStack Query hook
- `useState` chỉ cho UI state thuần (modal open/close, tab active)
- Zustand chỉ cho auth session — **KHÔNG** dùng làm server state cache
- `features/admin` **KHÔNG** import từ `features/manager` — features độc lập (ESLint `no-restricted-imports` enforce)
- `shared/` là nơi **DUY NHẤT** chứa code reuse cross-feature
- Token: cookie only (`js-cookie`) — **KHÔNG** dùng `localStorage`
- **KHÔNG** tạo Axios instance mới — dùng `shared/lib/axios.ts`

**TanStack Query defaults** (cấu hình trong `App.tsx`):
```tsx
// staleTime: 2 phút | gcTime: 10 phút | retry: 1 | refetchOnWindowFocus: false
// Override per-query: tickets → staleTime:30s | SLA countdown → staleTime:0 + refetchInterval:30s | battery config → 10 phút
```

---

## Cấu trúc src/

```
src/
├── config/env.ts              ← Zod-validate env khi boot
├── router/                    ← createBrowserRouter, ProtectedRoute, RoleRoute
├── features/                  ← auth | admin | manager | staff (độc lập nhau)
│   └── {feature}/
│       ├── pages/             ← {Name}Page.tsx
│       ├── components/        ← {Name}.tsx (PascalCase)
│       ├── hooks/             ← use{Name}.ts (TanStack Query)
│       ├── services/          ← {name}.service.ts
│       ├── schemas/           ← {name}.schema.ts (Zod)
│       └── types/             ← {name}.types.ts
└── shared/
    ├── components/ui/         ← shadcn (generated) — vị trí thực tế: src/components/ui/ (không phải shared/)
    ├── components/layout/     ← AppLayout, AuthLayout, Sidebar, Header
    ├── lib/axios.ts           ← Axios instance + interceptors
    ├── lib/errors.ts          ← HttpError, EntityError, handleErrorApi
    ├── stores/sessionStore.ts ← Zustand auth session
    ├── utils/queryKeys.ts     ← KEY (root) + QUERY_KEY (factories) cho TanStack Query
    └── types/                 ← api.types.ts, common.types.ts
```

---

## Workflow

```
/kltn-implement [issue-number] → plan.md → approve → code → /kltn-reviewcode → /kltn-test → /kltn-ship [issue-number]
```
