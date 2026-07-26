// Re-export từ shared — nguồn thật ở shared/enums/battery/battery.enum.ts.
// Giữ file này để các import admin cũ (schema/form/types) không phải đổi path.
export {
  WarrantyStatusEnum,
  ChargingStateEnum,
  BatteryChemistryEnum,
} from "@/shared/enums/battery/battery.enum";
