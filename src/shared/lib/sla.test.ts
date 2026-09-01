import { describe, it, expect } from "vitest";
import {
  SLA_CAUTION_PERCENT,
  SLA_WARNING_PERCENT,
  calculateResponseDeadline,
  formatDurationHuman,
  formatSlaDueAt,
  formatSlaOverdue,
  formatSlaOverdueCompact,
  formatSlaRemaining,
  formatSlaRemainingCompact,
  getResponseSlaHours,
  isNearBreachPercent,
  slaBarColorClass,
  slaComplianceColor,
  slaTextColorClass,
} from "@/shared/lib/sla";
import { TicketPriorityEnum } from "@/shared/enums/ticket/ticket.enum";

const SEC = 1000;
const MIN = 60 * SEC;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe("isNearBreachPercent", () => {
  it.each([0, 1, 24, SLA_WARNING_PERCENT])(
    "%s%% còn lại là sắp vi phạm",
    (pct) => {
      expect(isNearBreachPercent(pct)).toBe(true);
    },
  );

  it.each([26, 50, 100])("%s%% còn lại thì chưa", (pct) => {
    expect(isNearBreachPercent(pct)).toBe(false);
  });

  // Ticket chưa có bộ đếm SLA không được tô đỏ trên bảng — nó chưa hề trễ.
  it.each([null, undefined])(
    "thiếu số liệu (%s) thì coi như còn nguyên",
    (value) => {
      expect(isNearBreachPercent(value)).toBe(false);
    },
  );
});

describe("thang màu theo phần trăm còn lại", () => {
  it("cả màu chữ và màu thanh dùng chung một ngưỡng", () => {
    for (const pct of [0, 10, 25, 26, 50, 51, 100]) {
      const text = slaTextColorClass(pct).replace("text-", "");
      const bar = slaBarColorClass(pct).replace("bg-", "");
      expect(text).toBe(bar);
    }
  });

  it("trên 50% là an toàn", () => {
    expect(slaBarColorClass(51)).toBe("bg-sla-ok");
  });

  it("đúng 50% đã tụt xuống mức cảnh báo nhẹ", () => {
    expect(slaBarColorClass(SLA_CAUTION_PERCENT)).toBe("bg-sla-caution");
  });

  it("đúng 25% là mức đỏ", () => {
    expect(slaBarColorClass(SLA_WARNING_PERCENT)).toBe("bg-sla-warning");
  });

  // Thiếu số liệu thì mặc định 0 — thanh đỏ, khớp với hàm cùng nhóm ở trên.
  it.each([null, undefined])("thiếu số liệu (%s) rơi về mức đỏ", (value) => {
    expect(slaBarColorClass(value)).toBe("bg-sla-warning");
  });
});

describe("slaComplianceColor", () => {
  it.each([
    [100, "var(--ok)"],
    [90, "var(--ok)"],
    [89, "var(--p3)"],
    [70, "var(--p3)"],
    [69, "var(--p1)"],
    [0, "var(--p1)"],
  ])("%s%% tuân thủ → %s", (pct, expected) => {
    expect(slaComplianceColor(pct)).toBe(expected);
  });

  // Chưa có ticket nào đóng thì tỉ lệ tuân thủ không tồn tại — không phải bằng 0%.
  // Tô đỏ ở đây sẽ báo động về một con số chưa hề đo được.
  it.each([null, undefined])(
    "thiếu số liệu (%s) dùng màu trung tính",
    (value) => {
      expect(slaComplianceColor(value)).toBe("var(--muted-foreground)");
    },
  );
});

describe("formatSlaRemaining", () => {
  it("dưới một ngày giữ nguyên dạng giờ:phút:giây", () => {
    expect(formatSlaRemaining(17 * HOUR + 45 * MIN + 55 * SEC)).toBe(
      "17:45:55",
    );
  });

  // Một ticket P3 nhiều ngày từng hiện "281:45:55" — không ai đọc ra 11 ngày.
  it("từ một ngày trở lên thì tách phần ngày ra trước", () => {
    expect(formatSlaRemaining(11 * DAY + 17 * HOUR + 45 * MIN + 55 * SEC)).toBe(
      "11d 17:45:55",
    );
  });

  it("đệm số 0 cho đủ hai chữ số", () => {
    expect(formatSlaRemaining(1 * HOUR + 2 * MIN + 3 * SEC)).toBe("01:02:03");
  });

  it.each([0, -1, -5 * HOUR])("đã quá hạn (%s ms) hiện 00:00:00", (ms) => {
    expect(formatSlaRemaining(ms)).toBe("00:00:00");
  });

  it("đúng ranh giới 24 giờ bắt đầu hiện phần ngày", () => {
    expect(formatSlaRemaining(DAY)).toBe("1d 00:00:00");
    expect(formatSlaRemaining(DAY - SEC)).toBe("23:59:59");
  });
});

describe("formatSlaRemainingCompact", () => {
  it.each([
    [11 * DAY + 17 * HOUR, "11d"],
    [17 * HOUR + 45 * MIN, "17h"],
    [45 * MIN + 30 * SEC, "45m"],
    [30 * SEC, "30s"],
    [0, "0s"],
  ])("%s ms → %s", (ms, expected) => {
    expect(formatSlaRemainingCompact(ms)).toBe(expected);
  });

  // Quá hạn thì ô trên bảng vẫn phải đọc được, không được ra số âm.
  it("thời gian âm bị kẹp về 0s", () => {
    expect(formatSlaRemainingCompact(-5 * HOUR)).toBe("0s");
  });
});

describe("formatSlaOverdue", () => {
  it("dưới một ngày hiện +HH:mm:ss", () => {
    expect(formatSlaOverdue(1 * HOUR + 23 * MIN + 45 * SEC)).toBe("+01:23:45");
  });

  it("từ một ngày trở lên tách phần ngày ra trước", () => {
    expect(formatSlaOverdue(3 * DAY + 4 * HOUR + 12 * MIN)).toBe("+3d 04:12:00");
  });

  it("chấp nhận ms âm (Math.abs nội bộ)", () => {
    expect(formatSlaOverdue(-1 * HOUR)).toBe("+01:00:00");
  });

  it("đệm số 0 đủ hai chữ số", () => {
    expect(formatSlaOverdue(1 * HOUR + 2 * MIN + 3 * SEC)).toBe("+01:02:03");
  });

  it("đúng ranh giới 24 giờ", () => {
    expect(formatSlaOverdue(DAY)).toBe("+1d 00:00:00");
    expect(formatSlaOverdue(DAY - SEC)).toBe("+23:59:59");
  });
});

describe("formatSlaOverdueCompact", () => {
  it.each([
    [3 * DAY + 4 * HOUR, "+3d"],
    [17 * HOUR + 30 * MIN, "+17h"],
    [45 * MIN + 10 * SEC, "+45m"],
    [30 * SEC, "+30s"],
    [0, "+0s"],
  ])("%s ms → %s", (ms, expected) => {
    expect(formatSlaOverdueCompact(ms)).toBe(expected);
  });

  it("ms âm vẫn hiện dấu + (Math.abs nội bộ)", () => {
    expect(formatSlaOverdueCompact(-2 * HOUR)).toBe("+2h");
  });
});

describe("formatSlaDueAt", () => {
  it("hiện ngày/tháng giờ:phút theo giờ địa phương", () => {
    const due = new Date(2026, 4, 9, 17, 0);
    expect(formatSlaDueAt(due.toISOString())).toBe("09/05 17:00");
  });

  it("đệm 0 cho ngày và tháng một chữ số", () => {
    const due = new Date(2026, 0, 3, 7, 5);
    expect(formatSlaDueAt(due.toISOString())).toBe("03/01 07:05");
  });

  // Backend có thể trả null/chuỗi rác cho ticket chưa có hạn — ô phải trống, không hiện NaN.
  it.each(["", "không-phải-ngày", "2026-13-45"])(
    "chuỗi không đọc được (%s) trả về rỗng",
    (value) => {
      expect(formatSlaDueAt(value)).toBe("");
    },
  );
});

describe("getResponseSlaHours", () => {
  it("P1Critical có hạn response 4h", () => {
    expect(getResponseSlaHours(TicketPriorityEnum.P1Critical)).toBe(4);
  });

  it("P2High có hạn response 24h", () => {
    expect(getResponseSlaHours(TicketPriorityEnum.P2High)).toBe(24);
  });

  it("P3Normal hoặc mặc định có hạn response 72h", () => {
    expect(getResponseSlaHours(TicketPriorityEnum.P3Normal)).toBe(72);
    expect(getResponseSlaHours(null)).toBe(72);
    expect(getResponseSlaHours(undefined)).toBe(72);
  });
});

describe("calculateResponseDeadline", () => {
  it("tính đúng deadline theo giờ cho P1 (4h)", () => {
    const start = new Date("2026-08-31T10:00:00Z");
    const deadline = calculateResponseDeadline(
      start.toISOString(),
      TicketPriorityEnum.P1Critical,
    );
    expect(deadline?.toISOString()).toBe("2026-08-31T14:00:00.000Z");
  });

  it("trả về null nếu createdAt không hợp lệ", () => {
    expect(
      calculateResponseDeadline("invalid-date", TicketPriorityEnum.P1Critical),
    ).toBeNull();
  });
});

describe("formatDurationHuman", () => {
  it.each([
    [15 * MIN, "15m"],
    [45 * MIN, "45m"],
    [2 * HOUR + 15 * MIN, "2h 15m"],
    [2 * HOUR, "2h"],
    [1 * DAY + 4 * HOUR, "1d 4h"],
    [2 * DAY, "2d"],
    [30 * SEC, "30s"],
  ])("%s ms → %s", (ms, expected) => {
    expect(formatDurationHuman(ms)).toBe(expected);
  });
});
