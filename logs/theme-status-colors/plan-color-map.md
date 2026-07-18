# Bảng map enum → nhóm màu semantic

5 nhóm token: `ok`(xanh lá) · `info`(xanh dương) · `p3`(vàng) · `p2`(cam) · `p1`(đỏ) · `muted`(xám).
Fallback ngoài map → `muted`.

## TicketStatusEnum (string)
| Member | Màu |
|---|---|
| New, Open, Approved, Assigned, InProgress, ClosedPendingRate | info |
| WaitingCustomer, WaitingParts, WaitingOnsiteSchedule | p3 |
| Resolved, Closed | ok |
| Escalated, ClosedRejected, Incident | p1 |

## TicketPriorityEnum (đã đúng — giữ token cũ)
P1Critical→p1 · P2High→p2 · P3Normal→p3

## SlaTimerStatusEnum
Running→info · Paused→p3 · Met→ok · Breached→p1

## AlertSeverityEnum (int)
Info(1)→info · Warning(2)→p2 · Critical(3)→p1

## AlertStatusEnum (int)
Open(1)→p2 · Acknowledged(2)→info · Merged(3)→muted · Resolved(4)→ok

## EnvironmentalIncidentStatusEnum (int)
Open(1)→p1 · Acknowledged(2)→p2 · Resolved(3)→ok · FalseAlarm(4)→muted

## IotDeviceStatusEnum (int)
Pending(1)→p3 · Active(2)→ok · Offline(3)→p2 · Disabled(4)→p1 · Decommissioned(5)→muted

## KbArticleStatusEnum (string)
Draft→muted · PendingReview→p3 · Published→ok · Archived→muted

## BatteryStatusEnum (int) — cho BatteryAssetTable
Active(1)→ok · Inactive(2)→muted · Decommissioned(3)→muted

## NotificationStatusEnum (int) — cho AlertsPage getStatusVariant
(agent chưa liệt kê chi tiết — sẽ đọc file khi implement) Read→muted · Sent→info · Failed→p1 · Pending→p3

## CascadeRiskLevelName (string)
Low→ok · Medium→p2 · High→p1

## TrendDir (string) — context-dependent, cho phép đảo polarity
mặc định Up→ok · Down→p1 · Flat→muted (KpiCard truyền polarity nếu cần đảo)

---
Ghi chú kỹ thuật:
- Enum có cả int-value và string-value → map keyed theo chính value của enum, tách map riêng từng enum (nhiều member trùng tên `Open/Active/Resolved` khác value).
- Badge render qua inline `style={{ color: fg, backgroundColor: bg, borderColor: border }}` giống mẫu TicketPriorityBadge đã đúng.
