# TEST REPORT — GH-28 — 2026-05-20
### Scope: FE
### Môi trường: local

## TÓM TẮT
Auth Profile + Session Management data layer — services + hooks, không có UI. Automated checks PASS.

| Test case | Input | Expected | Actual | Status |
|-----------|-------|----------|--------|--------|
| tsc --noEmit | src/ | 0 errors | 0 errors | ✅ PASS |
| eslint --max-warnings=0 | src/ | 0 warnings | 0 warnings | ✅ PASS |
| npm run build | — | success | ✅ built | ✅ PASS |
| useSessions staleTime | config | staleTime: 0, refetchOnWindowFocus: true | confirmed | ✅ PASS |
| useRevokeAllSessions invalidation | onSuccess | [KEY.sessions] invalidated | array-wrapped ✅ | ✅ PASS |
| profile.service imports | grep | no hardcoded URL | ENDPOINTS.AUTH.ME | ✅ PASS |
| staff.service imports | grep | no hardcoded URL | ENDPOINTS.STAFF.* | ✅ PASS |
| AccountDto type | tsc check | profile?: AccountProfileDto, staffProfile?: StaffProfileDto | nullable confirmed | ✅ PASS |
| StaffAssignmentProfileDto location | import | shared/types/account.types | confirmed cross-feature | ✅ PASS |
| 8 hooks exported | import check | useProfile, useUpdateProfile, useUpdateAvatar, useSessions, useRevokeSession, useRevokeAllSessions, useStaffList, useStaffAssignmentProfile | all exist | ✅ PASS |

## Bugs tìm được
Không có.

## KẾT LUẬN
**PASS** — Độ tự tin: **Cao**
