import {
  TicketOriginEnum,
  TicketSourceFilterEnum,
  ImpactScopeEnum,
} from "@/shared/enums/ticket/ticket.enum";
import type { StatusTone } from "@/shared/theme/statusColors";

/**
 * Nguồn tạo ticket, gộp từ nhiều field thành MỘT phân loại dùng chung.
 *
 * `origin` một mình không đủ: ba luồng tự động khác nhau (sự cố môi trường, bảo trì
 * định kỳ, cascade risk) đều ghi Origin = System, nên lọc/gắn nhãn theo mỗi origin
 * sẽ gộp cả ba làm một.
 *
 * Thứ tự kiểm tra ở đây phải KHỚP với FilterBySource bên BE — lệch thứ tự thì một
 * ticket sẽ hiện nhãn này mà lại rơi vào bộ lọc kia.
 */
interface SourceInput {
  origin: TicketOriginEnum;
  environmentalIncidentId?: string | null;
  isPeriodicMaintenance?: boolean;
  impactScope?: ImpactScopeEnum | null;
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
  // Field chuyên biệt xét TRƯỚC origin: đây là dấu hiệu duy nhất tách ba luồng System.
  //
  // isPeriodicMaintenance do BE tính từ PeriodicMaintenanceDueAtUtc, KHÔNG phải từ
  // PeriodicMaintenanceSourceTicketId — field đó luôn trống từ khi lịch bảo trì chuyển
  // sang tầng tài sản, dùng nó thì cờ vĩnh viễn false.
  //
  // Su co moi truong den tu HAI duong, khac nhau o cho ai phat hien:
  //  - `environmentalIncidentId` — thiet bi tu bao (khoi, ro khi, ngap).
  //  - `AutoFromAlert` + `impactScope = Site` — backend cham so do ambient vuot nguong
  //    `AmbientThresholdConfig` (nhiet do, do am, gas, combo). Nhom nay khong di qua
  //    EnvironmentalIncident nen khong co id, truoc day roi xuong nhanh AutoFromAlert va bi
  //    dan nhan "AI predicted" — mot ticket nhiet do cua CA SITE hien y het ticket cua MOT
  //    vien pin, va khong bao gio hien ra khi loc theo Environmental.
  // Chi luong auto-from-alert dung Origin nay; cascade-risk / bao tri / incident deu la
  // System — nen cap dieu kien nay la duy nhat. Phai KHOP voi FilterBySource ben BE.
  let key: TicketSourceFilterEnum;
  if (
    t.origin === TicketOriginEnum.AutoFromEnvironment ||
    // Dòng CŨ tạo trước khi có origin riêng: lưới an toàn nếu migration backfill chưa chạy.
    t.environmentalIncidentId ||
    (t.origin === TicketOriginEnum.AutoFromAlert &&
      t.impactScope === ImpactScopeEnum.Site)
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
