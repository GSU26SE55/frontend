import { ImportEntityTypeEnum } from "@/shared/enums/import/import.enum";

/**
 * Nhãn tiếng Việt cho từng loại dữ liệu nhập.
 *
 * Để ở file riêng chứ không nằm cùng file component: quy tắc fast-refresh của dự án đòi một file
 * component chỉ được xuất ra component. Xuất kèm hằng số khiến toàn bộ trang phải nạp lại thay vì
 * cập nhật tại chỗ mỗi lần sửa.
 */
export const IMPORT_ENTITY_LABEL: Record<ImportEntityTypeEnum, string> = {
  [ImportEntityTypeEnum.Customer]: "Khách hàng",
  [ImportEntityTypeEnum.Site]: "Site",
  [ImportEntityTypeEnum.BatteryAsset]: "Pin",
};
