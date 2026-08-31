import { describe, it, expect } from "vitest";
import { getTicketSource } from "@/shared/utils/ticket/ticketSource";
import {
  TicketOriginEnum,
  TicketSourceFilterEnum,
  ImpactScopeEnum,
} from "@/shared/enums/ticket/ticket.enum";

describe("getTicketSource", () => {
  it("alert ambient cấp site là Environmental, không phải AI predicted", () => {
    // Đúng ca đã gặp: HighAmbientTemp → ticket Origin=AutoFromAlert, ImpactScope=Site,
    // không có environmentalIncidentId. Trước fix nó bị dán nhãn "AI predicted" và biến
    // mất khỏi bộ lọc Environmental.
    const s = getTicketSource({
      origin: TicketOriginEnum.AutoFromAlert,
      impactScope: ImpactScopeEnum.Site,
    });
    expect(s.key).toBe(TicketSourceFilterEnum.Environmental);
    expect(s.label).toBe("Environmental");
  });

  it("alert của một viên pin vẫn là AI predicted", () => {
    expect(
      getTicketSource({
        origin: TicketOriginEnum.AutoFromAlert,
        impactScope: ImpactScopeEnum.SingleAsset,
      }).key,
    ).toBe(TicketSourceFilterEnum.AiPredicted);
  });

  it("incident thiết bị tự báo vẫn là Environmental", () => {
    expect(
      getTicketSource({
        origin: TicketOriginEnum.System,
        environmentalIncidentId: "abc",
        impactScope: ImpactScopeEnum.Site,
      }).key,
    ).toBe(TicketSourceFilterEnum.Environmental);
  });

  it("cascade risk cũng ImpactScope=Site nhưng Origin=System → vẫn AI predicted", () => {
    // Đây là lý do điều kiện phải kèm Origin: chỉ luồng auto-from-alert mới dùng
    // AutoFromAlert, cascade-risk / bảo trì / incident đều là System.
    expect(
      getTicketSource({
        origin: TicketOriginEnum.System,
        impactScope: ImpactScopeEnum.Site,
      }).key,
    ).toBe(TicketSourceFilterEnum.AiPredicted);
  });

  it("bảo trì định kỳ và khách tự tạo không bị ảnh hưởng", () => {
    expect(
      getTicketSource({
        origin: TicketOriginEnum.System,
        isPeriodicMaintenance: true,
        impactScope: ImpactScopeEnum.Site,
      }).key,
    ).toBe(TicketSourceFilterEnum.PeriodicMaintenance);
    expect(
      getTicketSource({ origin: TicketOriginEnum.ManualByCustomer }).key,
    ).toBe(TicketSourceFilterEnum.Customer);
  });
});
