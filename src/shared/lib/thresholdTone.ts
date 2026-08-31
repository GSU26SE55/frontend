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
// Chốt 2 chữ số cũng khử luôn sai số nhị phân ở biên, thứ có thể lật kết quả của một phép so
// sánh ngặt ngay tại đúng mốc ngưỡng.
const round2 = (v: number) => Math.round(v * 100) / 100;

// NHIỆT ĐỘ / ĐIỆN ÁP — thang MỘT CHIỀU hai nấc: `min` là mốc Warning, `max` là mốc Critical.
// Cả hai là số Admin đặt; không còn hằng số ±5 nào suy ra ở giữa (hằng cũ khớp
// `AnomalyRules.OverheatCriticalDeltaC`, BE đã bỏ — giữ ở FE thì màu trên màn hình mô tả một
// luật engine cảnh báo không còn chạy).
//
// ⚠️ Không phải dải an toàn: phía THẤP không còn rule nào bên BE (`Undertemp`/`Undervoltage` đã
// gỡ), nên ở đây cũng không được tô màu cho số đo thấp — tô là hứa một cảnh báo không tồn tại.
// So sánh BAO GỒM mốc: đạt tới ngưỡng là đã vi phạm. Admin đặt 30 nghĩa là "từ 30 trở lên báo
// cho tôi". Khớp `AnomalyRules.Detect` — nếu FE dùng `>` còn BE dùng `>=` thì số đo đúng bằng
// ngưỡng sẽ đẻ alert mà ô trên màn hình vẫn xanh.
function ascendingLevel(value: number, warning: Num, critical: Num): ThresholdLevel {
  if (warning == null && critical == null) return null;
  const v = round2(value);
  if (critical != null && v >= round2(critical)) return "critical";
  if (warning != null && v >= round2(warning)) return "warning";
  return "ok";
}

export function temperatureLevel(value: number, min: Num, max: Num): ThresholdLevel {
  return ascendingLevel(value, min, max);
}

// LowSoc — cùng luật nhưng chiều ngược: SOC THẤP mới là vi phạm. Cũng bao gồm mốc, giống BE.
export function socLevel(value: number, warning: Num, critical: Num): ThresholdLevel {
  if (warning == null || critical == null) return null;
  const v = round2(value);
  if (v <= round2(critical)) return "critical";
  if (v <= round2(warning)) return "warning";
  return "ok";
}

// Overvoltage — cùng quy ước: `voltageMin` là Warning, `voltageMax` là Critical.
export function voltageLevel(value: number, min: Num, max: Num): ThresholdLevel {
  return ascendingLevel(value, min, max);
}

// AbnormalCharging (dòng sạc chạm trần) / RapidDischarge (dòng xả chạm trần) — luôn Critical:
// dòng chỉ có MỘT mốc mỗi chiều nên không có nấc Warning để đứng giữa.
export function currentLevel(value: number, maxCharge: Num, maxDischarge: Num): ThresholdLevel {
  if (maxCharge == null || maxDischarge == null) return null;
  const v = round2(value);
  if (v >= round2(maxCharge)) return "critical";
  if (v < 0 && round2(Math.abs(v)) >= round2(maxDischarge)) return "critical";
  return "ok";
}
