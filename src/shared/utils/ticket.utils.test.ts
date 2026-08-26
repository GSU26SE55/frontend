import { describe, expect, it } from "vitest";
import {
  formatLogDuration,
  isOpenTicket,
  isTicketChatLocked,
} from "@/shared/utils/ticket.utils";
import { TicketStatusEnum } from "@/shared/enums/ticket/ticket.enum";
import type { TicketDTO } from "@/shared/types/ticket/ticket.types";
import { plural, statusLine } from "@/shared/utils/plural";

const ticket = (status: TicketStatusEnum) => ({ status }) as TicketDTO;

const TERMINAL: TicketStatusEnum[] = [
  TicketStatusEnum.Completed,
  TicketStatusEnum.Closed,
  TicketStatusEnum.ClosedRejected,
];

const ACTIVE = (Object.values(TicketStatusEnum) as TicketStatusEnum[]).filter(
  (s) => !TERMINAL.includes(s),
);

describe("isOpenTicket", () => {
  it.each(ACTIVE)("%s vẫn đang mở", (status) => {
    expect(isOpenTicket(ticket(status))).toBe(true);
  });

  it.each(TERMINAL)("%s đã kết thúc vòng đời", (status) => {
    expect(isOpenTicket(ticket(status))).toBe(false);
  });
});

describe("isTicketChatLocked", () => {
  // Khoá theo đúng bộ trạng thái của isOpenTicket. Hai hàm lệch nhau sẽ ra cảnh ticket
  // hiện là "đã đóng" nhưng ô nhập tin nhắn vẫn mở.
  it("khoá đúng bằng phần bù của isOpenTicket", () => {
    for (const status of Object.values(
      TicketStatusEnum,
    ) as TicketStatusEnum[]) {
      expect(isTicketChatLocked(status)).toBe(!isOpenTicket(ticket(status)));
    }
  });

  // Trang chi tiết gọi hàm này trước khi tải xong ticket. Khoá lúc chưa biết trạng thái sẽ
  // làm ô nhập nhấp nháy từ khoá sang mở mỗi lần vào trang.
  it.each([null, undefined])(
    "chưa biết trạng thái (%s) thì chưa khoá",
    (status) => {
      expect(isTicketChatLocked(status)).toBe(false);
    },
  );
});

describe("formatLogDuration", () => {
  it.each([
    [45, "45m"],
    [504, "8h 24m"],
    [120, "2h"],
    [60, "1h"],
    [0, "0m"],
  ])("%s phút → %s", (minutes, expected) => {
    expect(formatLogDuration(minutes)).toBe(expected);
  });

  it("làm tròn phút lẻ", () => {
    expect(formatLogDuration(90.4)).toBe("1h 30m");
    expect(formatLogDuration(90.6)).toBe("1h 31m");
  });

  // Chênh lệch múi giờ từng cho ra thời lượng âm; ô phải đọc được thay vì hiện "-3h".
  it("số âm bị kẹp về 0", () => {
    expect(formatLogDuration(-30)).toBe("0m");
  });
});

describe("plural", () => {
  it("số một dùng dạng số ít", () => {
    expect(plural(1, "battery", "batteries")).toBe("1 battery");
  });

  it.each([0, 2, 15])("số %s dùng dạng số nhiều", (n) => {
    expect(plural(n, "battery", "batteries")).toBe(`${n} batteries`);
  });
});

describe("statusLine", () => {
  it("nối các vấn đề thành một câu", () => {
    expect(statusLine(["2 batteries offline", "1 alert"], "Tất cả ổn")).toBe(
      "2 batteries offline, 1 alert.",
    );
  });

  it("không có vấn đề nào thì dùng câu báo yên", () => {
    expect(statusLine([], "Tất cả ổn")).toBe("Tất cả ổn");
  });
});
