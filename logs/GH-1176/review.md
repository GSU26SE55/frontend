## BAO CAO CODE REVIEW — dev (GH-1176) — 2026-08-12 (lan 3)
### Scope: FE (Web)
### Effort: Standard (re-review sau fix Critical + HoldDialog warning)

### TOM TAT
Critical bug (escalate-reject goi sai API) da duoc fix dung. Tat ca warnings truoc da resolve.
Con 2 warnings nho mang tinh cosmetic/maintenance — khong block ship.

### PHAN TICH

WARNING: src/features/manager/components/ticket/EscalateDialog.tsx:74,129
  DialogTitle van hien "Escalate", submit button van la "Escalate".
  Dialog nay gio dung de APPROVE escalation request (khong con la force-escalate).
  Nhan hieu cu gay nham lan cho Manager khi bam "Approve escalation" nhung thay title "Escalate".
  Fix: Doi DialogTitle thanh "Approve escalation request", button thanh "Approve".

WARNING: src/features/manager/constants/messages.ts:5
  MANAGER_MESSAGES.ticket.triaged = "Ticket triaged" la orphaned constant.
  Triage approval da bi xoa, khong con code nao goi key nay.
  Fix: Xoa key "triaged" de tranh confusion cho dev sau.

PASS: EscalateRejectDialog.tsx — tao moi dung: useEscalateRejectTicket + RejectPayload + rejectSchema
PASS: TicketDetailPage.tsx (manager) — escalate-approve -> EscalateDialog, escalate-reject -> EscalateRejectDialog
PASS: useEscalateRejectTicket — RejectPayload, dung endpoint ESCALATE_REJECT, onError handleErrorApi, invalidate dung query keys
PASS: handleHoldSubmit (staff TicketDetailPage:211) — rescheduledStartAtUtc.toISOString() da fix
PASS: AssignDialog + ReassignDialog — scheduledStartAtUtc.toISOString() da fix
PASS: TriageDialog.tsx — da xoa, khong con caller nao
PASS: Tat ca items tu review lan 1-2 (enums, services, hooks, schemas, endpoints) giu nguyen
PASS: TSC + ESLint: 0 error, 0 warning

### RUI RO & LUU Y
- EscalateDialog label mislabel la UX issue, khong phai functional bug — Manager van approve dung.
- "triaged" orphaned constant khong gay loi runtime.

### KET LUAN
PASS — Do tin: Cao
Khong con Critical. 2 warnings nho khong block ship. Co the fix truoc hoac sau khi merge.
