import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type { TicketDTO } from "@/shared/types/ticket/ticket.types";
import {
  TicketCategoryEnum,
  TicketOriginEnum,
} from "@/shared/enums/ticket/ticket.enum";

const CATEGORY_LABELS: Record<string, string> = {
  [TicketCategoryEnum.Charging]: "Sạc",
  [TicketCategoryEnum.Overheat]: "Quá nhiệt",
  [TicketCategoryEnum.NoPower]: "Mất điện",
  [TicketCategoryEnum.Performance]: "Hiệu năng",
  [TicketCategoryEnum.Repair]: "Sửa chữa",
  [TicketCategoryEnum.Other]: "Khác",
};

const ORIGIN_LABELS: Record<string, string> = {
  [TicketOriginEnum.ManualByCustomer]: "Khách hàng tạo",
  [TicketOriginEnum.AutoFromAlert]: "Tự động từ cảnh báo",
  [TicketOriginEnum.CreatedByStaff]: "Nhân viên tạo",
  [TicketOriginEnum.System]: "Hệ thống tạo",
};

const EMPTY = "—";

const fmtDate = (v?: string | null) =>
  v ? format(new Date(v), "dd/MM/yyyy HH:mm", { locale: vi }) : EMPTY;

export interface CompareRow {
  label: string;
  source: string;
  target: string;
  isDiff: boolean;
  /** Khác pin / khác khách hàng → dấu hiệu gộp nhầm, tô đỏ thay vì vàng. */
  isCritical?: boolean;
}

/**
 * Dựng các dòng đối chiếu giữa ticket nguồn (bị gộp) và ticket đích (giữ lại).
 *
 * `customerId` là GUID nên không đọc được — truyền tên khách hàng lấy từ battery asset
 * để hiển thị; việc SO SÁNH vẫn dựa trên `customerId` để không phụ thuộc dữ liệu đã fetch xong.
 */
export function buildCompareRows(
  source: TicketDTO,
  target: TicketDTO,
  customerNames?: { source?: string | null; target?: string | null },
): CompareRow[] {
  const row = (
    label: string,
    a: string,
    b: string,
    isCritical = false,
  ): CompareRow => ({
    label,
    source: a || EMPTY,
    target: b || EMPTY,
    isDiff: a !== b,
    isCritical,
  });

  return [
    row("Mã ticket", source.code, target.code),
    row(
      "Pin (serial)",
      source.batterySerialNumber ?? source.batteryAssetId ?? "",
      target.batterySerialNumber ?? target.batteryAssetId ?? "",
      (source.batteryAssetId ?? "") !== (target.batteryAssetId ?? ""),
    ),
    {
      label: "Khách hàng",
      // Hiển thị tên (nếu đã tải xong), nhưng so sánh theo customerId — tên có thể
      // chưa fetch xong hoặc trùng tên giữa 2 khách hàng khác nhau.
      source: customerNames?.source || source.customerId || EMPTY,
      target: customerNames?.target || target.customerId || EMPTY,
      isDiff: source.customerId !== target.customerId,
      isCritical: true,
    },
    row(
      "Danh mục",
      CATEGORY_LABELS[source.category] ?? source.category,
      CATEGORY_LABELS[target.category] ?? target.category,
    ),
    // Trạng thái đã hiển thị dạng badge ở 2 thẻ tiêu đề — không lặp raw enum ở đây.
    row(
      "Mức ưu tiên",
      source.priority ?? "Chưa triage",
      target.priority ?? "Chưa triage",
    ),
    row(
      "Nguồn tạo",
      ORIGIN_LABELS[source.origin] ?? source.origin,
      ORIGIN_LABELS[target.origin] ?? target.origin,
    ),
    row(
      "Phát hiện lúc",
      fmtDate(source.detectedAt),
      fmtDate(target.detectedAt),
    ),
    row("Ngày tạo", fmtDate(source.createdAt), fmtDate(target.createdAt)),
  ];
}
