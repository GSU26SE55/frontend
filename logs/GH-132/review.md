## BÁO CÁO CODE REVIEW — feat/GH-132-dashboard-server-aggregate — 2026-07-07
### Scope: FE (Web)
### Effort: Deep

### TÓM TẮT
Code GH-132 (đấu nối 8 endpoint aggregate A–H + refactor helper) đúng kiến trúc, `tsc --noEmit` + `eslint --max-warnings=0` + `npm run build` đều PASS. **Vấn đề lớn nhất KHÔNG nằm ở code mà ở phạm vi commit**: working tree đang lẫn nhiều thay đổi của feature khác (voice message / typing indicator / comment thread / docs) — phải tách khi ship, nếu không PR sẽ sai scope.

### PHÂN TÍCH

✅ **Pass:**
- Kiến trúc: API call qua `services/` → hook TanStack Query (`useDashboardStats.ts` + `dashboardStats.service.ts`), không fetch trong component.
- File đặt đúng chỗ: infra dùng chéo Admin+Manager (`dashboardStats.*`, `BatteryDistributionPanels`, `site.utils`, `ticket.utils`) đặt ở `shared/`; không có `features/X` import `features/Y`.
- `queryKey` dùng `QUERY_KEY` factory (4 root mới); `RefreshButton` invalidate bằng `KEY` root — không inline string.
- Endpoint qua `ENDPOINTS` (4 path mới), không hardcode URL.
- Loading/error: mỗi hook có `isLoading`; card render skeleton; guard `?? 0`/`?.` cho data undefined khắp nơi.
- G (KB 422): tái dùng `useAddTicketKbRef.onError → handleErrorApi` (không tự toast trong hook).
- Không `console.log`, không tạo Axios instance mới, không dùng localStorage.
- Cleanup: xoá `DashboardStatsSection` + `dashboard.utils.ts` (orphan), tách helper đúng domain — không để dead code.

🟡 **Warning:**
- `staff/components/TicketKbReferencesPanel.tsx` + `manager/...` — `refType` khởi tạo theo prop `afterResolveOnly` bằng `useState` (chạy 1 lần). Nếu ticket chuyển sang **Resolved trong lúc panel "Gắn" đang mở** với `refType=ConsultedDuringResolve`, `refTypeOptions` tự cập nhật nhưng `refType` state vẫn giữ Consulted (không còn trong options) → bấm Thêm gửi Consulted → BE trả 422. Xác suất thấp. Gợi ý: `useEffect` reset `refType` về `GeneratedAfterResolve` khi `afterResolveOnly && !refTypeOptions.includes(refType)`.
- `staff/pages/SlaMonitorPage.tsx:44` — list `useStaffTickets({slaOpen, sortBy, pageSize:100})` không có phân trang, trong khi KPI "Đang theo dõi" = `slaMonitoredCount` (B) đếm toàn bộ. Nếu 1 staff có >100 ticket SLA mở, bảng ẩn dòng thứ 101+ mà không báo. Edge case hiếm; cân nhắc raise pageSize hoặc thêm ghi chú "hiển thị 100 gần breach nhất".
- `manager/pages/DashboardPage.tsx` pipeline — "Hoàn tất" (đúng chủ đích) KHÔNG gộp `ClosedRejected`, nên tổng các bar < `${totalTickets} ticket theo giai đoạn` ở desc khi có ticket bị từ chối. Đúng nghiệp vụ nhưng desc hơi lệch; chấp nhận được (hoặc đổi desc thành "đang hoạt động").

ℹ️ **Note (không chặn):**
- Dashboard stats query lỗi → degrade âm thầm về 0/skeleton, không có error banner (Admin/Manager). Chấp nhận được cho dashboard (tốt hơn crash), nhưng nếu muốn có thể thêm `isError` banner.
- SLA Monitor dùng chung query B (`useStaffTicketDashboardStats`, staleTime 60s) với Staff Dashboard. Trang giám sát SLA có thể muốn tươi hơn (refetchInterval) — tùy chọn, không bắt buộc.

### RỦI RO & LƯU Ý
- 🔴 **BLOCKING cho `/kltn-ship`** — Working tree lẫn thay đổi KHÔNG thuộc GH-132 (đã có sẵn trước khi tạo branch):
  - Modified: `TicketCommentThread.tsx`, `AddCommentForm.tsx` (admin/manager/staff), `AdminTicketDetailPage.tsx`, `*ticket*.schema.ts` (×3), `index.css`, `docs/api-*.md`; và **một phần** của `staff/manager TicketDetailPage.tsx` (TypingIndicator, sidebar collapse) — lẫn cùng file với đổi H của GH-132.
  - Untracked: `file-storage/hooks/useAudioAttachment.ts`, `TypingIndicator.tsx`, `VoiceMessagePlayer.tsx`.
  → Khi ship phải **selective-stage CHỈ file GH-132**, hoặc tách phần voice/comment sang commit/PR riêng. `git add -A` sẽ đóng gói nhầm scope, vi phạm "Surgical Changes" và có thể vỡ CI của feature chưa xong.
  → File GH-132 cần stage: 3 DashboardPage, SlaMonitorPage, AccountSettingsPage, 2 TicketKbReferencesPanel, 2 TicketDetailPage (chỉ hunk `afterResolveOnly`/`canAddKb`), staff `ticket.service.ts` + `staff-ticket.types.ts`, `AnalyticsDashboard.tsx`, `account.types.ts`, `kb.types.ts`, `endpoints.ts`, `queryKeys.ts`, xoá `DashboardStatsSection.tsx` + `dashboard.utils.ts`, và các file mới `dashboardStats.*`, `useDashboardStats.ts`, `BatteryDistributionPanels.tsx`, `site.utils.ts`, `ticket.utils.ts`.
- 2 TicketDetailPage (staff/manager) chứa cả hunk GH-132 (H) lẫn hunk feature khác → cần `git add -p` để stage đúng hunk.

### FIX SAU REVIEW (2026-07-07)
- ✅ W1 KB refType stale → derived `effectiveRefType` (staff+manager panel), tránh `set-state-in-effect`.
- ✅ W2 SLA Monitor → note "Hiển thị X/Y ticket" khi bảng cap 100.
- ✅ W3 Manager pipeline → desc dùng `pipelineTotal` (khớp tổng bar).
- ✅ Runtime bug (screenshot): Admin "Sức khỏe site" avg 85% (C) ≠ per-site 100% (client) → `avgHealth` tính client mean cho khớp danh sách.
- ✅ Runtime (screenshot): KB selector mặc định category ticket ("Lỗi sạc") → 0 kết quả → bỏ `defaultCategory` khỏi `KbArticleSelector` (mặc định "Tất cả"; giữ `initialCategory` cho editor). *(hành vi có sẵn trước GH-132, fix theo yêu cầu vì cùng luồng KB.)*
- Verify lại: tsc + eslint --max-warnings=0 + build đều PASS.

### KẾT LUẬN
**PASS** (chất lượng code GH-132) — Độ tự tin: **Cao**.
Không có Critical trong code GH-132; tsc/eslint/build sạch. Điều kiện bắt buộc trước ship: **tách scope commit** (xử lý ở `/kltn-ship` bằng selective staging). 3 Warning đều edge-case/tùy chọn, không chặn.
