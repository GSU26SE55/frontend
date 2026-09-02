import { useEffect, useState } from "react";
import { liveRemainingPercent } from "@/shared/lib/sla";
import type { SlaTimerStatusEnum } from "@/shared/enums/ticket/ticket.enum";

type SlaTimerLike =
  | {
      status?: SlaTimerStatusEnum | null;
      remainingPercent: number;
      startedAt?: string | null;
      dueAt?: string | null;
    }
  | null
  | undefined;

/**
 * % SLA còn lại để vẽ thanh progress — chạy realtime (tick mỗi giây) cùng nhịp với text
 * countdown.
 *
 * Tính theo cửa sổ thời gian thật của chính timer: `(dueAt - now) / (dueAt - startedAt)`.
 * Xem `liveRemainingPercent` trong `shared/lib/sla.ts` — điểm mấu chốt là KHÔNG chia cho
 * `slaWorkingHours` (budget theo priority), nên khi ticket được escalate (đổi priority,
 * giữ nguyên deadline) thanh bar không nhảy.
 *
 * Trả 0 khi không có timer.
 */
export function useLiveSlaPercent(slaTimer: SlaTimerLike): number {
  const isRunning =
    slaTimer != null && slaTimer.startedAt != null && slaTimer.dueAt != null;

  const [nowMs, setNowMs] = useState(() => Date.now());
  const percent = slaTimer ? liveRemainingPercent(slaTimer, nowMs) : 0;
  // Ở 0% là đã breach — bar không giảm thêm được nữa, nên dừng tick thay vì re-render
  // mỗi giây cho mọi ticket đã quá hạn trong danh sách.
  const isExhausted = percent <= 0;
  useEffect(() => {
    if (!isRunning || isExhausted) return;
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isRunning, isExhausted]);

  return percent;
}
