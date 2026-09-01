import {
  TicketOriginEnum,
  TicketSourceFilterEnum,
} from "@/shared/enums/ticket/ticket.enum";
import type { StatusTone } from "@/shared/theme/statusColors";

/**
 * Nguồn tạo ticket, gộp từ nhiều field thành MỘT phân loại dùng chung.
 *
 * Source là NGUỒN GỐC BẤT BIẾN của ticket — ai/cái gì đẻ ra nó — nên chỉ được suy ra
 * từ các field cố định lúc tạo: `origin`, `environmentalIncidentId`, cờ bảo trì định kỳ.
 * KHÔNG dùng `impactScope`: đó là field động, Manager sửa được qua Re-prioritize, dùng nó
 * thì một ticket lỗi pin bị Manager đổi scope sang Site sẽ đột nhiên hiện "Environmental".
 *
 * `origin` một mình gần đủ; chỉ còn `System` bị hai luồng dùng chung (bảo trì định kỳ,
 * cascade risk) nên phải tách bằng cờ `isPeriodicMaintenance`.
 *
 * Điều kiện ở đây phải KHỚP 1:1 với FilterBySource bên BE (TicketQueryHelper.FilterBySource)
 * — lệch thì một ticket hiện nhãn này mà lại rơi vào bộ lọc kia.
 */
interface SourceInput {
  origin: TicketOriginEnum;
  environmentalIncidentId?: string | null;
  isPeriodicMaintenance?: boolean;
}

export interface TicketSourceInfo {
  key: TicketSourceFilterEnum;
  label: string;
  tone: StatusTone;
}

export const TICKET_SOURCE_LABEL: Record<TicketSourceFilterEnum, string> = {
  [TicketSourceFilterEnum.Customer]: "Customer",
  [TicketSourceFilterEnum.AiPredicted]: "AI predicted",
  [TicketSourceFilterEnum.Environmental]: "Environmental",
  [TicketSourceFilterEnum.PeriodicMaintenance]: "Maintenance",
};

const SOURCE_TONE: Record<TicketSourceFilterEnum, StatusTone> = {
  // Người tạo — không phải cảnh báo, giữ trung tính.
  [TicketSourceFilterEnum.Customer]: "muted",
  // Máy tạo: bất thường từ pin và sự cố môi trường là cảnh báo, bảo trì thì không.
  [TicketSourceFilterEnum.AiPredicted]: "p2",
  [TicketSourceFilterEnum.Environmental]: "p1",
  [TicketSourceFilterEnum.PeriodicMaintenance]: "info",
};

export function getTicketSource(t: SourceInput): TicketSourceInfo {
  // Sự cố môi trường đến từ HAI đường, cùng một Source:
  //  - `AutoFromEnvironment` — BE chấm số đo ambient vượt ngưỡng AmbientThresholdConfig
  //    (nhiệt độ, độ ẩm, gas, combo), HOẶC thiết bị tự báo (khói, rò khí, ngập).
  //  - `environmentalIncidentId != null` — lưới an toàn cho DÒNG CŨ tạo trước khi có
  //    origin `AutoFromEnvironment` (migration backfill lo phần còn lại).
  //
  // KHÔNG còn nhánh `AutoFromAlert + impactScope === Site`: `impactScope` là field động
  // (Manager sửa qua Re-prioritize) nên không được dùng để suy ra nguồn gốc cứng. BE
  // FilterBySource cũng đã bỏ điều kiện này.
  //
  // isPeriodicMaintenance do BE tính từ PeriodicMaintenanceDueAtUtc, KHÔNG phải từ
  // PeriodicMaintenanceSourceTicketId — field đó luôn trống từ khi lịch bảo trì chuyển
  // sang tầng tài sản, dùng nó thì cờ vĩnh viễn false.
  let key: TicketSourceFilterEnum;
  if (
    t.origin === TicketOriginEnum.AutoFromEnvironment ||
    t.environmentalIncidentId
  ) {
    key = TicketSourceFilterEnum.Environmental;
  } else if (t.isPeriodicMaintenance) {
    key = TicketSourceFilterEnum.PeriodicMaintenance;
  } else if (
    t.origin === TicketOriginEnum.AutoFromAlert ||
    t.origin === TicketOriginEnum.System
  ) {
    // AI dự đoán: alert bất thường do AI module chấm, hoặc điểm cascade risk cao
    // (phần System còn lại sau khi đã loại môi trường và bảo trì ở trên).
    key = TicketSourceFilterEnum.AiPredicted;
  } else {
    // Người tạo — khách tự tạo hoặc staff tạo hộ, UI không tách hai loại này.
    key = TicketSourceFilterEnum.Customer;
  }

  return { key, label: TICKET_SOURCE_LABEL[key], tone: SOURCE_TONE[key] };
}
