import { describe, expect, it } from "vitest";
import { P, checkPermission, checkRole } from "@/shared/lib/authz";
import { UserRole } from "@/shared/enums/account/session.enum";
import type { SessionUser } from "@/shared/types/account/session.types";

const user = (over: Partial<SessionUser> = {}): SessionUser => ({
  accountId: "acc-1",
  email: "staff@test.local",
  fullName: "Nhân viên",
  role: UserRole.STAFF,
  permissions: [P.TICKET_VIEW, P.TICKET_RESOLVE],
  ...over,
});

describe("checkPermission", () => {
  it("cho phép khi quyền nằm trong danh sách của token", () => {
    expect(checkPermission(user(), P.TICKET_VIEW)).toBe(true);
  });

  it("từ chối khi quyền không có trong token", () => {
    expect(checkPermission(user(), P.TICKET_ASSIGN)).toBe(false);
  });

  // Lúc khởi động phiên, người dùng còn là null trong một khoảng ngắn. Nếu hàm này ném lỗi
  // hoặc trả true ở đó thì nút bị lộ ra trước khi biết người dùng là ai.
  it.each([null, undefined])("từ chối khi chưa có phiên (%s)", (value) => {
    expect(checkPermission(value, P.TICKET_VIEW)).toBe(false);
  });

  it("không bỏ qua hoa thường — mã quyền phải khớp đúng chuỗi của backend", () => {
    const admin = user({ permissions: ["TICKET.VIEW"] });
    expect(checkPermission(admin, P.TICKET_VIEW)).toBe(false);
  });

  it("người dùng không có quyền nào thì mọi kiểm tra đều trượt", () => {
    const stripped = user({ permissions: [] });
    expect(checkPermission(stripped, P.TICKET_VIEW)).toBe(false);
  });
});

describe("checkRole", () => {
  it("khớp khi vai trò nằm trong danh sách được phép", () => {
    expect(checkRole(user(), UserRole.STAFF, UserRole.MANAGER)).toBe(true);
  });

  it("không khớp khi vai trò nằm ngoài danh sách", () => {
    expect(checkRole(user(), UserRole.ADMIN)).toBe(false);
  });

  it.each([null, undefined])("từ chối khi chưa có phiên (%s)", (value) => {
    expect(checkRole(value, UserRole.STAFF)).toBe(false);
  });

  it("gọi không truyền vai trò nào thì không ai qua được", () => {
    expect(checkRole(user())).toBe(false);
  });
});

describe("bảng mã quyền P", () => {
  // Danh sách này phản chiếu PermissionCodes.cs bên backend. Một mã viết sai ở đây sẽ
  // không bao giờ khớp với perm[] trong JWT, và nút tương ứng lặng lẽ biến mất.
  it("mọi mã đều theo dạng module.action viết thường", () => {
    const offenders = Object.entries(P).filter(
      ([, code]) => !/^[a-z_]+(\.[a-z_]+)+$/.test(code as string),
    );
    expect(offenders).toEqual([]);
  });

  it("không có mã nào bị trùng", () => {
    const codes = Object.values(P) as string[];
    expect(new Set(codes).size).toBe(codes.length);
  });
});
