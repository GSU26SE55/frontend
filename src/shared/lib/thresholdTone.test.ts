import { describe, it, expect } from "vitest";
import {
  temperatureLevel,
  socLevel,
  voltageLevel,
  currentLevel,
} from "@/shared/lib/thresholdTone";

// Ngưỡng seed của loại pin LiFePO4 12V.
const TEMP_MIN = -10;
const TEMP_MAX = 60;

describe("temperatureLevel", () => {
  it("dưới ngưỡng trần là ok — kể cả sát ngưỡng", () => {
    // Chính là ca bug: code cũ cảnh báo từ `max - 10` nên 50–59°C nháy vàng vô cớ.
    expect(temperatureLevel(50, TEMP_MIN, TEMP_MAX)).toBe("ok");
    expect(temperatureLevel(59.9, TEMP_MIN, TEMP_MAX)).toBe("ok");
    expect(temperatureLevel(TEMP_MAX, TEMP_MIN, TEMP_MAX)).toBe("ok");
  });

  it("vượt trần là warning, vượt quá 5°C là critical", () => {
    expect(temperatureLevel(60.1, TEMP_MIN, TEMP_MAX)).toBe("warning");
    expect(temperatureLevel(65, TEMP_MIN, TEMP_MAX)).toBe("warning");
    expect(temperatureLevel(65.1, TEMP_MIN, TEMP_MAX)).toBe("critical");
  });

  it("dưới sàn là warning, thấp hơn sàn quá 5°C là critical", () => {
    expect(temperatureLevel(-10.1, TEMP_MIN, TEMP_MAX)).toBe("warning");
    expect(temperatureLevel(-15.1, TEMP_MIN, TEMP_MAX)).toBe("critical");
  });

  it("chưa cấu hình ngưỡng → null, không đoán mặc định", () => {
    expect(temperatureLevel(80, null, null)).toBeNull();
  });
});

describe("socLevel", () => {
  it("so sánh ngặt, khớp AnomalyRules", () => {
    expect(socLevel(9, 20, 10)).toBe("critical");
    expect(socLevel(10, 20, 10)).toBe("warning"); // đúng bằng critical vẫn chỉ là warning
    expect(socLevel(19, 20, 10)).toBe("warning");
    expect(socLevel(20, 20, 10)).toBe("ok");
    expect(socLevel(5, null, undefined)).toBeNull();
  });
});

describe("voltageLevel / currentLevel", () => {
  it("ngoài dải là critical, không có vùng warning", () => {
    expect(voltageLevel(10.4, 10.5, 14.6)).toBe("critical");
    expect(voltageLevel(10.5, 10.5, 14.6)).toBe("ok");
    expect(voltageLevel(14.7, 10.5, 14.6)).toBe("critical");
    expect(voltageLevel(12, null, 14.6)).toBeNull();
  });

  it("dòng: sạc vượt trần và xả vượt trần đều critical", () => {
    expect(currentLevel(51, 50, 80)).toBe("critical");
    expect(currentLevel(50, 50, 80)).toBe("ok");
    expect(currentLevel(-81, 50, 80)).toBe("critical");
    expect(currentLevel(-80, 50, 80)).toBe("ok");
    expect(currentLevel(10, null, 80)).toBeNull();
  });
});

// Card Realtime hiển thị 1 chữ số thập phân, nhưng chấm màu phải chốt ở 2 — nếu không, mọi vi
// phạm nằm ở chữ số thứ hai sẽ bị bỏ sót trong khi engine cảnh báo BE vẫn bắt.
describe("chốt 2 chữ số thập phân", () => {
  it("vi phạm ở chữ số thập phân thứ hai vẫn bị bắt, dù hiện ra là 26.9", () => {
    expect((26.94).toFixed(1)).toBe("26.9"); // đúng cái người dùng nhìn thấy
    expect(voltageLevel(26.94, 25, 26.9)).toBe("critical");
    expect(voltageLevel(26.9, 25, 26.9)).toBe("ok");
  });

  it("chữ số thứ ba trở đi bị làm tròn về 2 — không tự sinh vi phạm", () => {
    expect(voltageLevel(26.904, 25, 26.9)).toBe("ok");
    expect(voltageLevel(26.9049, 25, 26.9)).toBe("ok");
    expect(voltageLevel(26.905, 25, 26.9)).toBe("critical"); // làm tròn thành 26.91
  });

  it("dòng xả cũng chốt 2 chữ số", () => {
    expect(currentLevel(-3.004, 3, 3)).toBe("ok");
    expect(currentLevel(-3.02, 3, 3)).toBe("critical");
  });

  it("nhiệt độ: biên critical không bị sai số nhị phân lật kết quả", () => {
    expect(temperatureLevel(37.6, 32.5, 32.6)).toBe("warning"); // đúng mốc max+5 → chưa critical
    expect(temperatureLevel(37.61, 32.5, 32.6)).toBe("critical");
    expect(temperatureLevel(32.64, 32.5, 32.6)).toBe("warning"); // hiện "32.6" nhưng đã vượt
  });

  it("SOC chốt 2 chữ số", () => {
    expect(socLevel(90.96, 91, 90)).toBe("warning"); // hiện "91" nhưng vẫn dưới sàn
    expect(socLevel(91, 91, 90)).toBe("ok");
  });
});
