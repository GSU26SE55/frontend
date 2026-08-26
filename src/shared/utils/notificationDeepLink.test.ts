import { describe, expect, it } from "vitest";
import { notificationDeepLink } from "@/shared/utils/notificationDeepLink";
import { NotificationTypeEnum } from "@/shared/enums/notification/notification.enum";
import { UserRole } from "@/shared/enums/account/session.enum";

const ID = "22222222-2222-2222-2222-222222222222";

const notif = (
  over: Partial<Parameters<typeof notificationDeepLink>[0]> = {},
) => ({
  entityType: "Ticket",
  entityId: ID,
  type: NotificationTypeEnum.TicketAssigned,
  ...over,
});

describe("notificationDeepLink", () => {
  it.each([
    [UserRole.ADMIN, `/admin/tickets/${ID}`],
    [UserRole.MANAGER, `/manager/tickets/${ID}`],
    [UserRole.STAFF, `/staff/tickets/${ID}`],
  ])("ticket mở đúng khu vực của %s", (role, expected) => {
    expect(notificationDeepLink(notif(), role)).toBe(expected);
  });

  // Mỗi consumer bên backend tự ghi entityType, đã gặp cả "Ticket", "ticket" và " ticket ".
  it.each(["ticket", "TICKET", "  Ticket  "])(
    "không phụ thuộc hoa thường hay khoảng trắng: %s",
    (entityType) => {
      expect(notificationDeepLink(notif({ entityType }), UserRole.STAFF)).toBe(
        `/staff/tickets/${ID}`,
      );
    },
  );

  // Ticket mới tạo chưa có người nhận: Manager xử lý từ Queue, nên nút Quay lại phải đưa
  // về Queue chứ không phải danh sách ticket đầy đủ.
  it("ticket vừa tạo đưa Manager vào route của Queue", () => {
    const link = notificationDeepLink(
      notif({ type: NotificationTypeEnum.TicketCreated }),
      UserRole.MANAGER,
    );
    expect(link).toBe(`/manager/tickets/queue/${ID}`);
  });

  it("ngoại lệ Queue chỉ áp cho Manager", () => {
    const link = notificationDeepLink(
      notif({ type: NotificationTypeEnum.TicketCreated }),
      UserRole.ADMIN,
    );
    expect(link).toBe(`/admin/tickets/${ID}`);
  });

  it("site chỉ mở được với Admin và Manager", () => {
    const site = notif({ entityType: "Site" });
    expect(notificationDeepLink(site, UserRole.ADMIN)).toBe(
      `/admin/sites/${ID}`,
    );
    expect(notificationDeepLink(site, UserRole.MANAGER)).toBe(
      `/manager/sites/${ID}`,
    );
    // Staff không có trang site — thà mở trong hộp thư còn hơn đá sang /unauthorized.
    expect(notificationDeepLink(site, UserRole.STAFF)).toBeNull();
  });

  it("thiết bị IoT chỉ Admin mở được", () => {
    const device = notif({ entityType: "IotDevice" });
    expect(notificationDeepLink(device, UserRole.ADMIN)).toBe(
      `/admin/iot-devices/${ID}`,
    );
    expect(notificationDeepLink(device, UserRole.MANAGER)).toBeNull();
  });

  it("battery và batteryasset cùng dẫn về một trang", () => {
    expect(
      notificationDeepLink(notif({ entityType: "Battery" }), UserRole.STAFF),
    ).toBe(
      notificationDeepLink(
        notif({ entityType: "BatteryAsset" }),
        UserRole.STAFF,
      ),
    );
  });

  it.each([
    ["thiếu entityType", { entityType: null }],
    ["thiếu entityId", { entityId: null }],
    ["entityType rỗng", { entityType: "" }],
    ["loại thực thể không có trang", { entityType: "SystemBroadcast" }],
  ])("%s thì không sinh liên kết", (_label, over) => {
    expect(notificationDeepLink(notif(over), UserRole.ADMIN)).toBeNull();
  });

  it("chưa biết vai trò thì không sinh liên kết", () => {
    expect(notificationDeepLink(notif(), undefined)).toBeNull();
  });
});
