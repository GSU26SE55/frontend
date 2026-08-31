// Mức vi phạm ngưỡng của MỘT số đo — soi gương đúng luật BE (`AnomalyRules.Detect`).
//
// Trước đây mỗi màn hình tự chế dải cảnh báo riêng: card Realtime cảnh báo từ
// `temperatureMax - 10`, bảng lịch sử cảnh báo trong biên 10% của [min,max]. Cả hai đều
// nhuộm màu ở vùng mà engine cảnh báo KHÔNG hề coi là vi phạm — pin thật nằm dưới ngưỡng
// đã cấu hình vẫn nháy vàng liên tục, mà không có Alert nào tương ứng.
//
// Trả `null` = loại pin chưa cấu hình ngưỡng đó → caller để trung tính, KHÔNG đoán mặc định.
export type ThresholdLevel = "critical" | "warning" | "ok" | null;

type Num = number | null | undefined;

// Mọi so sánh chốt ở 2 CHỮ SỐ THẬP PHÂN — đúng bằng độ chính xác thật của dữ liệu: cả số đo
// (`sensor_readings.voltage numeric(6,2)`, `current numeric(8,2)`, `temperature numeric(5,2)`)
// lẫn ngưỡng (`threshold_configs` cùng kiểu) đều chỉ có tới 2 chữ số.
//
// FE cũng hiển thị 2 chữ số, nên con số trên màn hình luôn giải thích được màu của chính nó.
// Cắt hiển thị xuống 1 chữ số thì hai dòng cùng hiện "26.9" lại ra hai màu khác nhau; còn chấm
// màu trên số đã cắt thì bỏ sót vi phạm mà engine cảnh báo BE vẫn bắt. Giữ cả hai ở 2 chữ số.
//
// Chốt 2 chữ số cũng khử luôn sai số nhị phân ở biên tính toán (`max + 5`, `min - 5`), thứ có
// thể lật kết quả của một phép so sánh ngặt ngay tại đúng mốc ngưỡng.
const round2 = (v: number) => Math.round(v * 100) / 100;

// AnomalyRules.OverheatCriticalDeltaC / UndertempCriticalDeltaC — vượt ngưỡng quá 5°C là Critical.
const CRITICAL_DELTA_C = 5;

export function temperatureLevel(value: number, min: Num, max: Num): ThresholdLevel {
  if (min == null && max == null) return null;
  const v = round2(value);
  if (max != null && v > round2(max))
    return v > round2(max + CRITICAL_DELTA_C) ? "critical" : "warning";
  if (min != null && v < round2(min))
    return v < round2(min - CRITICAL_DELTA_C) ? "critical" : "warning";
  return "ok";
}

// LowSoc: dưới critical → Critical, dưới warning → Warning. Cả hai đều là so sánh NGẶT (<),
// giống BE: SOC đúng bằng ngưỡng critical vẫn chỉ là Warning.
export function socLevel(value: number, warning: Num, critical: Num): ThresholdLevel {
  if (warning == null || critical == null) return null;
  const v = round2(value);
  if (v < round2(critical)) return "critical";
  if (v < round2(warning)) return "warning";
  return "ok";
}

// Overvoltage / Undervoltage: BE luôn xếp Critical, không có dải warning.
export function voltageLevel(value: number, min: Num, max: Num): ThresholdLevel {
  if (min == null || max == null) return null;
  const v = round2(value);
  return v > round2(max) || v < round2(min) ? "critical" : "ok";
}

// AbnormalCharging (dòng sạc vượt trần) / RapidDischarge (dòng xả vượt trần) — cũng luôn Critical.
export function currentLevel(value: number, maxCharge: Num, maxDischarge: Num): ThresholdLevel {
  if (maxCharge == null || maxDischarge == null) return null;
  const v = round2(value);
  if (v > round2(maxCharge)) return "critical";
  if (v < 0 && round2(Math.abs(v)) > round2(maxDischarge)) return "critical";
  return "ok";
}
