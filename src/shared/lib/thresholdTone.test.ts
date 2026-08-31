import { describe, it, expect } from "vitest";
import {
  temperatureLevel,
  socLevel,
  voltageLevel,
  currentLevel,
} from "@/shared/lib/thresholdTone";

// Min = mốc Warning, Max = mốc Critical — thang một chiều, không phải dải an toàn.
const TEMP_WARN = 45;
const TEMP_CRIT = 50;

describe("temperatureLevel", () => {
  it("dưới mốc Warning là ok", () => {
    expect(temperatureLevel(25, TEMP_WARN, TEMP_CRIT)).toBe("ok");
    expect(temperatureLevel(44.99, TEMP_WARN, TEMP_CRIT)).toBe("ok");
  });

  // Hai mốc đều là số Admin đặt, và so sánh BAO GỒM mốc: đặt 45 nghĩa là "từ 45 trở lên báo".
  // Đây là bộ test vỡ nếu ai đưa hằng ±5 quay lại, hoặc đổi `>=` về `>` làm lệch với BE.
  it("đạt tới Warning là warning, đạt tới Critical là critical", () => {
    expect(temperatureLevel(TEMP_WARN, TEMP_WARN, TEMP_CRIT)).toBe("warning");
    expect(temperatureLevel(45.1, TEMP_WARN, TEMP_CRIT)).toBe("warning");
    expect(temperatureLevel(49.99, TEMP_WARN, TEMP_CRIT)).toBe("warning");
    expect(temperatureLevel(TEMP_CRIT, TEMP_WARN, TEMP_CRIT)).toBe("critical");
    expect(temperatureLevel(50.1, TEMP_WARN, TEMP_CRIT)).toBe("critical");
  });

  // Phía thấp KHÔNG tô màu: BE không còn rule `Undertemp` nên tô là hứa một cảnh báo không có.
  it("số đo thấp không phải vi phạm", () => {
    expect(temperatureLevel(-30, TEMP_WARN, TEMP_CRIT)).toBe("ok");
  });

  it("chưa cấu hình ngưỡng → null, không đoán mặc định", () => {
    expect(temperatureLevel(80, null, null)).toBeNull();
  });
});

describe("socLevel", () => {
  // SOC là chiều ngược — thấp mới là vi phạm — nhưng cùng luật "đạt tới mốc là đã vi phạm".
  it("bao gồm mốc, khớp AnomalyRules", () => {
    expect(socLevel(9, 20, 10)).toBe("critical");
    expect(socLevel(10, 20, 10)).toBe("critical"); // đúng bằng critical → đã critical
    expect(socLevel(19, 20, 10)).toBe("warning");
    expect(socLevel(20, 20, 10)).toBe("warning"); // đúng bằng warning → đã warning
    expect(socLevel(20.01, 20, 10)).toBe("ok");
    expect(socLevel(5, null, undefined)).toBeNull();
  });
});

describe("voltageLevel / currentLevel", () => {
  it("điện áp cùng quy ước: đạt tới min là warning, đạt tới max là critical", () => {
    expect(voltageLevel(13.99, 14, 15)).toBe("ok");
    expect(voltageLevel(14, 14, 15)).toBe("warning");
    expect(voltageLevel(15, 14, 15)).toBe("critical");
    expect(voltageLevel(9, 14, 15)).toBe("ok"); // sụt áp không còn là vi phạm
  });

  it("dòng: chạm trần sạc hoặc trần xả đều critical", () => {
    expect(currentLevel(51, 50, 80)).toBe("critical");
    expect(currentLevel(50, 50, 80)).toBe("critical"); // đúng bằng trần → đã vi phạm
    expect(currentLevel(49.99, 50, 80)).toBe("ok");
    expect(currentLevel(-81, 50, 80)).toBe("critical");
    expect(currentLevel(-80, 50, 80)).toBe("critical");
    expect(currentLevel(-79.99, 50, 80)).toBe("ok");
    expect(currentLevel(10, null, 80)).toBeNull();
  });
});

// Card Realtime hiển thị 1 chữ số thập phân, nhưng chấm màu phải chốt ở 2 — nếu không, mọi vi
// phạm nằm ở chữ số thứ hai sẽ bị bỏ sót trong khi engine cảnh báo BE vẫn bắt.
describe("chốt 2 chữ số thập phân", () => {
  it("vi phạm ở chữ số thập phân thứ hai vẫn bị bắt, dù hiện ra là 26.9", () => {
    expect((26.94).toFixed(1)).toBe("26.9"); // đúng cái người dùng nhìn thấy
    expect(voltageLevel(26.94, 26.95, 30)).toBe("ok"); // chưa chạm mốc
    expect(voltageLevel(26.95, 26.95, 30)).toBe("warning"); // đúng bằng mốc → đã vi phạm
    expect(voltageLevel(30, 26.95, 30)).toBe("critical"); // cùng luật ở mốc Critical
  });

  it("chữ số thứ ba trở đi bị làm tròn về 2 — không tự sinh vi phạm", () => {
    expect(voltageLevel(26.944, 26.95, 30)).toBe("ok");
    expect(voltageLevel(26.9449, 26.95, 30)).toBe("ok");
    expect(voltageLevel(26.945, 26.95, 30)).toBe("warning"); // làm tròn thành 26.95
  });

  it("dòng xả cũng chốt 2 chữ số", () => {
    expect(currentLevel(-2.994, 3, 3)).toBe("ok"); // làm tròn 2.99 → chưa chạm trần
    expect(currentLevel(-3.004, 3, 3)).toBe("critical"); // làm tròn 3.00 → đã chạm trần
  });

  it("nhiệt độ: biên critical không bị sai số nhị phân lật kết quả", () => {
    expect(temperatureLevel(32.6, 32.5, 32.6)).toBe("critical"); // đúng mốc critical → đã critical
    expect(temperatureLevel(32.59, 32.5, 32.6)).toBe("warning");
    expect(temperatureLevel(32.54, 32.5, 32.6)).toBe("warning"); // hiện "32.5" nhưng đã chạm mốc
  });

  it("SOC chốt 2 chữ số", () => {
    expect(socLevel(90.96, 91, 90)).toBe("warning"); // hiện "91" nhưng vẫn dưới mốc
    expect(socLevel(91.004, 91, 90)).toBe("warning"); // làm tròn 91.00 → đúng mốc, đã vi phạm
    expect(socLevel(91.005, 91, 90)).toBe("ok"); // làm tròn 91.01 → trên mốc
  });
});
