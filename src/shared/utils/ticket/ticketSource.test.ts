import { describe, it, expect } from "vitest";
import { getTicketSource } from "@/shared/utils/ticket/ticketSource";
import {
  TicketOriginEnum,
  TicketSourceFilterEnum,
} from "@/shared/enums/ticket/ticket.enum";

describe("getTicketSource", () => {
  it("origin AutoFromEnvironment là Environmental", () => {
    const s = getTicketSource({
      origin: TicketOriginEnum.AutoFromEnvironment,
    });
    expect(s.key).toBe(TicketSourceFilterEnum.Environmental);
    expect(s.label).toBe("Environmental");
  });

  it("incident thiết bị tự báo (DÒNG CŨ) vẫn là Environmental", () => {
    // Lưới an toàn: ticket tạo trước khi có origin AutoFromEnvironment vẫn mang System
    // nhưng có environmentalIncidentId.
    expect(
      getTicketSource({
        origin: TicketOriginEnum.System,
        environmentalIncidentId: "abc",
      }).key,
    ).toBe(TicketSourceFilterEnum.Environmental);
  });

  it("alert của một viên pin là AI predicted — KHÔNG phụ thuộc impactScope", () => {
    // Đúng ca đã gặp (TKT-2609-0001): alert Overheat của 1 viên pin →
    // Origin=AutoFromAlert. Sau đó Manager Re-prioritize đổi ImpactScope sang Site.
    // Source là nguồn gốc cứng nên vẫn phải là "AI predicted", không được nhảy sang
    // "Environmental" chỉ vì scope bị sửa.
    expect(
      getTicketSource({
        origin: TicketOriginEnum.AutoFromAlert,
      }).key,
    ).toBe(TicketSourceFilterEnum.AiPredicted);
  });

  it("cascade risk (Origin=System, không có cờ bảo trì/môi trường) là Cascade risk — KHÔNG phải AI predicted", () => {
    // Cascade risk là rule-based cộng điểm cứng, không có ML tham gia — gộp chung với AI
    // predicted (alert do AI module chấm) từng gây hiểu lầm là có AI đứng sau.
    expect(
      getTicketSource({
        origin: TicketOriginEnum.System,
      }).key,
    ).toBe(TicketSourceFilterEnum.CascadeRisk);
  });

  it("bảo trì định kỳ tách khỏi các luồng System khác", () => {
    expect(
      getTicketSource({
        origin: TicketOriginEnum.System,
        isPeriodicMaintenance: true,
      }).key,
    ).toBe(TicketSourceFilterEnum.PeriodicMaintenance);
  });

  it("khách tự tạo là Customer", () => {
    expect(
      getTicketSource({ origin: TicketOriginEnum.ManualByCustomer }).key,
    ).toBe(TicketSourceFilterEnum.Customer);
  });
});
